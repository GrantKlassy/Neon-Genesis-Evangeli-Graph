#!/usr/bin/env bash
# Extract the Japanese audio for the OP (0:00 - 1:30) of S01E01 as a lossless
# stream copy. Picks the file extension from the source codec so we never
# transcode and never mislabel the container.
set -euo pipefail

DEFAULT_INPUT='./assets/tv/nge_1995/1.mkv'
INPUT="${1:-$DEFAULT_INPUT}"
DURATION="${2:-90}"
OUT_DIR="./assets/sound"
OUT_BASE="theme"

if [ ! -f "$INPUT" ]; then
  echo "ERROR: source not found: $INPUT" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# Locate the Japanese audio stream and its codec. ffprobe emits one CSV row
# per audio stream: <absolute_index>,<codec>,<language>.
PROBE="$(
  ffprobe -v error \
    -select_streams a \
    -show_entries stream=index,codec_name:stream_tags=language \
    -of csv=p=0 \
    "$INPUT"
)"

JPN_ROW="$(printf '%s\n' "$PROBE" | awk -F, '$3 == "jpn" { print; exit }')"
if [ -z "$JPN_ROW" ]; then
  echo "ERROR: no Japanese audio stream (lang=jpn) found in $INPUT" >&2
  printf 'available audio streams:\n%s\n' "$PROBE" >&2
  exit 1
fi

STREAM_INDEX="$(printf '%s' "$JPN_ROW" | awk -F, '{print $1}')"
CODEC="$(printf '%s' "$JPN_ROW" | awk -F, '{print $2}')"

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

# Vorbis Comments embedded in the FLAC. Songwriting and performance credits
# for "A Cruel Angel's Thesis" / Zankoku na Tenshi no Teeze, the OP for the
# 1995 Gainax production. Source-file provenance is preserved so the asset
# is self-describing without referring back to this script.
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
  -metadata "language=jpn"
  -metadata "SOURCE=$SOURCE_BASENAME (matroska, stream 0:$STREAM_INDEX, lang=jpn, codec=$CODEC, 48kHz/16-bit/5.1)"
  -metadata "SOURCEMEDIA=Bluray remaster (Japanese original audio, FLAC 5.1)"
  -metadata "ENCODEDBY=scripts/extract-theme.sh (ffmpeg $MODE)"
  -metadata "COMMENT=TV-size opening, 0:00-${DURATION}s window from S01E01 'Angel Attack'. PCM is bit-exact with the source stream (verified via md5)."
  -metadata "DESCRIPTION=Opening theme of Neon Genesis Evangelion (1995). Words: Neko Oikawa. Music: Hidetoshi Sato. Arrangement: Toshiyuki O'mori. Vocals: Yoko Takahashi."
)

echo "source : $INPUT"
echo "stream : 0:$STREAM_INDEX ($CODEC, jpn)"
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

# Web-friendly stereo Opus alongside the lossless master. ~3 MB at 90s,
# transparent for music at 256kbps, plays natively in every modern browser.
WEB_OUTPUT="$OUT_DIR/theme.opus"
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

# Remix: paste audiojungle.opus on top of theme.opus every 8 seconds. Pads
# the jungle clip with silence to an 8s cycle, loops it across the theme's
# duration, and mixes both streams with normalize=0 so neither is attenuated.
JUNGLE_INPUT="$OUT_DIR/audiojungle.opus"
JUNGLE_OUTPUT="$OUT_DIR/theme_audio_jungle.opus"
INTERVAL=8
if [ ! -f "$JUNGLE_INPUT" ]; then
  echo "ERROR: $JUNGLE_INPUT missing --- needed for theme_audio_jungle.opus" >&2
  exit 1
fi
# aloop's `size` is in per-channel samples; 8s at 48kHz = 384000.
CYCLE_SAMPLES=$(( INTERVAL * 48000 ))
echo
echo "remix  : $JUNGLE_OUTPUT (theme.opus + audiojungle.opus every ${INTERVAL}s)"
ffmpeg -hide_banner -loglevel warning -y \
  -i "$WEB_OUTPUT" \
  -i "$JUNGLE_INPUT" \
  -filter_complex "[1:a]apad=whole_dur=${INTERVAL},aloop=loop=-1:size=${CYCLE_SAMPLES}[loop];[0:a][loop]amix=inputs=2:duration=first:normalize=0[mix]" \
  -map "[mix]" \
  -c:a libopus -b:a 256k -vbr on -application audio -ac 2 \
  -vn -sn \
  "$JUNGLE_OUTPUT"

echo
echo "--- output stream/format ---"
for F in "$OUTPUT" "$WEB_OUTPUT" "$JUNGLE_OUTPUT"; do
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
ls -lh "$OUTPUT" "$WEB_OUTPUT" "$JUNGLE_OUTPUT"
