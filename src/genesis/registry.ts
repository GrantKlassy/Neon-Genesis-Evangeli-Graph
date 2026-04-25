import type { GenesisEntry, GenesisRegistry } from "./types";

/**
 * The genesis mapping. Source of truth for entity identity, color, and the
 * textual aliases that tie copy back to graph nodes.
 *
 * Each entry's KEY (the property name) is the shortcode --- the same string
 * that appears in `shortcode`. Keep them in sync; the validator (in
 * src/genesis/index.ts) enforces it.
 *
 * Adding an entry:
 *   1. Pick a lowercase, no-spaces key (e.g. `kaji`, `pen_pen`).
 *   2. Drop in displayName, kind, primary/secondary hexes, and at least one
 *      alias the highlighter can match against.
 *   3. Ensure no alias collides (case-insensitive) with another entry's
 *      aliases --- the validator rejects ambiguous text -> shortcode maps.
 */
export const genesis = {
  // ---- CHARACTERS (given names) ----
  shinji: {
    shortcode: "shinji",
    kind: "CHARACTERS",
    displayName: "Shinji Ikari",
    aliases: ["Shinji", "Third Child", "Pilot of Unit-01"],
    primary: "#1f3a8a",
    secondary: ["#f5f5f0", "#7c98d6"],
    notes:
      "Pilot of Unit-01. Deep navy plug suit with white and light blue accents.",
  },
  asuka: {
    shortcode: "asuka",
    kind: "CHARACTERS",
    displayName: "Asuka Langley Soryu",
    aliases: ["Asuka", "Second Child", "Pilot of Unit-02"],
    primary: "#d6271e",
    secondary: ["#ff7e00", "#fcd35d"],
    notes:
      "Pilot of Unit-02. Red plug suit, orange neural connectors, yellow A10 clips.",
  },
  rei: {
    shortcode: "rei",
    kind: "CHARACTERS",
    displayName: "Rei Ayanami",
    aliases: ["Rei", "First Child", "Pilot of Unit-00"],
    primary: "#a3d8f4",
    secondary: ["#ff003c", "#ffffff"],
    notes:
      "Pilot of Unit-00. Pale blue hair, red eyes, white plug suit with black trim.",
  },
  misato: {
    shortcode: "misato",
    kind: "CHARACTERS",
    displayName: "Misato Katsuragi",
    aliases: ["Misato", "Major Katsuragi"],
    primary: "#7a3aa5",
    secondary: ["#c8102e", "#1a1a1a"],
    notes:
      "NERV operations director. Purple hair, NERV jacket with red half-cross.",
  },
  kaworu: {
    shortcode: "kaworu",
    kind: "CHARACTERS",
    displayName: "Kaworu Nagisa",
    aliases: ["Kaworu", "Fifth Child"],
    primary: "#c4c4c8",
    secondary: ["#ff003c", "#1a1a1a"],
    notes:
      "Fifth Child / Tabris. Silver-gray hair, red eyes, light gray plug suit.",
  },
  gendo: {
    shortcode: "gendo",
    kind: "CHARACTERS",
    displayName: "Gendo Ikari",
    aliases: ["Gendo", "Commander Ikari"],
    primary: "#2a2a2a",
    secondary: ["#ff6700", "#7a3719"],
    notes: "NERV commander. Dark suit, orange-tinted glasses, brown gloves.",
  },
  ritsuko: {
    shortcode: "ritsuko",
    kind: "CHARACTERS",
    displayName: "Ritsuko Akagi",
    aliases: ["Ritsuko", "Dr. Akagi"],
    primary: "#c2a878",
    secondary: ["#ffffff", "#4a3728"],
    notes: "NERV chief scientist. Blonde hair, lab coat, signature cigarette.",
  },
  mari: {
    shortcode: "mari",
    kind: "CHARACTERS",
    displayName: "Mari Makinami Illustrious",
    aliases: ["Mari"],
    primary: "#d51a73",
    secondary: ["#7a4a3a", "#4a1a3d"],
    notes:
      "Rebuild-only pilot. Magenta plug suit, twin braids, round glasses.",
  },

  // ---- CHARACTERS (family-name shortcodes) ----
  // Surnames get their own shortcode so a node like "Shinji Ikari" can
  // reference both the given-name (`shinji`) AND family (`ikari`) shortcodes,
  // and so "Ikari" alone can color-link both Shinji and Gendo's writeups.
  ikari: {
    shortcode: "ikari",
    kind: "CHARACTERS",
    displayName: "Ikari (family)",
    aliases: ["Ikari"],
    primary: "#5a2782",
    secondary: ["#1f3a8a", "#2a2a2a"],
    notes:
      "The Ikari family --- shared between Shinji (Third Child) and Gendo (NERV Commander). Color borrows Unit-01 purple, the family's defining vehicle.",
  },
  ayanami: {
    shortcode: "ayanami",
    kind: "CHARACTERS",
    displayName: "Ayanami (line)",
    aliases: ["Ayanami"],
    primary: "#a3d8f4",
    secondary: ["#ff003c", "#ffffff"],
    notes: "The Ayanami designation. Carried by Rei.",
  },
  katsuragi: {
    shortcode: "katsuragi",
    kind: "CHARACTERS",
    displayName: "Katsuragi (family)",
    aliases: ["Katsuragi"],
    primary: "#7a3aa5",
    secondary: ["#c8102e", "#1a1a1a"],
    notes: "The Katsuragi family. Misato's surname.",
  },
  nagisa: {
    shortcode: "nagisa",
    kind: "CHARACTERS",
    displayName: "Nagisa (alias)",
    aliases: ["Nagisa"],
    primary: "#c4c4c8",
    secondary: ["#ff003c", "#1a1a1a"],
    notes: "Surname carried by Kaworu (Fifth Child / Tabris).",
  },
  akagi: {
    shortcode: "akagi",
    kind: "CHARACTERS",
    displayName: "Akagi (family)",
    aliases: ["Akagi"],
    primary: "#c2a878",
    secondary: ["#ffffff", "#4a3728"],
    notes:
      "The Akagi family --- Ritsuko, NERV chief scientist, and her late mother Naoko (Magi designer).",
  },
  langley: {
    shortcode: "langley",
    kind: "CHARACTERS",
    displayName: "Langley Soryu (lineage)",
    aliases: ["Langley", "Soryu"],
    primary: "#d6271e",
    secondary: ["#ff7e00", "#fcd35d"],
    notes: "Asuka's German-American lineage --- Langley Soryu.",
  },
  makinami: {
    shortcode: "makinami",
    kind: "CHARACTERS",
    displayName: "Makinami (Rebuild line)",
    aliases: ["Makinami", "Illustrious"],
    primary: "#d51a73",
    secondary: ["#7a4a3a", "#4a1a3d"],
    notes: "Mari's Rebuild-only surname.",
  },

  // ---- ANGELS ----
  // All 18 canon angels share the AT-field crimson primary so highlighted
  // angel mentions read as a single color family. Numbers and names live in
  // the graph data; the registry provides identity + color.
  adam: {
    shortcode: "adam",
    kind: "ANGELS",
    displayName: "Adam (1st Angel)",
    aliases: ["Adam"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "First Angel. Source of the Second Impact.",
  },
  lilith: {
    shortcode: "lilith",
    kind: "ANGELS",
    displayName: "Lilith (2nd Angel)",
    aliases: ["Lilith"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Second Angel. Crucified at the bottom of NERV in Terminal Dogma.",
  },
  sachiel: {
    shortcode: "sachiel",
    kind: "ANGELS",
    displayName: "Sachiel (3rd Angel)",
    aliases: ["Sachiel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "First Angel encountered on screen. Defeated in Tokyo-3 by Unit-01.",
  },
  shamshel: {
    shortcode: "shamshel",
    kind: "ANGELS",
    displayName: "Shamshel (4th Angel)",
    aliases: ["Shamshel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Tendril-whip angel. Defeated by Unit-01 in close combat.",
  },
  ramiel: {
    shortcode: "ramiel",
    kind: "ANGELS",
    displayName: "Ramiel (5th Angel)",
    aliases: ["Ramiel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes:
      "Giant blue octahedron with a positron beam. The Operation Yashima sniper episode.",
  },
  gaghiel: {
    shortcode: "gaghiel",
    kind: "ANGELS",
    displayName: "Gaghiel (6th Angel)",
    aliases: ["Gaghiel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Underwater angel. The Pacific fleet engagement with Unit-02.",
  },
  israfel: {
    shortcode: "israfel",
    kind: "ANGELS",
    displayName: "Israfel (7th Angel)",
    aliases: ["Israfel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes:
      "Splits into two. Defeated by Shinji and Asuka in the choreographed dance.",
  },
  sandalphon: {
    shortcode: "sandalphon",
    kind: "ANGELS",
    displayName: "Sandalphon (8th Angel)",
    aliases: ["Sandalphon"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Embryonic angel pulled out of Mt. Asama by Unit-02.",
  },
  matarael: {
    shortcode: "matarael",
    kind: "ANGELS",
    displayName: "Matarael (9th Angel)",
    aliases: ["Matarael"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Spider-shaped acid-rain angel. Defeated during the blackout.",
  },
  sahaquiel: {
    shortcode: "sahaquiel",
    kind: "ANGELS",
    displayName: "Sahaquiel (10th Angel)",
    aliases: ["Sahaquiel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Orbital angel that body-checks Tokyo-3. Caught by all three EVAs.",
  },
  iruel: {
    shortcode: "iruel",
    kind: "ANGELS",
    displayName: "Iruel (11th Angel)",
    aliases: ["Iruel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes:
      "Nano-machine angel that infiltrates the Magi system. Defeated by Ritsuko.",
  },
  leliel: {
    shortcode: "leliel",
    kind: "ANGELS",
    displayName: "Leliel (12th Angel)",
    aliases: ["Leliel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes:
      "Shadow / Dirac sea angel. Swallows Unit-01. The introspective bottle episode.",
  },
  bardiel: {
    shortcode: "bardiel",
    kind: "ANGELS",
    displayName: "Bardiel (13th Angel)",
    aliases: ["Bardiel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes:
      "Possesses Unit-03 with Toji aboard. Forces Unit-01 into a brutal fight.",
  },
  zeruel: {
    shortcode: "zeruel",
    kind: "ANGELS",
    displayName: "Zeruel (14th Angel)",
    aliases: ["Zeruel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes:
      "Paper-ribbon angel. Tears through Tokyo-3. Triggers Unit-01's berserk feeding.",
  },
  arael: {
    shortcode: "arael",
    kind: "ANGELS",
    displayName: "Arael (15th Angel)",
    aliases: ["Arael"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes:
      "Bird-of-light angel. Mind-attacks Asuka. Defeated by the Lance of Longinus.",
  },
  armisael: {
    shortcode: "armisael",
    kind: "ANGELS",
    displayName: "Armisael (16th Angel)",
    aliases: ["Armisael"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Helix angel that fuses with Unit-00. Forces Rei to self-destruct.",
  },
  tabris: {
    shortcode: "tabris",
    kind: "ANGELS",
    displayName: "Tabris (17th Angel)",
    aliases: ["Tabris"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes:
      "Final visible angel. Identity reveal is a major spoiler --- gated until unlocked.",
  },
  lilim: {
    shortcode: "lilim",
    kind: "ANGELS",
    displayName: "Lilim (18th Angel)",
    aliases: ["Lilim"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes:
      "Humanity itself, the Eighteenth Angel. Revealed as the Instrumentality conclusion.",
  },

  // ---- MAGI ----
  casper: {
    shortcode: "casper",
    kind: "MAGI",
    displayName: "Casper-3",
    aliases: ["Casper", "Casper-3"],
    primary: "#5cf590",
    secondary: ["#00ff64", "#1a1a1a"],
    notes:
      "Magi node carrying Naoko Akagi's woman personality. Default terminal green.",
  },
  melchior: {
    shortcode: "melchior",
    kind: "MAGI",
    displayName: "Melchior-1",
    aliases: ["Melchior", "Melchior-1"],
    primary: "#00d9ff",
    secondary: ["#0099cc", "#5cf590"],
    notes: "Magi node carrying Naoko Akagi's scientist personality.",
  },
  balthasar: {
    shortcode: "balthasar",
    kind: "MAGI",
    displayName: "Balthasar-2",
    aliases: ["Balthasar", "Balthasar-2"],
    primary: "#ffae00",
    secondary: ["#ff8500", "#fcd35d"],
    notes: "Magi node carrying Naoko Akagi's mother personality.",
  },

  // ---- EVA UNITS ----
  unit00: {
    shortcode: "unit00",
    kind: "EVA",
    displayName: "Unit-00 (Prototype)",
    aliases: ["Unit-00", "Unit 00", "EVA-00"],
    primary: "#2575b8",
    secondary: ["#d97706", "#ffffff"],
    notes:
      "Rei's prototype EVA. Originally orange, repainted blue after the activation incident.",
  },
  unit01: {
    shortcode: "unit01",
    kind: "EVA",
    displayName: "Unit-01 (Test Type)",
    aliases: ["Unit-01", "Unit 01", "EVA-01"],
    primary: "#5a2782",
    secondary: ["#5cf590", "#f59e0b"],
    notes:
      "Shinji's EVA. Iconic purple body, green chest plate, single orange horn.",
  },
  unit02: {
    shortcode: "unit02",
    kind: "EVA",
    displayName: "Unit-02 (Production Type)",
    aliases: ["Unit-02", "Unit 02", "EVA-02"],
    primary: "#a8131e",
    secondary: ["#ff6b00", "#1a1a1a"],
    notes:
      "Asuka's EVA. Bright red body with orange shoulder pylons and four eyes.",
  },
  unit03: {
    shortcode: "unit03",
    kind: "EVA",
    displayName: "Unit-03 (Bardiel host)",
    aliases: ["Unit-03", "Unit 03", "EVA-03"],
    primary: "#3a2929",
    secondary: ["#5a3a3a", "#a8131e"],
    notes:
      "Toji's EVA. Black body, possessed by the 13th Angel Bardiel on activation.",
  },
  unit04: {
    shortcode: "unit04",
    kind: "EVA",
    displayName: "Unit-04 (Lost)",
    aliases: ["Unit-04", "Unit 04", "EVA-04"],
    primary: "#9ca3af",
    secondary: ["#4b5563", "#e5e7eb"],
    notes:
      "Silver prototype. Lost with the Nevada branch in the S2 engine experiment.",
  },
  massProduction: {
    shortcode: "massProduction",
    kind: "EVA",
    displayName: "Mass Production Eva Series",
    aliases: ["Mass Production Eva", "MP Eva"],
    primary: "#ebebe2",
    secondary: ["#2e7cb8", "#1f1f1f"],
    notes:
      "End of Evangelion white-bodied series. Identical clones with rictus grins.",
  },

  // ---- ORGANIZATIONS ----
  nerv: {
    shortcode: "nerv",
    kind: "ORGANIZATIONS",
    displayName: "NERV",
    aliases: ["NERV"],
    primary: "#c8102e",
    secondary: ["#1a1a1a", "#f5f5f0"],
    notes:
      "UN special agency. Iconic red half-leaf emblem on black background.",
  },
  seele: {
    shortcode: "seele",
    kind: "ORGANIZATIONS",
    displayName: "SEELE",
    aliases: ["SEELE", "Seele"],
    primary: "#ec1c24",
    secondary: ["#1a1a1a", "#ff6700"],
    notes:
      "Shadow committee. Numbered red triangular monoliths, Sound Only orange screens.",
  },
  wille: {
    shortcode: "wille",
    kind: "ORGANIZATIONS",
    displayName: "WILLE",
    aliases: ["WILLE", "Wille"],
    primary: "#0a6b6b",
    secondary: ["#f5f5f0", "#c8102e"],
    notes:
      "Anti-NERV organization (Rebuild). Military teal aesthetic on the AAA Wunder.",
  },

  // ---- CONCEPTS ----
  atField: {
    shortcode: "atField",
    kind: "CONCEPTS",
    displayName: "AT Field",
    aliases: ["AT Field", "AT-Field", "Absolute Terror Field"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes:
      "Absolute Terror Field. Hexagonal red barrier projected by every soul.",
  },
  lcl: {
    shortcode: "lcl",
    kind: "CONCEPTS",
    displayName: "LCL",
    aliases: ["LCL", "Link Connect Liquid"],
    primary: "#ff8800",
    secondary: ["#ffae00", "#d97706"],
    notes: "Link Connect Liquid. Orange amniotic fluid filling the entry plug.",
  },
  thirdImpact: {
    shortcode: "thirdImpact",
    kind: "CONCEPTS",
    displayName: "Third Impact / Tang",
    aliases: ["Third Impact", "Tang", "Instrumentality"],
    primary: "#ff6b8b",
    secondary: ["#ff8800", "#ffae00"],
    notes: "Instrumentality. Pink-orange tang of dissolved humanity.",
  },
} as const satisfies GenesisRegistry;

export type GenesisShortcode = keyof typeof genesis;

/** All shortcodes in the registry, in declaration order. */
export function shortcodes(): GenesisShortcode[] {
  return Object.keys(genesis) as GenesisShortcode[];
}

/** Strict member check --- narrows to the union of valid shortcodes. */
export function isShortcode(value: string): value is GenesisShortcode {
  return Object.prototype.hasOwnProperty.call(genesis, value);
}

/** Look up by shortcode, returning undefined if absent. */
export function entry(shortcode: string): GenesisEntry | undefined {
  if (!isShortcode(shortcode)) return undefined;
  return genesis[shortcode];
}
