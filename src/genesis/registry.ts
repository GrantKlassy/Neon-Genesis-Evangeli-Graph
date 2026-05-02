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
    aliases: [
      "Shinji",
      "Shinji Ikari",
      "Ikari Shinji",
      "Third Child",
      "Pilot of Unit-01",
    ],
    primary: "#1f3a8a",
    secondary: ["#f5f5f0", "#7c98d6"],
    notes:
      "Pilot of Unit-01. Deep navy plug suit with white and light blue accents.",
    evageeksSlug: "Shinji_Ikari",
  },
  asuka: {
    shortcode: "asuka",
    kind: "CHARACTERS",
    displayName: "Asuka Langley Soryu",
    aliases: [
      "Asuka",
      "Asuka Langley Soryu",
      "Asuka Langley",
      "Second Child",
      "Pilot of Unit-02",
    ],
    primary: "#d6271e",
    secondary: ["#ff7e00", "#fcd35d"],
    notes:
      "Pilot of Unit-02. Red plug suit, orange neural connectors, yellow A10 clips.",
    evageeksSlug: "Asuka_Langley_Soryu",
  },
  rei: {
    shortcode: "rei",
    kind: "CHARACTERS",
    displayName: "Rei Ayanami",
    aliases: [
      "Rei",
      "Rei Ayanami",
      "Ayanami Rei",
      "First Child",
      "Pilot of Unit-00",
    ],
    primary: "#a3d8f4",
    secondary: ["#ff003c", "#ffffff"],
    notes:
      "Pilot of Unit-00. Pale blue hair, red eyes, white plug suit with black trim.",
    evageeksSlug: "Rei_Ayanami",
  },
  misato: {
    shortcode: "misato",
    kind: "CHARACTERS",
    displayName: "Misato Katsuragi",
    aliases: [
      "Misato",
      "Misato Katsuragi",
      "Katsuragi Misato",
      "Major Katsuragi",
    ],
    primary: "#7a3aa5",
    secondary: ["#c8102e", "#1a1a1a"],
    notes:
      "NERV operations director. Purple hair, NERV jacket with red half-cross.",
    evageeksSlug: "Misato_Katsuragi",
  },
  kaworu: {
    shortcode: "kaworu",
    kind: "CHARACTERS",
    displayName: "Kaworu Nagisa",
    aliases: ["Kaworu", "Kaworu Nagisa", "Nagisa Kaworu", "Fifth Child"],
    primary: "#c4c4c8",
    secondary: ["#ff003c", "#1a1a1a"],
    notes:
      "Fifth Child / Tabris. Silver-gray hair, red eyes, light gray plug suit.",
    evageeksSlug: "Kaworu_Nagisa",
  },
  gendo: {
    shortcode: "gendo",
    kind: "CHARACTERS",
    displayName: "Gendo Ikari",
    aliases: ["Gendo", "Gendo Ikari", "Ikari Gendo", "Commander Ikari"],
    primary: "#2a2a2a",
    secondary: ["#ff6700", "#7a3719"],
    notes: "NERV commander. Dark suit, orange-tinted glasses, brown gloves.",
    evageeksSlug: "Gendo_Ikari",
  },
  ritsuko: {
    shortcode: "ritsuko",
    kind: "CHARACTERS",
    displayName: "Ritsuko Akagi",
    aliases: ["Ritsuko", "Ritsuko Akagi", "Akagi Ritsuko", "Dr. Akagi"],
    primary: "#c2a878",
    secondary: ["#ffffff", "#4a3728"],
    notes: "NERV chief scientist. Blonde hair, lab coat, signature cigarette.",
    evageeksSlug: "Ritsuko_Akagi",
  },
  toji: {
    shortcode: "toji",
    kind: "CHARACTERS",
    displayName: "Toji Suzuhara",
    aliases: [
      "Toji",
      "Toji Suzuhara",
      "Suzuhara Toji",
      "Suzuhara",
      "Fourth Child",
    ],
    primary: "#2dd4bf",
    secondary: ["#1a1a1a", "#a8131e"],
    notes:
      "Shinji's classmate and the Fourth Child. Athletic, gruff, becomes the Unit-03 pilot.",
    evageeksSlug: "Toji_Suzuhara",
  },
  yui: {
    shortcode: "yui",
    kind: "CHARACTERS",
    displayName: "Yui Ikari",
    aliases: ["Yui", "Yui Ikari", "Ikari Yui"],
    primary: "#c4a5d4",
    secondary: ["#5a2782", "#1f3a8a"],
    notes:
      "Shinji's mother. Lost to a contact experiment with Unit-01. Late-show reveal grounds the Ikari arc.",
    evageeksSlug: "Yui_Ikari",
  },
  naoko: {
    shortcode: "naoko",
    kind: "CHARACTERS",
    displayName: "Naoko Akagi",
    aliases: ["Naoko", "Naoko Akagi", "Akagi Naoko", "Dr. Naoko Akagi"],
    primary: "#a8845a",
    secondary: ["#5cf5b6", "#1a1a1a"],
    notes:
      "Original Magi designer and Ritsuko's mother. Took her own life on the Magi launch day; her three personalities live on as Casper, Melchior, and Balthasar.",
    evageeksSlug: "Naoko_Akagi",
  },
  kaji: {
    shortcode: "kaji",
    kind: "CHARACTERS",
    displayName: "Ryoji Kaji",
    aliases: ["Kaji", "Ryoji Kaji", "Kaji Ryoji"],
    primary: "#5a7a3a",
    secondary: ["#3a4a2a", "#a8a878"],
    notes:
      "Special inspector and triple agent. Misato's ex, Asuka's guardian on the Pacific fleet, intelligence asset for SEELE / NERV / the Japanese government. Tends watermelons in his off hours.",
    evageeksSlug: "Ryoji_Kaji",
  },
  fuyutsuki: {
    shortcode: "fuyutsuki",
    kind: "CHARACTERS",
    displayName: "Kozo Fuyutsuki",
    aliases: ["Fuyutsuki", "Kozo Fuyutsuki", "Fuyutsuki Kozo", "Sub-Commander"],
    primary: "#6a6a6a",
    secondary: ["#3a3a3a", "#9a9a9a"],
    notes:
      "NERV Sub-Commander. Yui Ikari's former metaphysical biology professor. Recruited to the Artificial Evolution Lab and stays Gendo's reluctant conscience.",
    evageeksSlug: "Kozo_Fuyutsuki",
  },
  maya: {
    shortcode: "maya",
    kind: "CHARACTERS",
    displayName: "Maya Ibuki",
    aliases: ["Maya", "Maya Ibuki", "Ibuki Maya"],
    primary: "#ff8caa",
    secondary: ["#c8506a", "#fcd35d"],
    notes:
      "First Lieutenant. Bridge crew, Ritsuko's protege, mans the sync-ratio console. Dependable softie of the bridge trio.",
    evageeksSlug: "Maya_Ibuki",
  },
  hyuga: {
    shortcode: "hyuga",
    kind: "CHARACTERS",
    displayName: "Makoto Hyuga",
    aliases: ["Hyuga", "Makoto Hyuga", "Hyuga Makoto"],
    primary: "#3a6acc",
    secondary: ["#1f3a8a", "#7c98d6"],
    notes:
      "First Lieutenant. Bridge crew, intel analyst, glasses. Quiet crush on Misato.",
    evageeksSlug: "Makoto_Hyuga",
  },
  aoba: {
    shortcode: "aoba",
    kind: "CHARACTERS",
    displayName: "Shigeru Aoba",
    aliases: ["Aoba", "Shigeru Aoba", "Aoba Shigeru"],
    primary: "#3a8a8a",
    secondary: ["#1a4a4a", "#8acaca"],
    notes:
      "First Lieutenant. Bridge crew, sensor officer, plays guitar between angel attacks. Long hair on the bridge.",
    evageeksSlug: "Shigeru_Aoba",
  },
  penPen: {
    shortcode: "penPen",
    kind: "CHARACTERS",
    displayName: "Pen Pen",
    aliases: ["Pen Pen", "Pen-Pen", "PenPen"],
    primary: "#ff7e2a",
    secondary: ["#a85020", "#fcd35d"],
    notes:
      "Misato's hot-spring penguin. Lives in the second fridge, drinks beer, judges Shinji silently.",
    evageeksSlug: "Pen_Pen",
  },
  hikari: {
    shortcode: "hikari",
    kind: "CHARACTERS",
    displayName: "Hikari Horaki",
    aliases: ["Hikari", "Hikari Horaki", "Horaki Hikari", "Class Rep"],
    primary: "#d4a058",
    secondary: ["#8a6028", "#fcd35d"],
    notes:
      "Class representative for 2-A. Asuka's best friend, has an obvious soft spot for Toji.",
    evageeksSlug: "Hikari_Horaki",
  },
  kensuke: {
    shortcode: "kensuke",
    kind: "CHARACTERS",
    displayName: "Kensuke Aida",
    aliases: ["Kensuke", "Kensuke Aida", "Aida Kensuke"],
    primary: "#7a8a3a",
    secondary: ["#3a4a1a", "#caca7a"],
    notes:
      "Shinji's classmate, military otaku, camera glued to his hand. Desperately wants to pilot an EVA.",
    evageeksSlug: "Kensuke_Aida",
  },
  keel: {
    shortcode: "keel",
    kind: "CHARACTERS",
    displayName: "Keel Lorenz",
    aliases: ["Keel", "Keel Lorenz", "Lorenz", "Chairman Keel", "SEELE 01"],
    primary: "#3a1a4a",
    secondary: ["#8a2be2", "#ff6700"],
    notes:
      "Chairman of SEELE. Dead-eyed cyborg in a visor; everything below his neck has been replaced by machine. Holds the Dead Sea Scrolls and runs the Instrumentality scenario from the orange 'SOUND ONLY' monolith. The hand at the very top of the chain Gendo answers to.",
    evageeksSlug: "Keel_Lorenz",
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
      "The Ikari family --- Shinji (Third Child), Gendo (NERV Commander), and Yui (lost to Unit-01). Color borrows Unit-01 purple, the family's defining vehicle.",
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
    evageeksSlug: "Adam",
  },
  lilith: {
    shortcode: "lilith",
    kind: "ANGELS",
    displayName: "Lilith (2nd Angel)",
    aliases: ["Lilith"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Second Angel. Crucified at the bottom of NERV in Terminal Dogma.",
    evageeksSlug: "Lilith",
  },
  sachiel: {
    shortcode: "sachiel",
    kind: "ANGELS",
    displayName: "Sachiel (3rd Angel)",
    aliases: ["Sachiel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "First Angel encountered on screen. Defeated in Tokyo-3 by Unit-01.",
    evageeksSlug: "Sachiel",
  },
  shamshel: {
    shortcode: "shamshel",
    kind: "ANGELS",
    displayName: "Shamshel (4th Angel)",
    aliases: ["Shamshel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Tendril-whip angel. Defeated by Unit-01 in close combat.",
    evageeksSlug: "Shamshel",
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
    evageeksSlug: "Ramiel",
  },
  gaghiel: {
    shortcode: "gaghiel",
    kind: "ANGELS",
    displayName: "Gaghiel (6th Angel)",
    aliases: ["Gaghiel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Underwater angel. The Pacific fleet engagement with Unit-02.",
    evageeksSlug: "Gaghiel",
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
    evageeksSlug: "Israfel",
  },
  sandalphon: {
    shortcode: "sandalphon",
    kind: "ANGELS",
    displayName: "Sandalphon (8th Angel)",
    aliases: ["Sandalphon"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Embryonic angel pulled out of Mt. Asama by Unit-02.",
    evageeksSlug: "Sandalphon",
  },
  matarael: {
    shortcode: "matarael",
    kind: "ANGELS",
    displayName: "Matarael (9th Angel)",
    aliases: ["Matarael"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Spider-shaped acid-rain angel. Defeated during the blackout.",
    evageeksSlug: "Matarael",
  },
  sahaquiel: {
    shortcode: "sahaquiel",
    kind: "ANGELS",
    displayName: "Sahaquiel (10th Angel)",
    aliases: ["Sahaquiel"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Orbital angel that body-checks Tokyo-3. Caught by all three EVAs.",
    evageeksSlug: "Sahaquiel",
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
    evageeksSlug: "Iruel",
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
    evageeksSlug: "Leliel",
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
    evageeksSlug: "Bardiel",
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
    evageeksSlug: "Zeruel",
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
    evageeksSlug: "Arael",
  },
  armisael: {
    shortcode: "armisael",
    kind: "ANGELS",
    displayName: "Armisael (16th Angel)",
    aliases: ["Armisael"],
    primary: "#ff003c",
    secondary: ["#ffae00", "#ffffff"],
    notes: "Helix angel that fuses with Unit-00. Forces Rei to self-destruct.",
    evageeksSlug: "Armisael",
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
    evageeksSlug: "Tabris",
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
    evageeksSlug: "Lilim",
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
    evageeksSlug: "Magi",
  },
  melchior: {
    shortcode: "melchior",
    kind: "MAGI",
    displayName: "Melchior-1",
    aliases: ["Melchior", "Melchior-1"],
    primary: "#00d9ff",
    secondary: ["#0099cc", "#5cf590"],
    notes: "Magi node carrying Naoko Akagi's scientist personality.",
    evageeksSlug: "Magi",
  },
  balthasar: {
    shortcode: "balthasar",
    kind: "MAGI",
    displayName: "Balthasar-2",
    aliases: ["Balthasar", "Balthasar-2"],
    primary: "#ffae00",
    secondary: ["#ff8500", "#fcd35d"],
    notes: "Magi node carrying Naoko Akagi's mother personality.",
    evageeksSlug: "Magi",
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
    evageeksSlug: "Evangelion_Unit-00",
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
    evageeksSlug: "Evangelion_Unit-01",
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
    evageeksSlug: "Evangelion_Unit-02",
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
    evageeksSlug: "Evangelion_Unit-03",
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
    evageeksSlug: "Evangelion_Unit-04",
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
    evageeksSlug: "MP_Eva",
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
    evageeksSlug: "Nerv",
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
    evageeksSlug: "Seele",
  },
  gehirn: {
    shortcode: "gehirn",
    kind: "ORGANIZATIONS",
    displayName: "GEHIRN",
    aliases: ["GEHIRN", "Gehirn"],
    primary: "#9a3a3a",
    secondary: ["#5a1a1a", "#1a1a1a"],
    notes:
      "NERV's predecessor. UN-funded research body that became NERV after the Magi launched and the Evangelions moved into prototype. Yui, Naoko, Gendo, and Fuyutsuki all worked here.",
    evageeksSlug: "Gehirn",
  },
  jssdf: {
    shortcode: "jssdf",
    kind: "ORGANIZATIONS",
    displayName: "JSSDF",
    aliases: ["JSSDF", "Strategic Self Defense Force"],
    primary: "#5a6a3a",
    secondary: ["#3a4a2a", "#1a1a1a"],
    notes:
      "Japan Strategic Self Defense Force. Deployed by SEELE to seize NERV HQ in End of Evangelion. The reason most NERV staff don't survive the finale.",
    evageeksSlug: "JSSDF",
  },
  marduk: {
    shortcode: "marduk",
    kind: "ORGANIZATIONS",
    displayName: "Marduk Institute",
    aliases: ["Marduk Institute", "Marduk"],
    primary: "#7a5a3a",
    secondary: ["#3a2a1a", "#caa078"],
    notes:
      "The committee that 'selects' the Children for the EVA program.",
    evageeksSlug: "Marduk_Institute",
  },
  japanGov: {
    shortcode: "japanGov",
    kind: "ORGANIZATIONS",
    displayName: "Japanese Government",
    aliases: [
      "Japanese Government",
      "Government of Japan",
      "Department of Home Affairs",
    ],
    // Sober institutional grey-blue --- distinct from NERV's red, SEELE's
    // monolith purple, JSSDF's olive military green.
    primary: "#5a7aa0",
    secondary: ["#2a3a55", "#a0b8d0"],
    notes:
      "Civilian government of Japan. Quietly investigating NERV behind the UN cover; runs Kaji as an intelligence asset.",
    evageeksSlug: "Japanese_Government",
  },

  // ---- LOCATIONS ----
  nervHq: {
    shortcode: "nervHq",
    kind: "LOCATIONS",
    displayName: "NERV HQ",
    aliases: ["NERV HQ", "NERV Headquarters"],
    primary: "#62b8ff",
    secondary: ["#3a8fff", "#0c0c10"],
    notes:
      "NERV's underground headquarters beneath Tokyo-3, set inside the Geofront cavity.",
    evageeksSlug: "Nerv_HQ",
  },
  tokyo3: {
    shortcode: "tokyo3",
    kind: "LOCATIONS",
    displayName: "Tokyo-3",
    aliases: ["Tokyo-3", "Tokyo 3", "Tokyo3"],
    primary: "#7cb8ff",
    secondary: ["#3a8fff", "#1a1a2a"],
    notes:
      "The fortified replacement city built around the Geofront after Second Impact. Buildings retract underground when the alarm sounds.",
    evageeksSlug: "Tokyo-3",
  },
  geofront: {
    shortcode: "geofront",
    kind: "LOCATIONS",
    displayName: "Geofront",
    aliases: ["Geofront", "Geo-Front"],
    primary: "#5cf590",
    secondary: ["#1a4a2a", "#3a8fff"],
    notes:
      "Cavernous green-tinted void beneath Tokyo-3. Houses NERV HQ; revealed late in the show to be the upper hull of the Black Moon.",
    evageeksSlug: "Geofront",
  },
  terminalDogma: {
    shortcode: "terminalDogma",
    kind: "LOCATIONS",
    displayName: "Terminal Dogma",
    aliases: ["Terminal Dogma"],
    primary: "#a8131e",
    secondary: ["#1a0c10", "#ff003c"],
    notes:
      "The deepest level of NERV. Lilith hangs crucified on a giant cross above an LCL pool. Off-limits to almost everyone --- the Lance is here too.",
    evageeksSlug: "Terminal_Dogma",
  },
  centralDogma: {
    shortcode: "centralDogma",
    kind: "LOCATIONS",
    displayName: "Central Dogma",
    aliases: ["Central Dogma", "Command Center"],
    primary: "#ff2a3c",
    secondary: ["#1a1a1a", "#62b8ff"],
    notes:
      "NERV's command bridge. Misato calls the angel ops, the bridge bunnies man the consoles, and the Magi vote on every tough call.",
    evageeksSlug: "Central_Dogma",
  },
  antarctica: {
    shortcode: "antarctica",
    kind: "LOCATIONS",
    displayName: "Antarctica",
    aliases: ["Antarctica", "South Pole"],
    primary: "#c8e8ff",
    secondary: ["#62b8ff", "#1a1a2a"],
    notes:
      "Site of the Katsuragi Expedition's 2000 contact experiment with Adam --- the trigger of Second Impact. Now a frozen red sea.",
    evageeksSlug: "Antarctica",
  },
  mtAsama: {
    shortcode: "mtAsama",
    kind: "LOCATIONS",
    displayName: "Mt. Asama",
    aliases: ["Mt. Asama", "Mt Asama", "Mount Asama", "Asama Caldera"],
    primary: "#a8480a",
    secondary: ["#ff6c2a", "#1a1a1a"],
    notes:
      "Active volcano in Honshu. The Eighth Angel, Sandalphon, gestates inside the magma chamber; Unit-02 in heat-resistant Type-D armor abseils into the caldera in Ep. 10 to retrieve it.",
    evageeksSlug: "Mt._Asama",
  },
  matsushiro: {
    shortcode: "matsushiro",
    kind: "LOCATIONS",
    displayName: "Matsushiro",
    aliases: ["Matsushiro", "Matsushiro Test Center", "Second Branch"],
    primary: "#5a3a3a",
    secondary: ["#a8131e", "#1a1a1a"],
    notes:
      "NERV's Second Branch in Nagano Prefecture, repurposed as the Unit-03 activation test site (Ep. 18). Bardiel's possession of Unit-03 begins here, and the cages around it become the kill site moments later.",
    evageeksSlug: "Matsushiro",
  },
  pribnowBox: {
    shortcode: "pribnowBox",
    kind: "LOCATIONS",
    displayName: "Pribnow Box",
    aliases: ["Pribnow Box", "Sigma Unit"],
    primary: "#3a8a6a",
    secondary: ["#7acaaa", "#1a4a3a"],
    notes:
      "Test facility deep inside NERV HQ that houses the Evangelion simulation bodies and their plug controls. Iruel infiltrates NERV through a contaminated 87th protein wall installed here in Ep. 13. Named after the prokaryote DNA promoter site --- biology nerds, not theologians.",
    evageeksSlug: "Pribnow_box",
  },
  nerv2: {
    shortcode: "nerv2",
    kind: "LOCATIONS",
    displayName: "NERV-2 (Nevada)",
    aliases: ["NERV-2", "Nevada Branch", "US Branch", "NERV 2nd Branch"],
    primary: "#7a5a2a",
    secondary: ["#caa078", "#1a1a1a"],
    notes:
      "NERV's Second Branch in the Nevada desert, USA. Where Unit-04 was test-fitted with an experimental S² engine in 2015 and was lost --- the entire branch and a Mojave-sized crater of land vanished with it. Unit-03 ships to Matsushiro from here in Ep. 17.",
    evageeksSlug: "NERV-2",
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
    evageeksSlug: "A.T._Field",
  },
  lcl: {
    shortcode: "lcl",
    kind: "CONCEPTS",
    displayName: "LCL",
    aliases: ["LCL", "Link Connect Liquid"],
    primary: "#ff8800",
    secondary: ["#ffae00", "#d97706"],
    notes: "Link Connect Liquid. Orange amniotic fluid filling the entry plug.",
    evageeksSlug: "LCL",
  },
  thirdImpact: {
    shortcode: "thirdImpact",
    kind: "CONCEPTS",
    displayName: "Third Impact / Tang",
    aliases: ["Third Impact", "Tang", "Instrumentality"],
    primary: "#ff6b8b",
    secondary: ["#ff8800", "#ffae00"],
    notes: "Instrumentality. Pink-orange tang of dissolved humanity.",
    evageeksSlug: "Third_Impact",
  },
  hedgehogsDilemma: {
    shortcode: "hedgehogsDilemma",
    kind: "CONCEPTS",
    displayName: "Hedgehog's Dilemma",
    aliases: ["Hedgehog's Dilemma", "Hedgehog Dilemma"],
    primary: "#b87a4a",
    secondary: ["#5a3a2a", "#e3b58a"],
    notes:
      "The closer two people draw, the more they hurt each other --- the central interpersonal motif framed in Episode 4.",
  },
  trauma: {
    shortcode: "trauma",
    kind: "CONCEPTS",
    displayName: "Trauma",
    aliases: ["Trauma"],
    primary: "#5a2a4a",
    secondary: ["#3a1a2a", "#9a5a7a"],
    notes:
      "The unhealed wounds the cast carries --- Shinji's father, Asuka's mother, Misato's father, Rei's nature.",
  },
  rejection: {
    shortcode: "rejection",
    kind: "CONCEPTS",
    displayName: "Rejection",
    aliases: ["Rejection"],
    primary: "#4a1a3d",
    secondary: ["#2a0a1d", "#8a3a6d"],
    notes:
      "The fear and the act --- Shinji's reflexive 'I mustn't run away' braided with the dread of being pushed away.",
  },
  abandonment: {
    shortcode: "abandonment",
    kind: "CONCEPTS",
    displayName: "Abandonment",
    aliases: ["Abandonment"],
    primary: "#2a3a5a",
    secondary: ["#1a2a3a", "#5a7a9a"],
    notes:
      "Parents who left, parents who are absent in the room --- the through-line under every Ikari and Akagi mother arc.",
  },
  lanceOfLonginus: {
    shortcode: "lanceOfLonginus",
    kind: "CONCEPTS",
    displayName: "Lance of Longinus",
    aliases: ["Lance of Longinus", "Lance"],
    primary: "#e0b400",
    secondary: ["#a08200", "#fcd35d"],
    notes:
      "Twin-helix golden spear. The only weapon that pierces an angel's AT field. Asuka throws it into Arael, then it's lost in lunar orbit.",
    evageeksSlug: "Lance_of_Longinus",
  },
  dummyPlug: {
    shortcode: "dummyPlug",
    kind: "CONCEPTS",
    displayName: "Dummy Plug",
    aliases: ["Dummy Plug", "Dummy System"],
    primary: "#3a8a6a",
    secondary: ["#1a4a3a", "#7acaaa"],
    notes:
      "Autopilot module that runs an EVA on a captive copy of someone's psyche. Unit-01 under Dummy Plug control crushes Unit-03 with Toji aboard --- the Bardiel kill.",
    evageeksSlug: "Dummy_Plug",
  },
  s2Engine: {
    shortcode: "s2Engine",
    kind: "CONCEPTS",
    displayName: "S² Engine",
    aliases: ["S² Engine", "S2 Engine", "Super Solenoid Engine"],
    primary: "#d51a73",
    secondary: ["#7a0a3d", "#ff80c0"],
    notes:
      "Super Solenoid power organ --- the angels' inexhaustible energy core. Unit-01 absorbs Zeruel's S² and goes off-grid: an EVA that no longer needs an umbilical.",
    evageeksSlug: "S2_Engine",
  },
  entryPlug: {
    shortcode: "entryPlug",
    kind: "CONCEPTS",
    displayName: "Entry Plug",
    aliases: ["Entry Plug"],
    primary: "#ff8800",
    secondary: ["#a85000", "#ffcc7a"],
    notes:
      "The cylindrical capsule a pilot rides in. Slots into the EVA's spine, floods with LCL, transmits the pilot's nerves to the unit's giant body.",
    evageeksSlug: "Entry_Plug",
  },
  humanInstrumentality: {
    shortcode: "humanInstrumentality",
    kind: "CONCEPTS",
    displayName: "Human Instrumentality Project",
    aliases: ["Human Instrumentality Project", "Instrumentality Project", "HIP"],
    primary: "#8a2be2",
    secondary: ["#4a0a82", "#c47afa"],
    notes:
      "SEELE's endgame --- collapse every AT field at once and merge all souls into a single being. Different actors have different motives; the result is the same Tang.",
    evageeksSlug: "Human_Instrumentality_Project",
  },
  progressiveKnife: {
    shortcode: "progressiveKnife",
    kind: "CONCEPTS",
    displayName: "Progressive Knife",
    aliases: ["Progressive Knife", "Prog Knife"],
    primary: "#c8c8c8",
    secondary: ["#8a8a8a", "#ff003c"],
    notes:
      "Vibrating monomolecular blade stowed in each EVA's shoulder pylon. The default angel-killing tool when the rifle and the lance are out of reach.",
    evageeksSlug: "Progressive_Knife",
  },
  blackMoon: {
    shortcode: "blackMoon",
    kind: "CONCEPTS",
    displayName: "Black Moon",
    aliases: ["Black Moon"],
    primary: "#1a1a1a",
    secondary: ["#3a3a3a", "#5cf590"],
    notes:
      "The egg-shaped vessel buried under Tokyo-3. The Geofront is its hollow upper shell; Lilith was its passenger.",
    evageeksSlug: "Black_Moon",
  },
  whiteMoon: {
    shortcode: "whiteMoon",
    kind: "CONCEPTS",
    displayName: "White Moon",
    aliases: ["White Moon"],
    primary: "#f0f0e8",
    secondary: ["#a8a890", "#1a1a1a"],
    notes:
      "The Antarctic counterpart to the Black Moon. Adam's vessel; the Katsuragi Expedition cracked it open and triggered Second Impact.",
    evageeksSlug: "White_Moon",
  },
  deadSeaScrolls: {
    shortcode: "deadSeaScrolls",
    kind: "CONCEPTS",
    displayName: "Dead Sea Scrolls",
    aliases: ["Dead Sea Scrolls", "Secret Dead Sea Scrolls", "Scrolls"],
    primary: "#a89060",
    secondary: ["#5a4a30", "#fcd35d"],
    notes:
      "The prophecy SEELE runs the world by. They predict the angels in numerical order, name the two Moons, and lay out the scenario that ends in Instrumentality. Keel keeps the only complete copy.",
    evageeksSlug: "Dead_Sea_Scrolls",
  },
  soundOnly: {
    shortcode: "soundOnly",
    kind: "CONCEPTS",
    displayName: "Sound Only",
    aliases: ["Sound Only", "SOUND ONLY", "SEELE Monolith"],
    primary: "#ff6700",
    secondary: ["#1a1a1a", "#8a2be2"],
    notes:
      "The orange 'SOUND ONLY' monolith. SEELE's twelve members appear to Gendo as numbered red triangles plus this one black-on-orange slab; nobody on the bridge ever sees a face. The most stylish committee meeting in anime history.",
    evageeksSlug: "Seele",
  },
  berserk: {
    shortcode: "berserk",
    kind: "CONCEPTS",
    displayName: "Berserk Mode",
    aliases: ["Berserk", "Berserk Mode", "F-Type", "berserker"],
    primary: "#a8131e",
    secondary: ["#5cf590", "#1a1a1a"],
    notes:
      "What happens when the umbilical detaches and Yui decides she's had enough. Unit-01 enters this state in Eps. 2 (Sachiel), 16 (Leliel), and 19 (Zeruel) --- it bites, it screams, it eats S² engines.",
    evageeksSlug: "Berserk",
  },
  yebisu: {
    shortcode: "yebisu",
    kind: "CONCEPTS",
    displayName: "Yebisu",
    aliases: ["Yebisu", "Yebisu beer"],
    primary: "#fcd35d",
    secondary: ["#a8131e", "#1a1a1a"],
    notes:
      "Misato's drink. A 500ml gold-label can opened over the head, drained in three seconds flat, followed by the most theatrical 'PUHAAA!' on Japanese television. Basically a load-bearing structural element of the Katsuragi apartment.",
  },
  watermelons: {
    shortcode: "watermelons",
    kind: "CONCEPTS",
    displayName: "Watermelons",
    aliases: ["Watermelons", "Watermelon", "Kaji's watermelons"],
    primary: "#1a4a2a",
    secondary: ["#5a7a3a", "#a8131e"],
    notes:
      "Kaji's hobby. He is a triple agent running ops for NERV, the Japanese government, and SEELE; on his off days he tends a NERV greenhouse plot of striped melons. A man who runs three jobs wants something that grows back.",
  },

  // ---- EVENTS ----
  // Backstory and on-screen flashpoints. Tied to the `event` graph node
  // kind; each entry has at most a single canonical wiki article on the
  // EvaWiki.
  firstImpact: {
    shortcode: "firstImpact",
    kind: "EVENTS",
    displayName: "First Impact",
    aliases: ["First Impact", "Giant Impact"],
    primary: "#1a1a3a",
    secondary: ["#0a0a1a", "#62b8ff"],
    notes:
      "Pre-history collision that formed the Moon and stranded the White Moon (Adam's vessel) in Antarctica. Backstory only; the show drips it out across the late-teens episodes.",
    evageeksSlug: "First_Impact",
  },
  secondImpact: {
    shortcode: "secondImpact",
    kind: "EVENTS",
    displayName: "Second Impact",
    aliases: ["Second Impact"],
    primary: "#ff5a1a",
    secondary: ["#a83a0a", "#fcd35d"],
    notes:
      "September 2000. The Katsuragi Expedition's contact experiment with Adam in Antarctica triggered a global cataclysm --- billions dead, sea levels reshaped, the seasons gone. The show's pre-cause for everything.",
    evageeksSlug: "Second_Impact",
  },
  operationYashima: {
    shortcode: "operationYashima",
    kind: "EVENTS",
    displayName: "Operation Yashima",
    aliases: ["Operation Yashima", "Yashima Operation"],
    primary: "#62b8ff",
    secondary: ["#3a8fff", "#fcd35d"],
    notes:
      "Ep. 6. Every spare watt of electricity in the Japanese archipelago drains into a single positron rifle so Unit-01 can shoot the Fifth Angel through the head from outside its AT field. Rei in Unit-00 holds the heat shield. The first time the show stops being about the giant robots and starts being about the kids.",
    evageeksSlug: "Operation_Yashima",
  },

  // ---- AUDIENCE ----
  // The viewer-as-Lilim. Singular registry entry; backs the audience_you
  // graph node added at EoE. No EvaWiki slug --- the wiki does not have
  // an article about the reader. Pure white primary so the YOU node reads
  // as "everything and nothing" against the OLED-black background, the
  // canonical Tabris reading of humanity-as-Lilim.
  //
  // Aliases pointedly avoid the literal pronoun "you" --- the highlighter
  // is case-insensitive and "you" appears constantly in body copy. We use
  // multi-word phrases that the show's note text never uses verbatim.
  you: {
    shortcode: "you",
    kind: "CONCEPTS",
    displayName: "You",
    aliases: ["the viewer", "audience-as-Lilim"],
    primary: "#ffffff",
    secondary: ["#f5f5f5", "#cccccc"],
    notes:
      "The viewer. Tabris names humanity itself the 18th Angel; the audience IS Lilim. Surfaces only after End of Evangelion.",
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
