/**
 * Genesis mapping --- the global shortcode registry that ties every textual
 * mention of an entity (a character, an angel, an EVA, ...) to a single,
 * stable identifier. Many-to-many: one entity (a graph node, a piece of body
 * text, an edge note) can reference many shortcodes; one shortcode can be
 * referenced by many entities.
 *
 * Wikipedia-on-crack: aliases collapse "Shinji" / "Shinji Ikari" / "Ikari"
 * / "the Third Child" down to canonical shortcodes like `shinji` and `ikari`,
 * and the renderer uses those shortcodes to drive both color and cross-links.
 */

export type GenesisKind =
  | "CHARACTERS"
  | "ANGELS"
  | "MAGI"
  | "EVA"
  | "ORGANIZATIONS"
  | "CONCEPTS";

export interface GenesisEntry {
  /** Unique key. Lowercase, no spaces. The thing the rest of the codebase points at. */
  shortcode: string;
  /** Top-level grouping. Drives readout sectioning and bulk color rules. */
  kind: GenesisKind;
  /** Canonical title shown in UI. */
  displayName: string;
  /**
   * Text patterns (case-insensitive) that, when seen in copy, resolve to this
   * shortcode. Order does not matter --- the highlighter compiles a longest-
   * match-first scanner from the union of all aliases across the registry.
   *
   * "Shinji Ikari" can be on EITHER `shinji` (whole name -> shinji color) OR
   * left off so each word resolves to its own family/given-name shortcode
   * separately. The current registry leans on short single-token aliases so
   * "Shinji" -> shinji and "Ikari" -> ikari, and the family shortcode is
   * shared between Shinji's and Gendo's character nodes.
   */
  aliases: string[];
  /** Primary brand-defining hex color. Format: #rrggbb (lowercase). */
  primary: string;
  /** Secondary hex colors, ordered most-to-least important. Each #rrggbb. */
  secondary: string[];
  /** One-line lore note used for tooltips and hover detail. */
  notes: string;
}

export type GenesisRegistry = Record<string, GenesisEntry>;

/**
 * The canonical list of kinds. Exported as a constant so tests and UI can
 * iterate without re-deriving from a string union.
 */
export const GENESIS_KINDS: readonly GenesisKind[] = [
  "CHARACTERS",
  "ANGELS",
  "MAGI",
  "EVA",
  "ORGANIZATIONS",
  "CONCEPTS",
] as const;
