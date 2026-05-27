import type { GenesisEntry, GenesisKind, GenesisRegistry } from "./types";
import { GENESIS_KINDS } from "./types";
import {
  entry,
  genesis,
  isShortcode,
  shortcodes,
  type GenesisShortcode,
} from "./registry";

export type { GenesisEntry, GenesisKind, GenesisRegistry, GenesisShortcode };
export { GENESIS_KINDS, entry, genesis, isShortcode, shortcodes };

export { highlightToHtml, highlightSegments } from "./highlight";
export type { HighlightSegment } from "./highlight";

/**
 * Convert a camelCase or alphanumeric shortcode to its kebab-case CSS slug.
 *   shinji         -> shinji
 *   unit01         -> unit01
 *   massProduction -> mass-production
 *   atField        -> at-field
 *   thirdImpact    -> third-impact
 */
export function shortcodeToSlug(shortcode: string): string {
  return shortcode.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/** Strict #rrggbb hex validator. */
export function isValidHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** Filter shortcodes by kind. */
export function shortcodesByKind(kind: GenesisKind): GenesisShortcode[] {
  return shortcodes().filter((k) => genesis[k].kind === kind);
}

/** Resolve a shortcode's primary color, or a fallback gray. */
export function colorOf(shortcode: string): string {
  const ent = entry(shortcode);
  return ent?.primary ?? "#cccccc";
}

/** Base URL for every EvaWiki article. Joined with the slug at link time. */
export const EVAGEEKS_BASE_URL = "https://wiki.evageeks.org/";

/**
 * Resolve a shortcode's EvaWiki article URL, or null when the wiki does not
 * index the entity (Hedgehog's Dilemma and the other psyche concepts, the
 * family-name registry entries). Slugs are pre-verified --- see registry.ts.
 */
export function evageeksUrlOf(shortcode: string): string | null {
  const ent = entry(shortcode);
  if (!ent?.evageeksSlug) return null;
  return `${EVAGEEKS_BASE_URL}${ent.evageeksSlug}`;
}

/** Resolve a shortcode's kind, or null. */
export function kindOf(shortcode: string): GenesisKind | null {
  const ent = entry(shortcode);
  return ent?.kind ?? null;
}

/**
 * Resolve a free-text term to a shortcode by case-insensitive alias match.
 * Returns the first shortcode whose alias list contains the term, or null.
 *
 * The highlighter uses a compiled regex for performance, this is for
 * one-off lookups in tests / UI.
 */
export function resolveAlias(term: string): GenesisShortcode | null {
  const needle = term.trim().toLowerCase();
  if (!needle) return null;
  for (const code of shortcodes()) {
    const ent = genesis[code];
    for (const alias of ent.aliases) {
      if (alias.toLowerCase() === needle) return code;
    }
  }
  return null;
}

/**
 * Render the genesis registry as a CSS rule defining --genesis-{slug}-primary
 * and --genesis-{slug}-secondary-N for every shortcode at :root.
 *
 * A second alias band emits the same colors under the older --palette-* names
 * so existing consumers (Tailwind utilities, e2e tests) keep working until
 * they migrate to the genesis-prefixed names.
 */
export function genesisAsCssVars(): string {
  const lines: string[] = [];
  for (const code of shortcodes()) {
    const ent = genesis[code];
    const slug = shortcodeToSlug(code);
    lines.push(`  --genesis-${slug}-primary: ${ent.primary};`);
    lines.push(`  --palette-${slug}-primary: ${ent.primary};`);
    ent.secondary.forEach((color, i) => {
      lines.push(`  --genesis-${slug}-secondary-${i + 1}: ${color};`);
      lines.push(`  --palette-${slug}-secondary-${i + 1}: ${color};`);
    });
  }
  return `:root {\n${lines.join("\n")}\n}\n`;
}

export interface GenesisValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Hard invariants of the genesis registry. Returns a structured result so
 * callers (precommit, tests) can format failures as they like. The graph
 * validator (validateGraph in src/graph) calls this AND checks that every
 * node references at least one valid shortcode.
 *
 * Invariants:
 *   - Every entry's `shortcode` matches its registry key.
 *   - Every entry's `kind` is one of GENESIS_KINDS.
 *   - Every entry has a non-empty displayName, primary color, notes.
 *   - Every primary and secondary color is a valid #rrggbb.
 *   - Every entry has at least one alias.
 *   - Aliases are non-empty strings.
 *   - No two entries share an alias (case-insensitive). The shortcode itself
 *     is treated as an implicit alias for collision purposes.
 *   - displayNames are unique across the registry.
 */
export function validateGenesis(
  reg: GenesisRegistry = genesis,
): GenesisValidationResult {
  const errors: string[] = [];
  const seenAliases = new Map<string, string>(); // alias-lower -> shortcode
  const seenDisplayNames = new Map<string, string>();

  const codes = Object.keys(reg);
  if (codes.length === 0) {
    errors.push("genesis registry is empty");
    return { ok: false, errors };
  }

  for (const code of codes) {
    const ent = reg[code]!;
    if (ent.shortcode !== code) {
      errors.push(
        `key/shortcode mismatch: registry key "${code}" but entry.shortcode "${ent.shortcode}"`,
      );
    }
    if (!GENESIS_KINDS.includes(ent.kind)) {
      errors.push(`${code}: invalid kind "${ent.kind}"`);
    }
    if (!ent.displayName || ent.displayName.trim().length === 0) {
      errors.push(`${code}: empty displayName`);
    } else {
      const dnKey = ent.displayName.toLowerCase();
      const prev = seenDisplayNames.get(dnKey);
      if (prev) {
        errors.push(
          `displayName collision: "${ent.displayName}" used by both ${prev} and ${code}`,
        );
      } else {
        seenDisplayNames.set(dnKey, code);
      }
    }
    if (!ent.notes || ent.notes.trim().length === 0) {
      errors.push(`${code}: empty notes`);
    }
    if (!isValidHex(ent.primary)) {
      errors.push(`${code}: invalid primary "${ent.primary}" (need #rrggbb)`);
    }
    if (!Array.isArray(ent.secondary)) {
      errors.push(`${code}: secondary must be an array`);
    } else {
      ent.secondary.forEach((c, i) => {
        if (!isValidHex(c)) {
          errors.push(
            `${code}: invalid secondary[${i}] "${c}" (need #rrggbb)`,
          );
        }
      });
    }
    if (ent.evageeksSlug !== undefined) {
      const slug = ent.evageeksSlug;
      if (typeof slug !== "string" || slug.length === 0) {
        errors.push(`${code}: evageeksSlug must be a non-empty string when set`);
      } else if (/\s/.test(slug)) {
        errors.push(
          `${code}: evageeksSlug "${slug}" contains whitespace --- use underscores`,
        );
      } else if (slug.startsWith("/") || slug.includes("://")) {
        errors.push(
          `${code}: evageeksSlug "${slug}" must be a slug (no scheme, no leading slash)`,
        );
      }
    }

    if (!Array.isArray(ent.aliases) || ent.aliases.length === 0) {
      errors.push(`${code}: must declare at least one alias`);
    } else {
      // The shortcode itself is also a resolvable alias.
      const allTerms = [code, ...ent.aliases];
      for (const alias of allTerms) {
        if (typeof alias !== "string" || alias.trim().length === 0) {
          errors.push(`${code}: empty alias`);
          continue;
        }
        const key = alias.toLowerCase();
        const prev = seenAliases.get(key);
        if (prev && prev !== code) {
          errors.push(
            `alias collision: "${alias}" claimed by both ${prev} and ${code}`,
          );
        } else {
          seenAliases.set(key, code);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Throw on validation failure --- convenient for module-load assertions and
 * the precommit hook. The thrown message is a single newline-separated dump
 * of every error so a CI log shows the full state in one shot.
 */
export function assertGenesisValid(reg: GenesisRegistry = genesis): void {
  const result = validateGenesis(reg);
  if (!result.ok) {
    throw new Error(
      `genesis registry has ${result.errors.length} invariant violation(s):\n  - ${result.errors.join("\n  - ")}`,
    );
  }
}
