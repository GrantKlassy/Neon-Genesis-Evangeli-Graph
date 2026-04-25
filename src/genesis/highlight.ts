import { genesis, shortcodes, type GenesisShortcode } from "./registry";

export interface HighlightSegment {
  text: string;
  /** When set, the segment matched an alias; the value is the resolved shortcode. */
  shortcode?: GenesisShortcode;
}

/**
 * Compile a single regex over every alias (and shortcode) in the registry.
 * Longest patterns first so "Shinji Ikari" wins over a bare "Ikari" if you
 * ever add the long form as an alias. Word boundaries on both sides keep
 * "Tabris" out of "Tabristan" --- but the lookbehind and lookahead use a
 * simple non-letter test (\\W or end) so we still match "AT-Field" cleanly.
 *
 * Flags: `g` for sweep, `i` for case-insensitive, `u` for unicode safety.
 *
 * Built lazily and cached; the registry is static at module load.
 */
let scannerCache: { re: RegExp; lookup: Map<string, GenesisShortcode> } | null =
  null;

function getScanner(): { re: RegExp; lookup: Map<string, GenesisShortcode> } {
  if (scannerCache) return scannerCache;
  const lookup = new Map<string, GenesisShortcode>();
  const patterns: string[] = [];
  for (const code of shortcodes()) {
    const ent = genesis[code];
    // The shortcode itself is implicitly a valid alias.
    const aliases = [code, ...ent.aliases];
    for (const alias of aliases) {
      const key = alias.toLowerCase();
      if (lookup.has(key)) continue;
      lookup.set(key, code);
      patterns.push(escapeRegex(alias));
    }
  }
  // Longest first so multi-token aliases beat shorter prefixes.
  patterns.sort((a, b) => b.length - a.length);
  // The character class on either side rules out matches inside larger
  // identifiers ("Sachiel" inside "Sachielish") but allows punctuation and
  // hyphens around the term.
  const re = new RegExp(
    `(?<![A-Za-z0-9])(?:${patterns.join("|")})(?![A-Za-z0-9])`,
    "giu",
  );
  scannerCache = { re, lookup };
  return scannerCache;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split a string into segments. Each segment either has a `shortcode` (an
 * alias matched) or is plain copy. Use this server-side or in tests where
 * you want structured output instead of HTML.
 */
export function highlightSegments(input: string): HighlightSegment[] {
  if (!input) return [];
  const { re, lookup } = getScanner();
  const out: HighlightSegment[] = [];
  let lastIndex = 0;
  // Reset lastIndex because the regex is `g`-flagged and stateful.
  re.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) {
      out.push({ text: input.slice(lastIndex, start) });
    }
    const code = lookup.get(match[0].toLowerCase());
    if (code) {
      out.push({ text: match[0], shortcode: code });
    } else {
      out.push({ text: match[0] });
    }
    lastIndex = end;
    if (match[0].length === 0) re.lastIndex++; // safety against zero-length loops
  }
  if (lastIndex < input.length) {
    out.push({ text: input.slice(lastIndex) });
  }
  return out;
}

/**
 * Render highlighted text as HTML. Each matched alias becomes:
 *
 *   <span class="g-shortcode" data-shortcode="shinji"
 *         style="--g-color: var(--genesis-shinji-primary);
 *                color: var(--g-color)">Shinji</span>
 *
 * Non-matching text is HTML-escaped and emitted as-is. Output is meant to be
 * dropped into Astro's `set:html` directive.
 */
export function highlightToHtml(input: string): string {
  const segments = highlightSegments(input);
  return segments
    .map((seg) => {
      const escaped = escapeHtml(seg.text);
      if (!seg.shortcode) return escaped;
      const slug = shortcodeToCssSlug(seg.shortcode);
      return (
        `<span class="g-shortcode" data-shortcode="${seg.shortcode}" ` +
        `style="--g-color: var(--genesis-${slug}-primary); color: var(--g-color)">` +
        `${escaped}</span>`
      );
    })
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shortcodeToCssSlug(code: string): string {
  return code.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/** Test-only: drop the cached scanner so a different registry can be exercised. */
export function _resetScannerForTests(): void {
  scannerCache = null;
}
