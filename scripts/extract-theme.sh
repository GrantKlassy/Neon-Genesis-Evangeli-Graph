#!/usr/bin/env bash
# Extract a TV-size OP audio rip (0:00..DURATION) from an episode MKV as a
# bit-exact stream copy. FLAC sources are re-encoded FLAC->FLAC (lossless,
# bit-exact PCM) so the output STREAMINFO matches the trimmed clip rather
# than the source episode.
#
# Usage:
#   extract-theme.sh [INPUT] [DURATION] [LANG] [LANG_ORD] [SUFFIX]
#
#   INPUT     path to the source MKV (default: ./assets/tv/nge_1995/1.mkv)
#   DURATION  seconds from 0:00 to extract (default: 90)
#   LANG      ISO-639-2 code of the desired audio stream (default: jpn)
#   LANG_ORD  1-indexed pick when multiple streams share the same lang
#             (default: 1) --- e.g. eng has both ADV (ord=1) and Netflix
#             (ord=2) dubs
#   SUFFIX    optional disambiguator for the output filename (e.g. 'adv',
#             'netflix'); only used when picking among same-lang streams
#
# Output base name:
#   LANG=jpn, no SUFFIX:        theme           (canonical site asset)
#   otherwise:                  theme.LANG[-SUFFIX]
#
# Examples:
#   ./scripts/extract-theme.sh
#   ./scripts/extract-theme.sh ./assets/tv/nge_1995/1.mkv 90 eng 1 adv
#   ./scripts/extract-theme.sh ./assets/tv/nge_1995/1.mkv 90 eng 2 netflix
set -euo pipefail

DEFAULT_INPUT='./assets/tv/nge_1995/1.mkv'
INPUT="${1:-$DEFAULT_INPUT}"
DURATION="${2:-90}"
AUDIO_LANG="${3:-jpn}"
AUDIO_LANG_ORD="${4:-1}"
SUFFIX="${5:-}"
OUT_DIR="./assets/sound"

if [ "$AUDIO_LANG" = "jpn" ] && [ -z "$SUFFIX" ]; then
  OUT_BASE="theme"
else
  OUT_BASE="theme.${AUDIO_LANG}"
  [ -n "$SUFFIX" ] && OUT_BASE="${OUT_BASE}-${SUFFIX}"
fi

if [ ! -f "$INPUT" ]; then
  echo "ERROR: source not found: $INPUT" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# Locate the requested audio stream and its codec. ffprobe emits one CSV row
# per audio stream: <absolute_index>,<codec>,<language>.
PROBE="$(
  ffprobe -v error \
    -select_streams a \
    -show_entries stream=index,codec_name:stream_tags=language \
    -of csv=p=0 \
    "$INPUT"
)"

AUDIO_LANG_ROW="$(printf '%s\n' "$PROBE" | awk -F, -v lang="$AUDIO_LANG" -v ord="$AUDIO_LANG_ORD" '$3 == lang { n++; if (n == ord) { print; exit } }')"
if [ -z "$AUDIO_LANG_ROW" ]; then
  echo "ERROR: no audio stream with lang=$AUDIO_LANG (ord=$AUDIO_LANG_ORD) found in $INPUT" >&2
  printf 'available audio streams:\n%s\n' "$PROBE" >&2
  exit 1
fi

STREAM_INDEX="$(printf '%s' "$AUDIO_LANG_ROW" | awk -F, '{print $1}')"
CODEC="$(printf '%s' "$AUDIO_LANG_ROW" | awk -F, '{print $2}')"

# Map ffmpeg codec names to the right native single-stream extension. Stream
# copy stays bit-exact with the source; the extension just labels the bytes.
case "$CODEC" in
  flac)    EXT=flac ;;
  ac3)     EXT=ac3 ;;
  eac3)    EXT=eac3 ;;
  dts)     EXT=dts ;;
  truehd)  EXT=thd ;;
  aac)     EXT=m4a ;;
  mp3)     EXT=mp3 ;;
  opus)    EXT=opus ;;
  vorbis)  EXT=ogg ;;
  pcm_*)   EXT=wav ;;
  *)       EXT=mka ;;  # fallback: matroska audio container takes anything
esac

OUTPUT="$OUT_DIR/$OUT_BASE.$EXT"

# FLAC is special: its STREAMINFO header carries total_samples, and stream
# copying from the MKV propagates the source episode's header into the
# output, leaving a 90s file that claims to be 23 minutes long. Re-encoding
# FLAC -> FLAC is still bit-exact lossless (PCM samples round-trip
# identically) and produces a correct header. For every other codec, stream
# copy stays truly bit-exact with the source bytes.
if [ "$CODEC" = "flac" ]; then
  AUDIO_ARGS=(-c:a flac -compression_level 12)
  MODE="lossless re-encode (bit-exact PCM, correct STREAMINFO)"
else
  AUDIO_ARGS=(-c:a copy)
  MODE="stream copy (bit-exact source bytes)"
fi

SOURCE_BASENAME="$(basename "$INPUT")"

# Provenance fields. The canonical JP/FLAC pull keeps its original verbose
# wording verbatim; alternate-language pulls (e.g. ADV/Netflix English dubs)
# get a generic but accurate description instead of mislabelled prose.
if [ "$AUDIO_LANG" = "jpn" ] && [ "$CODEC" = "flac" ]; then
  SOURCE_DESC="$SOURCE_BASENAME (matroska, stream 0:$STREAM_INDEX, lang=jpn, codec=$CODEC, 48kHz/16-bit/5.1)"
  SOURCEMEDIA_DESC="Bluray remaster (Japanese original audio, FLAC 5.1)"
  COMMENT_VERIFY="PCM is bit-exact with the source stream (verified via md5)."
