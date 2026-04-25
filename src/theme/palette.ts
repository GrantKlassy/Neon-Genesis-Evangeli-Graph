/**
 * Neon Genesis Evangeli-Graph palette: single source of truth for entity colors.
 *
 * Each NGE-canon entity (character, EVA unit, organization, Magi node,
 * concept) maps to a primary hex and an ordered list of secondary hexes.
 * The palette is consumed two ways:
 *
 *   1. CSS custom properties at :root (injected by Base.astro via
 *      `paletteAsCssVars()`). Reference as `var(--palette-asuka-primary)`,
 *      `var(--palette-unit01-secondary-1)`, etc.
 *   2. Direct TypeScript import for code that needs hex values (e.g. the
 *      WebGL renderer, when entities get wired into graph data).
 *
 * Keys are camelCase. CSS variable names are kebab-case derived from keys.
 */

export type EntityCategory =
  | "character"
  | "eva"
  | "organization"
  | "magi"
  | "concept";

export interface EntityColor {
  /** Display name shown in UI labels and tooltips. */
  displayName: string;
  /** Grouping for showcases and category-scoped queries. */
  category: EntityCategory;
  /** Primary brand-defining hex color. Format: #rrggbb (lowercase). */
  primary: string;
  /** Secondary hex colors, ordered most-to-least important. Each #rrggbb. */
  secondary: string[];
  /** One-line lore note used for tooltips and hover detail. */
  notes: string;
}