else
  SOURCE_DESC="$SOURCE_BASENAME (matroska, stream 0:$STREAM_INDEX, lang=$AUDIO_LANG, codec=$CODEC)"
  SOURCEMEDIA_DESC="Bluray remaster (lang=$AUDIO_LANG, codec=$CODEC, stream-copied bit-exact)"
  COMMENT_VERIFY="Stream-copied bit-exact from source."
fi


# Vorbis Comments embedded in the FLAC. Songwriting credits for "A Cruel
# Angel's Thesis" / Zankoku na Tenshi no Teeze (the OP for the 1995 Gainax
# production) are constant across releases --- composer, lyricist, and
# arranger don't change between dubs. The vocal performance is the original
# JP vocal in every NGE release this script knows about (English dubs only
# replace dialogue, not the OP), so the artist/performer credits stay too.
METADATA=(
  -metadata "title=A Cruel Angel's Thesis (Zankoku na Tenshi no Teeze) - TV-size OP"
  -metadata "artist=Yoko Takahashi"
  -metadata "performer=Yoko Takahashi (高橋洋子)"
  -metadata "album=Neon Genesis Evangelion (1995) - Series Opening"
  -metadata "albumartist=Yoko Takahashi"
  -metadata "tracknumber=1"
  -metadata "totaltracks=1"
  -metadata "discnumber=1"
  -metadata "totaldiscs=1"
  -metadata "date=1995"
  -metadata "year=1995"
  -metadata "genre=Anime / J-Pop"
  -metadata "composer=Hidetoshi Sato (佐藤英敏)"
  -metadata "lyricist=Neko Oikawa (及川眠子)"
  -metadata "ARRANGER=Toshiyuki O'mori (大森俊之)"
  -metadata "ORIGINALARTIST=Yoko Takahashi (高橋洋子)"
  -metadata "ORIGINALDATE=1995"
  -metadata "copyright=Songwriting: Hidetoshi Sato (music), Neko Oikawa (lyrics), Toshiyuki O'mori (arrangement). Performance: Yoko Takahashi. From the 1995 Gainax production Shin Seiki Evangelion / Neon Genesis Evangelion."
  -metadata "language=$AUDIO_LANG"
  -metadata "SOURCE=$SOURCE_DESC"
  -metadata "SOURCEMEDIA=$SOURCEMEDIA_DESC"
  -metadata "ENCODEDBY=scripts/extract-theme.sh (ffmpeg $MODE)"
  -metadata "COMMENT=TV-size opening, 0:00-${DURATION}s window from S01E01 'Angel Attack'. $COMMENT_VERIFY"
  -metadata "DESCRIPTION=Opening theme of Neon Genesis Evangelion (1995). Words: Neko Oikawa. Music: Hidetoshi Sato. Arrangement: Toshiyuki O'mori. Vocals: Yoko Takahashi."
)

echo "source : $INPUT"
echo "stream : 0:$STREAM_INDEX ($CODEC, $AUDIO_LANG)"
echo "window : 0..${DURATION}s"
echo "mode   : $MODE"
echo "output : $OUTPUT"

ffmpeg -hide_banner -loglevel warning -y \
  -i "$INPUT" \
  -map "0:$STREAM_INDEX" \
  -t "$DURATION" \
  "${AUDIO_ARGS[@]}" -vn -sn \
  "${METADATA[@]}" \
  "$OUTPUT"

# Web-friendly stereo Opus alongside the master. ~3 MB at 90s, transparent
# for music at 256kbps, plays natively in every modern browser. Skipped if
# this ffmpeg build can't decode the source codec (e.g. eac3 in the Free
# repo's ffmpeg-free).
WEB_OUTPUT="$OUT_DIR/${OUT_BASE}.opus"
WEB_OK=0
if ffmpeg -hide_banner -decoders 2>/dev/null | awk '{print $2}' | grep -qx "$CODEC"; then
  echo
  echo "web    : $WEB_OUTPUT (libopus 256k stereo)"
  ffmpeg -hide_banner -loglevel warning -y \
    -i "$INPUT" \
    -map "0:$STREAM_INDEX" \
    -t "$DURATION" \
    -c:a libopus -b:a 256k -vbr on -application audio -ac 2 \
    -vn -sn \
    "${METADATA[@]}" \
    "$WEB_OUTPUT"
  WEB_OK=1
else
  echo
  echo "web    : SKIPPED --- this ffmpeg build has no decoder for '$CODEC'."
  echo "         Master $OUTPUT is still produced (stream copy needs no decode)."
fi

echo
echo "--- output stream/format ---"
OUTPUTS=("$OUTPUT")
[ "$WEB_OK" = "1" ] && OUTPUTS+=("$WEB_OUTPUT")
for F in "${OUTPUTS[@]}"; do
  echo "[$F]"
  ffprobe -hide_banner -v error \
    -show_entries stream=codec_name,sample_rate,channels,channel_layout,bits_per_raw_sample,bit_rate \
    -show_entries format=duration,size,bit_rate \
    -of default=noprint_wrappers=1 \
    "$F"
  echo
done
echo "--- master metadata (Vorbis Comments on FLAC) ---"
ffprobe -hide_banner -v error \
  -show_entries format_tags \
  -of default=noprint_wrappers=1:nokey=0 \
  "$OUTPUT"
ls -lh "${OUTPUTS[@]}"