export const palette = {
  // ---- Characters ----
  shinji: {
    displayName: "Shinji Ikari",
    category: "character",
    primary: "#1f3a8a",
    secondary: ["#f5f5f0", "#7c98d6"],
    notes:
      "Pilot of Unit-01. Deep navy plug suit with white and light blue accents.",
  },
  asuka: {
    displayName: "Asuka Langley Soryu",
    category: "character",
    primary: "#d6271e",
    secondary: ["#ff7e00", "#fcd35d"],
    notes:
      "Pilot of Unit-02. Red plug suit, orange neural connectors, yellow A10 clips.",
  },
  rei: {
    displayName: "Rei Ayanami",
    category: "character",
    primary: "#a3d8f4",
    secondary: ["#ff003c", "#ffffff"],
    notes:
      "Pilot of Unit-00. Pale blue hair, red eyes, white plug suit with black trim.",
  },
  misato: {
    displayName: "Misato Katsuragi",
    category: "character",
    primary: "#7a3aa5",
    secondary: ["#c8102e", "#1a1a1a"],
    notes:
      "NERV operations director. Purple hair, NERV jacket with red half-cross.",
  },
  kaworu: {
    displayName: "Kaworu Nagisa",
    category: "character",
    primary: "#c4c4c8",
    secondary: ["#ff003c", "#1a1a1a"],
    notes:
      "Fifth Child / Tabris. Silver-gray hair, red eyes, light gray plug suit.",
  },
  gendo: {
    displayName: "Gendo Ikari",
    category: "character",
    primary: "#2a2a2a",
    secondary: ["#ff6700", "#7a3719"],
    notes: "NERV commander. Dark suit, orange-tinted glasses, brown gloves.",
  },
  ritsuko: {
    displayName: "Ritsuko Akagi",
    category: "character",
    primary: "#c2a878",
    secondary: ["#ffffff", "#4a3728"],
    notes: "NERV chief scientist. Blonde hair, lab coat, signature cigarette.",
  },
  mari: {
    displayName: "Mari Makinami Illustrious",
    category: "character",
    primary: "#d51a73",
    secondary: ["#7a4a3a", "#4a1a3d"],
    notes: "Rebuild-only pilot. Magenta plug suit, twin braids, round glasses.",
  },

  // ---- Evangelion Units ----
  unit00: {
    displayName: "Unit-00 (Prototype)",
    category: "eva",
    primary: "#2575b8",
    secondary: ["#d97706", "#ffffff"],
    notes:
      "Rei's prototype EVA. Originally orange, repainted blue after the activation incident.",
  },
  unit01: {
    displayName: "Unit-01 (Test Type)",
    category: "eva",
    primary: "#5a2782",
    secondary: ["#5cf590", "#f59e0b"],
    notes:
      "Shinji's EVA. Iconic purple body, green chest plate, single orange horn.",
  },
  unit02: {
    displayName: "Unit-02 (Production Type)",
    category: "eva",
    primary: "#a8131e",
    secondary: ["#ff6b00", "#1a1a1a"],
    notes:
      "Asuka's EVA. Bright red body with orange shoulder pylons and four eyes.",
  },
  unit03: {
    displayName: "Unit-03 (Bardiel host)",
    category: "eva",
    primary: "#3a2929",
    secondary: ["#5a3a3a", "#a8131e"],
    notes:
      "Toji's EVA. Black body, possessed by the 13th Angel Bardiel on activation.",
  },
  unit04: {
    displayName: "Unit-04 (Lost)",
    category: "eva",
    primary: "#9ca3af",
    secondary: ["#4b5563", "#e5e7eb"],
    notes:
      "Silver prototype. Lost with the Nevada branch in the S2 engine experiment.",
  },
  massProduction: {
    displayName: "Mass Production Eva Series",
    category: "eva",
    primary: "#ebebe2",
    secondary: ["#2e7cb8", "#1f1f1f"],
    notes:
      "End of Evangelion white-bodied series. Identical clones with rictus grins.",
  },

  // ---- Organizations ----
  nerv: {
    displayName: "NERV",
    category: "organization",
    primary: "#c8102e",
    secondary: ["#1a1a1a", "#f5f5f0"],
    notes:
      "UN special agency. Iconic red half-leaf emblem on black background.",
  },
  seele: {
    displayName: "SEELE",
    category: "organization",
    primary: "#ec1c24",
    secondary: ["#1a1a1a", "#ff6700"],
    notes:
      "Shadow committee. Numbered red triangular monoliths, Sound Only orange screens.",
  },
  wille: {
    displayName: "WILLE",
    category: "organization",
    primary: "#0a6b6b",
    secondary: ["#f5f5f0", "#c8102e"],
    notes:
      "Anti-NERV organization (Rebuild). Military teal aesthetic on the AAA Wunder.",
  },

  // ---- Magi System ----
  casper: {
    displayName: "Casper-3",
    category: "magi",
    primary: "#5cf590",
    secondary: ["#00ff64", "#1a1a1a"],
    notes:
      "Magi node carrying Naoko Akagi's woman personality. Default terminal green.",
  },
  melchior: {
    displayName: "Melchior-1",
    category: "magi",
    primary: "#00d9ff",
    secondary: ["#0099cc", "#5cf590"],
    notes: "Magi node carrying Naoko Akagi's scientist personality.",
  },
  balthasar: {
    displayName: "Balthasar-2",
    category: "magi",
    primary: "#ffae00",
    secondary: ["#ff8500", "#fcd35d"],
    notes: "Magi node carrying Naoko Akagi's mother personality.",
  },

  // ---- Concepts ----
  atField: {
    displayName: "AT Field",
    category: "concept",
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes:
      "Absolute Terror Field. Hexagonal red barrier projected by every soul.",
  },
  lcl: {
    displayName: "LCL",
    category: "concept",
    primary: "#ff8800",
    secondary: ["#ffae00", "#d97706"],
    notes: "Link Connect Liquid. Orange amniotic fluid filling the entry plug.",
  },
  thirdImpact: {
    displayName: "Third Impact / Tang",
    category: "concept",
    primary: "#ff6b8b",
    secondary: ["#ff8800", "#ffae00"],
    notes: "Instrumentality. Pink-orange tang of dissolved humanity.",
  },
} as const satisfies Record<string, EntityColor>;

export type EntityKey = keyof typeof palette;

export function entityKeys(): EntityKey[] {
  return Object.keys(palette) as EntityKey[];
}

export function entitiesByCategory(category: EntityCategory): EntityKey[] {
  return entityKeys().filter((k) => palette[k].category === category);
}

/**
 * Convert a camelCase entity key to its kebab-case CSS slug.
 *   shinji         -> shinji
 *   unit01         -> unit01
 *   massProduction -> mass-production
 *   atField        -> at-field
 *   thirdImpact    -> third-impact
 */
export function entityKeyToSlug(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Render the palette as a CSS rule that defines every primary and secondary
 * color as a custom property on :root. Inject this into the document head
 * (Base.astro does this) so the variables are available to every page.
 */
export function paletteAsCssVars(): string {
  const lines: string[] = [];
  for (const key of entityKeys()) {
    const ent = palette[key];
    const slug = entityKeyToSlug(key);
    lines.push(`  --palette-${slug}-primary: ${ent.primary};`);
    ent.secondary.forEach((color, i) => {
      lines.push(`  --palette-${slug}-secondary-${i + 1}: ${color};`);
    });
  }
  return `:root {\n${lines.join("\n")}\n}\n`;
}

/** Strict #rrggbb hex validator. */
export function isValidHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}
