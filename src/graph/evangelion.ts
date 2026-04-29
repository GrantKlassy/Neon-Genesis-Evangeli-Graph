import type {
  AngelNode,
  CharacterNode,
  ConceptNode,
  Edge,
  EvaNode,
  EvangelionGraph,
  EventNode,
  FamilyNode,
  LocationNode,
  MagiNode,
  OrganizationNode,
} from "./types";
import { EDGE_WEIGHT } from "./layoutTuning";

/**
 * Seed for the Neon Genesis Evangeli-Graph. Top-level kinds:
 *   - characters (Shinji, Asuka, ..., plus Naoko Akagi for the Magi line).
 *   - angels: 18 canonical NGE TV-series order (Adam = 1, Lilim = 18).
 *   - magi: 3 nodes in a tight triangle (the "3-in-1" joke).
 *   - families: lineage roll-ups (Ikari, Akagi). Characters point at their
 *     family via member_of_family edges.
 *   - concepts: AT Field, LCL, Third Impact (the last gated to End of
 *     Evangelion / TV ep 25+).
 *   - organizations / locations / EVAs: as before.
 *
 * Each node carries EXACTLY ONE genesis shortcode --- the canonical identity
 * of the entity. The family-name registry entries (`ikari`, `akagi`, ...)
 * also serve as the shortcode for the corresponding family graph node, so
 * "Ikari" in body copy AND the Ikari family node read the same purple.
 *
 * Spoiler gate: every node and every edge carries an OPTIONAL revealedAt
 * threshold (see src/graph/types.ts). Nodes are gated by their first on-screen
 * appearance. Edges are gated independently --- Rei and Yui both render as
 * separate nodes at their respective intro episodes, but the edge between
 * them (the genetic-origin reveal) is locked to a much later episode.
 */

const characters: CharacterNode[] = [
  {
    id: "char_shinji",
    kind: "character",
    displayName: "Shinji Ikari",
    shortcodes: ["shinji"],
    role: "Third Child / Pilot of Unit-01",
    tags: [{ id: "child" }],
    notes: "The protagonist. Reluctant pilot of Evangelion Unit-01.",
  },
  {
    id: "char_asuka",
    kind: "character",
    displayName: "Asuka Langley Soryu",
    shortcodes: ["asuka"],
    role: "Second Child / Pilot of Unit-02",
    revealedAt: { kind: "ep", episode: 8 },
    revealedAtSource:
      "https://wiki.evageeks.org/Asuka_Langley_Soryu --- arrives with Unit-02 on the Pacific fleet in Ep. 8 ('Asuka Strikes')",
    tags: [
      { id: "child" },
      { id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } },
    ],
    notes: "Hot-headed German-American pilot of Evangelion Unit-02.",
  },
  {
    id: "char_rei",
    kind: "character",
    displayName: "Rei Ayanami",
    shortcodes: ["rei"],
    role: "First Child / Pilot of Unit-00",
    tags: [
      { id: "child" },
      { id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } },
    ],
    notes:
      "Quiet pilot of Unit-00. Lives alone, speaks rarely, follows orders precisely.",
  },
  {
    id: "char_misato",
    kind: "character",
    displayName: "Misato Katsuragi",
    shortcodes: ["misato"],
    role: "NERV Operations Director",
    tags: [{ id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } }],
    notes: "Tactical commander during angel attacks. Shinji's guardian.",
  },
  {
    id: "char_kaworu",
    kind: "character",
    displayName: "Kaworu Nagisa",
    shortcodes: ["kaworu"],
    role: "Fifth Child",
    revealedAt: { kind: "ep", episode: 24 },
    revealedAtSource:
      "https://wiki.evageeks.org/Kaworu_Nagisa --- arrives in Ep. 24 ('The Final Messenger') as the Fifth Child / Tabris",
    tags: [
      { id: "child" },
      { id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } },
    ],
    notes:
      "The Fifth Child. Walks into the show with quiet, cosmic significance.",
  },
  {
    id: "char_gendo",
    kind: "character",
    displayName: "Gendo Ikari",
    shortcodes: ["gendo"],
    role: "NERV Commander",
    tags: [{ id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } }],
    notes: "Shinji's estranged father. Runs NERV with his own agenda.",
  },
  {
    id: "char_ritsuko",
    kind: "character",
    displayName: "Ritsuko Akagi",
    shortcodes: ["ritsuko"],
    role: "NERV Chief Scientist",
    tags: [{ id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } }],
    notes:
      "Lead engineer on the Evangelions and the Magi. Daughter of Naoko Akagi.",
  },
  {
    id: "char_mari",
    kind: "character",
    displayName: "Mari Makinami Illustrious",
    shortcodes: ["mari"],
    role: "Pilot (Rebuild)",
    revealedAt: { kind: "rebuild" },
    revealedAtSource:
      "https://wiki.evageeks.org/Mari_Makinami_Illustrious --- Rebuild-only pilot, no TV-canon presence",
    notes: "Rebuild-only pilot. Excitable, opportunistic, sings in combat.",
  },
  {
    id: "char_toji",
    kind: "character",
    displayName: "Toji Suzuhara",
    shortcodes: ["toji"],
    role: "Classmate",
    revealedAt: { kind: "ep", episode: 3 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_03 --- introduces the three classmates (Toji, Kensuke, Hikari)",
    tags: [{ id: "child", revealedAt: { kind: "ep", episode: 17 } }],
    notes:
      "Shinji's classmate. Athletic, gruff, fiercely loyal to those close to him.",
  },
  {
    id: "char_yui",
    kind: "character",
    displayName: "Yui Ikari",
    shortcodes: ["yui"],
    role: "Lost researcher (Unit-01 contact experiment)",
    revealedAt: { kind: "ep", episode: 20 },
    revealedAtSource:
      "https://wiki.evageeks.org/Yui_Ikari --- Director's Cut Ep. 20 ('Weaving a Story 2: oral stage') drops the Yui-in-Unit-01 backstory",
    notes:
      "Shinji's mother. Lost during a contact experiment with Unit-01.",
  },
  {
    id: "char_naoko",
    kind: "character",
    displayName: "Naoko Akagi",
    shortcodes: ["naoko"],
    role: "Magi designer (lost)",
    revealedAt: { kind: "ep", episode: 21 },
    revealedAtSource:
      "https://wiki.evageeks.org/Naoko_Akagi --- Director's Cut Ep. 21 backstory drop introduces Naoko alongside Yui at GEHIRN",
    notes:
      "Original architect of the Magi system. Ritsuko's mother. Took her own life on the Magi launch day; her three personalities became Casper, Melchior, and Balthasar.",
  },
  {
    id: "char_kaji",
    kind: "character",
    displayName: "Ryoji Kaji",
    shortcodes: ["kaji"],
    role: "NERV special inspector / triple agent",
    revealedAt: { kind: "ep", episode: 8 },
    revealedAtSource:
      "https://wiki.evageeks.org/Ryoji_Kaji --- 'Kaji's first appearance in the series is in episode 8' (with Asuka on the Pacific fleet)",
    tags: [{ id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } }],
    notes:
      "Misato's ex. Asuka's escort on the Pacific fleet. Triple-agent for SEELE, NERV, and the Japanese government, depending on the day. Tends watermelons.",
  },
  {
    id: "char_fuyutsuki",
    kind: "character",
    displayName: "Kozo Fuyutsuki",
    shortcodes: ["fuyutsuki"],
    role: "NERV Sub-Commander",
    tags: [{ id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } }],
    notes:
      "Yui Ikari's old metaphysical-biology professor. Pulled into GEHIRN, then NERV, as Gendo's reluctant second.",
  },
  {
    id: "char_maya",
    kind: "character",
    displayName: "Maya Ibuki",
    shortcodes: ["maya"],
    role: "Bridge crew (sync ratio console)",
    notes:
      "Lt. Ibuki. Watches the sync-ratio readouts, adores Ritsuko, breaks down at the worst moments.",
  },
  {
    id: "char_hyuga",
    kind: "character",
    displayName: "Makoto Hyuga",
    shortcodes: ["hyuga"],
    role: "Bridge crew (intel / sensors)",
    notes:
      "Lt. Hyuga. Bespectacled bridge analyst. Carries a quiet crush on Misato.",
  },
  {
    id: "char_aoba",
    kind: "character",
    displayName: "Shigeru Aoba",
    shortcodes: ["aoba"],
    role: "Bridge crew (sensors / comms)",
    notes:
      "Lt. Aoba. Sensor officer with the longest hair on the bridge; plays guitar between angel attacks.",
  },
  {
    id: "char_pen_pen",
    kind: "character",
    displayName: "Pen Pen",
    shortcodes: ["penPen"],
    role: "Hot-spring penguin / Misato's roommate",
    revealedAt: { kind: "ep", episode: 2 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_02 --- 'first appearance of Pen Pen, Misato's warm water penguin'",
    notes:
      "Misato's hot-spring penguin. Lives in the second fridge, drinks beer, judges Shinji silently.",
  },
  {
    id: "char_hikari",
    kind: "character",
    displayName: "Hikari Horaki",
    shortcodes: ["hikari"],
    role: "Class representative",
    revealedAt: { kind: "ep", episode: 3 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_03 --- introduces the three classmates (Kensuke, Toji, Hikari)",
    notes:
      "2-A's class rep. Asuka's best friend. Has an obvious soft spot for Toji.",
  },
  {
    id: "char_kensuke",
    kind: "character",
    displayName: "Kensuke Aida",
    shortcodes: ["kensuke"],
    role: "Classmate (military otaku)",
    revealedAt: { kind: "ep", episode: 3 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_03 --- introduces the three classmates (Kensuke, Toji, Hikari)",
    notes:
      "Shinji's classmate. Camera glued to his hand; would trade a kidney to pilot an EVA.",
  },
];

const angels: AngelNode[] = [
  {
    id: "angel_01_adam",
    kind: "angel",
    number: 1,
    name: "Adam",
    displayName: "Adam",
    shortcodes: ["adam"],
    revealedAt: { kind: "ep", episode: 21 },
    revealedAtSource:
      "https://wiki.evageeks.org/Adam --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Backstory / Ep. 21",
    notes:
      "First Angel. Source of the Second Impact. The embryo reveal is in the late teens.",
  },
  {
    id: "angel_02_lilith",
    kind: "angel",
    number: 2,
    name: "Lilith",
    displayName: "Lilith",
    shortcodes: ["lilith"],
    revealedAt: { kind: "ep", episode: 23 },
    revealedAtSource:
      "https://wiki.evageeks.org/Lilith --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Backstory / Ep. 23",
    notes:
      "Second Angel. Crucified at the bottom of NERV in Terminal Dogma. Late-series reveal.",
  },
  {
    id: "angel_03_sachiel",
    kind: "angel",
    number: 3,
    name: "Sachiel",
    displayName: "Sachiel",
    shortcodes: ["sachiel"],
    introducedEpisode: "Ep. 1",
    notes: "First Angel encountered on screen. Defeated in Tokyo-3 by Unit-01.",
  },
  {
    id: "angel_04_shamshel",
    kind: "angel",
    number: 4,
    name: "Shamshel",
    displayName: "Shamshel",
    shortcodes: ["shamshel"],
    revealedAt: { kind: "ep", episode: 3 },
    revealedAtSource:
      "https://wiki.evageeks.org/Shamshel --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 3",
    notes: "Tendril-whip angel. Defeated by Unit-01 in close combat.",
  },
  {
    id: "angel_05_ramiel",
    kind: "angel",
    number: 5,
    name: "Ramiel",
    displayName: "Ramiel",
    shortcodes: ["ramiel"],
    revealedAt: { kind: "ep", episode: 5 },
    revealedAtSource:
      "https://wiki.evageeks.org/Ramiel --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 5",
    notes:
      "Giant blue octahedron with a positron beam. The Operation Yashima sniper episode.",
  },
  {
    id: "angel_06_gaghiel",
    kind: "angel",
    number: 6,
    name: "Gaghiel",
    displayName: "Gaghiel",
    shortcodes: ["gaghiel"],
    revealedAt: { kind: "ep", episode: 8 },
    revealedAtSource:
      "https://wiki.evageeks.org/Gaghiel --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 8",
    notes: "Underwater angel. The Pacific fleet engagement with Unit-02.",
  },
  {
    id: "angel_07_israfel",
    kind: "angel",
    number: 7,
    name: "Israfel",
    displayName: "Israfel",
    shortcodes: ["israfel"],
    revealedAt: { kind: "ep", episode: 9 },
    revealedAtSource:
      "https://wiki.evageeks.org/Israfel --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 9",
    notes:
      "Splits into two. Defeated by Shinji and Asuka in the choreographed dance.",
  },
  {
    id: "angel_08_sandalphon",
    kind: "angel",
    number: 8,
    name: "Sandalphon",
    displayName: "Sandalphon",
    shortcodes: ["sandalphon"],
    revealedAt: { kind: "ep", episode: 10 },
    revealedAtSource:
      "https://wiki.evageeks.org/Sandalphon --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 10",
    notes: "Embryonic angel pulled out of Mt. Asama by Unit-02.",
  },
  {
    id: "angel_09_matarael",
    kind: "angel",
    number: 9,
    name: "Matarael",
    displayName: "Matarael",
    shortcodes: ["matarael"],
    revealedAt: { kind: "ep", episode: 11 },
    revealedAtSource:
      "https://wiki.evageeks.org/Matarael --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 11",
    notes: "Spider-shaped acid-rain angel. Defeated during the blackout.",
  },
  {
    id: "angel_10_sahaquiel",
    kind: "angel",
    number: 10,
    name: "Sahaquiel",
    displayName: "Sahaquiel",
    shortcodes: ["sahaquiel"],
    revealedAt: { kind: "ep", episode: 12 },
    revealedAtSource:
      "https://wiki.evageeks.org/Sahaquiel --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 12",
    notes: "Orbital angel that body-checks Tokyo-3. Caught by all three EVAs.",
  },
  {
    id: "angel_11_iruel",
    kind: "angel",
    number: 11,
    name: "Iruel",
    displayName: "Iruel",
    shortcodes: ["iruel"],
    revealedAt: { kind: "ep", episode: 13 },
    revealedAtSource:
      "https://wiki.evageeks.org/Iruel --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 13",
    notes:
      "Nano-machine angel that infiltrates the Magi system. Defeated by Ritsuko.",
  },
  {
    id: "angel_12_leliel",
    kind: "angel",
    number: 12,
    name: "Leliel",
    displayName: "Leliel",
    shortcodes: ["leliel"],
    revealedAt: { kind: "ep", episode: 16 },
    revealedAtSource:
      "https://wiki.evageeks.org/Leliel --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 16",
    notes:
      "Shadow / Dirac sea angel. Swallows Unit-01. The introspective bottle episode.",
  },
  {
    id: "angel_13_bardiel",
    kind: "angel",
    number: 13,
    name: "Bardiel",
    displayName: "Bardiel",
    shortcodes: ["bardiel"],
    revealedAt: { kind: "ep", episode: 18 },
    revealedAtSource:
      "https://wiki.evageeks.org/Bardiel --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 18",
    notes:
      "Possesses Unit-03 with Toji aboard. Forces Unit-01 into a brutal fight.",
  },
  {
    id: "angel_14_zeruel",
    kind: "angel",
    number: 14,
    name: "Zeruel",
    displayName: "Zeruel",
    shortcodes: ["zeruel"],
    revealedAt: { kind: "ep", episode: 19 },
    revealedAtSource:
      "https://wiki.evageeks.org/Zeruel --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 19",
    notes:
      "Paper-ribbon angel. Tears through Tokyo-3. Triggers Unit-01's berserk feeding.",
  },
  {
    id: "angel_15_arael",
    kind: "angel",
    number: 15,
    name: "Arael",
    displayName: "Arael",
    shortcodes: ["arael"],
    revealedAt: { kind: "ep", episode: 22 },
    revealedAtSource:
      "https://wiki.evageeks.org/Arael --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 22",
    notes:
      "Bird-of-light angel. Mind-attacks Asuka. Defeated by the Lance of Longinus.",
  },
  {
    id: "angel_16_armisael",
    kind: "angel",
    number: 16,
    name: "Armisael",
    displayName: "Armisael",
    shortcodes: ["armisael"],
    revealedAt: { kind: "ep", episode: 23 },
    revealedAtSource:
      "https://wiki.evageeks.org/Armisael --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 23",
    notes: "Helix angel that fuses with Unit-00. Forces Rei to self-destruct.",
  },
  {
    id: "angel_17_tabris",
    kind: "angel",
    number: 17,
    name: "Tabris",
    displayName: "Tabris",
    shortcodes: ["tabris"],
    revealedAt: { kind: "ep", episode: 24 },
    revealedAtSource:
      "https://wiki.evageeks.org/Tabris --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "Ep. 24",
    notes: "Seventeenth Angel. The final visible angel of the canonical chain.",
  },
  {
    id: "angel_18_lilim",
    kind: "angel",
    number: 18,
    name: "Lilim",
    displayName: "Lilim",
    shortcodes: ["lilim"],
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/Lilim --- canonical first-appearance per the angel\'s EvaWiki page",
    introducedEpisode: "End of Evangelion",
    notes:
      "Humanity itself, the Eighteenth Angel. Revealed as the Instrumentality conclusion.",
  },
];

const magi: MagiNode[] = [
  {
    id: "magi_casper",
    kind: "magi",
    name: "Casper-3",
    displayName: "Casper-3",
    personality: "Woman",
    shortcodes: ["casper"],
    notes:
      "Naoko Akagi's woman fragment. The terminal-green default Magi node.",
  },
  {
    id: "magi_melchior",
    kind: "magi",
    name: "Melchior-1",
    displayName: "Melchior-1",
    personality: "Scientist",
    shortcodes: ["melchior"],
    notes: "Naoko Akagi's scientist fragment. Lead vote on cold logic.",
  },
  {
    id: "magi_balthasar",
    kind: "magi",
    name: "Balthasar-2",
    displayName: "Balthasar-2",
    personality: "Mother",
    shortcodes: ["balthasar"],
    notes: "Naoko Akagi's mother fragment. Tiebreaker on protective calls.",
  },
];

const organizations: OrganizationNode[] = [
  {
    id: "org_nerv",
    kind: "organization",
    name: "NERV",
    displayName: "NERV",
    shortcodes: ["nerv"],
    notes:
      "UN special agency tasked with fighting the Angels and operating the Evangelions.",
  },
  {
    id: "org_seele",
    kind: "organization",
    name: "SEELE",
    displayName: "SEELE",
    shortcodes: ["seele"],
    revealedAt: { kind: "ep", episode: 14 },
    // Ep. 14 features the SEELE clip-show meeting and the first
    // explicit naming of Keel Lorenz / the Dead Sea Scrolls scenario.
    // (Earlier episodes have voice-only allusions but no on-screen
    // committee.)
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_14 --- 'first mention of Seele's use of the Dead Sea Scrolls as a guide for their scenario' (Keel Lorenz on screen)",
    notes:
      "Numbered red-monolith committee operating above NERV. The hand behind the Human Instrumentality Project.",
  },
  {
    id: "org_wille",
    kind: "organization",
    name: "WILLE",
    displayName: "WILLE",
    shortcodes: ["wille"],
    revealedAt: { kind: "rebuild" },
    revealedAtSource:
      "https://wiki.evageeks.org/Wille --- WILLE is a Rebuild-only organization (Evangelion 3.0 onwards)",
    notes:
      "Anti-NERV organization formed in the Rebuild timeline. Operates the AAA Wunder under Misato.",
  },
  {
    id: "org_gehirn",
    kind: "organization",
    name: "GEHIRN",
    displayName: "GEHIRN",
    shortcodes: ["gehirn"],
    revealedAt: { kind: "ep", episode: 21 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_21 --- 'GEHIRN appears multiple times: Ritsuko joins Gehirn, Gehirn is disbanded' (Director's Cut backstory drop)",
    notes:
      "NERV's predecessor research body. Where Yui, Naoko, Gendo, and Fuyutsuki worked before NERV took over the Evangelion program.",
  },
  {
    id: "org_jssdf",
    kind: "organization",
    name: "JSSDF",
    displayName: "JSSDF",
    shortcodes: ["jssdf"],
    // Note: the JSSDF is technically present from Ep. 1 (UN forces firing
    // N² mines at Sachiel), but the org as a hostile actor against NERV
    // --- the only role it plays in this graph --- is exclusively End of
    // Evangelion. The graph node represents that hostile-actor role, so
    // we gate to EoE rather than Ep. 1.
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/JSSDF --- present from Ep. 1 as UN forces, but the NERV-assault role gated to End of Evangelion",
    notes:
      "Japan Strategic Self Defense Force. Deployed by SEELE to seize NERV HQ in End of Evangelion.",
  },
  {
    id: "org_marduk",
    kind: "organization",
    name: "Marduk Institute",
    displayName: "Marduk Institute",
    shortcodes: ["marduk"],
    // Gendo first names the Marduk Institute in Ep. 4 ("the Fourth
    // Children has yet to be selected by the Marduk Institute"). The
    // 'paper tiger / 108 names' reveal lands later via Kaji's Ep. 15
    // investigation, but the Institute itself is on screen from Ep. 4.
    revealedAt: { kind: "ep", episode: 4 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_04 --- Gendo first references the Marduk Institute",
    notes:
      "Front organization that 'selects' the Children. Eventually revealed as a paper tiger --- 108 names, all empty.",
  },
];

const locations: LocationNode[] = [
  {
    id: "loc_nerv_hq",
    kind: "location",
    name: "NERV HQ",
    // Location nodes always render their displayName as "Place (Location)"
    // so the 3D label disambiguates them from organization or character
    // nodes. validateGraph enforces this suffix.
    displayName: "NERV HQ (Location)",
    shortcodes: ["nervHq"],
    notes:
      "NERV's underground headquarters beneath Tokyo-3, set inside the Geofront cavity.",
  },
  {
    id: "loc_tokyo3",
    kind: "location",
    name: "Tokyo-3",
    displayName: "Tokyo-3 (Location)",
    shortcodes: ["tokyo3"],
    notes:
      "Fortified replacement city built around the Geofront after Second Impact. Buildings retract underground when the alarm sounds.",
  },
  {
    id: "loc_geofront",
    kind: "location",
    name: "Geofront",
    displayName: "Geofront (Location)",
    shortcodes: ["geofront"],
    notes:
      "Cavernous green-tinted void beneath Tokyo-3. Houses NERV HQ; revealed late as the upper hull of the Black Moon.",
  },
  {
    id: "loc_terminal_dogma",
    kind: "location",
    name: "Terminal Dogma",
    displayName: "Terminal Dogma (Location)",
    shortcodes: ["terminalDogma"],
    revealedAt: { kind: "ep", episode: 23 },
    revealedAtSource:
      "https://wiki.evageeks.org/Terminal_Dogma --- 'Inside Terminal Dogma (Episode 23)' first labeled appearance",
    notes:
      "Deepest level of NERV. Lilith hangs crucified above an LCL pool here; the Lance of Longinus rests against her.",
  },
  {
    id: "loc_central_dogma",
    kind: "location",
    name: "Central Dogma",
    displayName: "Central Dogma (Location)",
    shortcodes: ["centralDogma"],
    notes:
      "NERV's command bridge. Misato calls the angel ops, the bridge bunnies man the consoles, the Magi vote.",
  },
  {
    id: "loc_antarctica",
    kind: "location",
    name: "Antarctica",
    displayName: "Antarctica (Location)",
    shortcodes: ["antarctica"],
    revealedAt: { kind: "ep", episode: 21 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_21 --- 'Antarctica (via flashbacks of the Katsuragi Expedition investigating Second Impact)'",
    notes:
      "Site of the Katsuragi Expedition's contact experiment with Adam --- the trigger of Second Impact. Now a frozen red sea.",
  },
];

const concepts: ConceptNode[] = [
  {
    id: "concept_at_field",
    kind: "concept",
    name: "AT Field",
    displayName: "AT Field",
    shortcodes: ["atField"],
    notes:
      "Absolute Terror Field. Hexagonal red barrier projected by every soul. Every angel has one; pilots punch through with their EVA's.",
  },
  {
    id: "concept_lcl",
    kind: "concept",
    name: "LCL",
    displayName: "LCL",
    shortcodes: ["lcl"],
    notes:
      "Link Connect Liquid. Orange amniotic fluid filling the entry plug; the medium pilots breathe and through which neural sync happens.",
  },
  {
    id: "concept_third_impact",
    kind: "concept",
    name: "Third Impact",
    displayName: "Third Impact",
    shortcodes: ["thirdImpact"],
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/Third_Impact --- 'unfolds across End of Evangelion (and abstractly in TV ep 25-26)'",
    notes:
      "Instrumentality. The pink-orange tang of dissolved humanity. Unfolds across End of Evangelion (and abstractly in TV ep 25-26).",
  },
  {
    id: "concept_hedgehogs_dilemma",
    kind: "concept",
    name: "Hedgehog's Dilemma",
    displayName: "Hedgehog's Dilemma",
    shortcodes: ["hedgehogsDilemma"],
    notes:
      "Two hedgehogs huddling for warmth wound each other with their spines --- the closer the cast tries to get, the more they hurt each other. Named in Episode 4.",
  },
  {
    id: "concept_trauma",
    kind: "concept",
    name: "Trauma",
    displayName: "Trauma",
    shortcodes: ["trauma"],
    notes:
      "Unhealed wounds the cast carries into every interaction. Shinji's father, Asuka's mother, Misato's father, Rei's nature.",
  },
  {
    id: "concept_rejection",
    kind: "concept",
    name: "Rejection",
    displayName: "Rejection",
    shortcodes: ["rejection"],
    notes:
      "Fear of being pushed away, braided with Shinji's reflexive 'I mustn't run away.' The hedgehog's dilemma seen from the inside.",
  },
  {
    id: "concept_abandonment",
    kind: "concept",
    name: "Abandonment",
    displayName: "Abandonment",
    shortcodes: ["abandonment"],
    notes:
      "Parents who left, parents who are absent in the room. The through-line under every Ikari and Akagi mother arc.",
  },
  {
    id: "concept_lance_of_longinus",
    kind: "concept",
    name: "Lance of Longinus",
    displayName: "Lance of Longinus",
    shortcodes: ["lanceOfLonginus"],
    // First appears Ep. 12 under wraps on the aircraft carrier
    // transporting it from Antarctica to NERV. First angel kill is
    // Ep. 22 (Rei in Unit-00 throws it into Arael).
    revealedAt: { kind: "ep", episode: 12 },
    revealedAtSource:
      "https://wiki.evageeks.org/Lance_of_Longinus --- 'The Spear first appears in the series in Episode 12 under wraps as it is transported from the Antarctic to Nerv on the flight deck of an aircraft carrier.'",
    notes:
      "Twin-helix golden spear. The only weapon that pierces an angel's AT field. Rei (Unit-00) throws it into Arael, then it's lost in lunar orbit.",
  },
  {
    id: "concept_dummy_plug",
    kind: "concept",
    name: "Dummy Plug",
    displayName: "Dummy Plug",
    shortcodes: ["dummyPlug"],
    revealedAt: { kind: "ep", episode: 18 },
    revealedAtSource:
      "https://wiki.evageeks.org/Dummy_Plug --- 'Nerv successfully uses it only once, when Gendo has it seize control of Eva-01 from Shinji in Episode 18'",
    notes:
      "Autopilot module that runs an EVA on a captive copy of someone's psyche. Crushes Unit-03 with Toji aboard --- the Bardiel kill.",
  },
  {
    id: "concept_s2_engine",
    kind: "concept",
    name: "S² Engine",
    displayName: "S² Engine",
    shortcodes: ["s2Engine"],
    // First intimated Ep. 5 during Shamshel's autopsy ("a mostly-intact
    // S² Engine is obtained from the corpse of Shamshel"). The dramatic
    // Unit-01-absorbs-Zeruel's-S² scene lands later (Ep. 19) but the
    // organ itself is on screen far earlier.
    revealedAt: { kind: "ep", episode: 5 },
    revealedAtSource:
      "https://wiki.evageeks.org/S2_Engine --- 'the location of the S² Engine is strongly intimated in Episode 05 during Shamshel's autopsy'",
    notes:
      "Super Solenoid power organ --- the angels' inexhaustible energy core. Recovered from Shamshel's corpse; later, Unit-01 absorbs Zeruel's S² and goes off-grid.",
  },
  {
    id: "concept_entry_plug",
    kind: "concept",
    name: "Entry Plug",
    displayName: "Entry Plug",
    shortcodes: ["entryPlug"],
    notes:
      "Cylindrical capsule a pilot rides in. Slots into the EVA's spine, floods with LCL, transmits the pilot's nerves to the unit's body.",
  },
  {
    id: "concept_human_instrumentality",
    kind: "concept",
    name: "Human Instrumentality Project",
    displayName: "Human Instrumentality Project",
    shortcodes: ["humanInstrumentality"],
    // Best-confirmed gate: Ep. 14 first features SEELE's "Human
    // Instrumentality Committee" on screen. The wiki could not confirm
    // the exact prior reference (Gendo/Fuyutsuki may name the project
    // earlier in expository dialogue), so this is the safer gate ---
    // the project as a *committee-driven plan* lands here.
    revealedAt: { kind: "ep", episode: 14 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_14 --- 'a clip show presented to the Human Instrumentality Committee of Seele'; project as committee-driven plan first lands here",
    notes:
      "SEELE's endgame: collapse every AT field at once and merge all souls into a single being. Different actors, same Tang.",
  },
  {
    id: "concept_progressive_knife",
    kind: "concept",
    name: "Progressive Knife",
    displayName: "Progressive Knife",
    shortcodes: ["progressiveKnife"],
    notes:
      "Vibrating monomolecular blade stowed in each EVA's shoulder pylon. The default angel-killing tool when the rifle and the lance are out of reach.",
  },
  {
    id: "concept_black_moon",
    kind: "concept",
    name: "Black Moon",
    displayName: "Black Moon",
    shortcodes: ["blackMoon"],
    // The Black Moon as a *named* concept emerges with Instrumentality
    // in Episode 26' (End of Evangelion); the Geofront is hinted as its
    // upper shell earlier but the terminology lands at the finale.
    // Gating to EoE keeps the reveal honest.
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/Black_Moon --- 'In Episode 26', the Black Moon emerged out of the ground' (EoE)",
    notes:
      "The egg-shaped vessel buried under Tokyo-3. The Geofront is its hollow upper shell; Lilith was its passenger. Named in End of Evangelion.",
  },
  {
    id: "concept_white_moon",
    kind: "concept",
    name: "White Moon",
    displayName: "White Moon",
    shortcodes: ["whiteMoon"],
    // Director's Cut Ep. 21 expands the Katsuragi Expedition flashbacks
    // and shows the embryonic Adam pulled from the White Moon. Naming
    // is implicit but the visual lands here.
    revealedAt: { kind: "ep", episode: 21 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_21 --- Antarctica + Katsuragi Expedition flashback; White Moon imagery lands here",
    notes:
      "Antarctic counterpart to the Black Moon. Adam's vessel; the Katsuragi Expedition cracked it open and triggered Second Impact.",
  },
];

const events: EventNode[] = [
  {
    id: "event_first_impact",
    kind: "event",
    name: "First Impact",
    displayName: "First Impact",
    shortcodes: ["firstImpact"],
    // First Impact is part of the Director's Cut backstory drop in
    // Ep. 21 (the Giant Impact that formed the Moon, paired with the
    // White Moon in Antarctica). Mentioned offhand earlier in some
    // episodes but the canonical "what was First Impact" exposition
    // lands here.
    revealedAt: { kind: "ep", episode: 21 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_21 --- Director's Cut backstory drop covering First Impact / Katsuragi Expedition",
    notes:
      "Pre-history collision that formed the Moon and stranded the White Moon (Adam's vessel) in Antarctica. Backstory only; the show drips it out across the late-teens episodes.",
  },
  {
    id: "event_second_impact",
    kind: "event",
    name: "Second Impact",
    displayName: "Second Impact",
    shortcodes: ["secondImpact"],
    // Second Impact (the existence of) is mentioned from Ep. 1 onward as
    // "the catastrophe fifteen years ago" --- visible from Ep. 1, hence
    // no gate. The CAUSE (Adam contact) is gated separately on the Adam
    // -> Second Impact 'caused' edge to ep 21.
    notes:
      "September 2000. The Katsuragi Expedition's contact experiment with Adam in Antarctica triggered a global cataclysm. Mentioned from Ep. 1 as 'the catastrophe fifteen years ago'; cause and details revealed late.",
  },
];

const families: FamilyNode[] = [
  {
    id: "family_ikari",
    kind: "family",
    name: "Ikari",
    // Family nodes always render their displayName as "Surname (Family)" so
    // the 3D label and readout card can never be mistaken for a character.
    // validateGraph enforces this suffix.
    displayName: "Ikari (Family)",
    shortcodes: ["ikari"],
    notes:
      "The Ikari family --- Shinji (Third Child), Gendo (NERV Commander), and Yui (lost to Unit-01).",
  },
  {
    id: "family_akagi",
    kind: "family",
    name: "Akagi",
    displayName: "Akagi (Family)",
    shortcodes: ["akagi"],
    notes:
      "The Akagi family --- Ritsuko (NERV chief scientist) and her late mother Naoko (original Magi designer).",
  },
];

/**
 * EVA units. Visibility gates track first on-screen appearance, NOT pilot
 * reveals: Unit-03 is visible from Ep. 17 because the unit itself shows up
 * then; the Toji <-> Unit-03 pilots edge carries its own gate. Mass
 * Production is EoE-only.
 */
const evas: EvaNode[] = [
  {
    id: "eva_unit00",
    kind: "eva",
    name: "Unit-00",
    number: 0,
    displayName: "Unit-00",
    shortcodes: ["unit00"],
    notes:
      "Prototype EVA. Originally orange, repainted blue after the activation incident.",
  },
  {
    id: "eva_unit01",
    kind: "eva",
    name: "Unit-01",
    number: 1,
    displayName: "Unit-01",
    shortcodes: ["unit01"],
    notes: "Test type. Iconic purple body with a green chest plate.",
  },
  {
    id: "eva_unit02",
    kind: "eva",
    name: "Unit-02",
    number: 2,
    displayName: "Unit-02",
    shortcodes: ["unit02"],
    revealedAt: { kind: "ep", episode: 8 },
    revealedAtSource:
      "https://wiki.evageeks.org/Evangelion_Unit-02 --- arrives with Asuka on the Pacific fleet in Ep. 8",
    notes:
      "Production type. Bright red body with orange shoulder pylons; arrives with the Pacific fleet.",
  },
  {
    id: "eva_unit03",
    kind: "eva",
    name: "Unit-03",
    number: 3,
    displayName: "Unit-03",
    shortcodes: ["unit03"],
    revealedAt: { kind: "ep", episode: 17 },
    revealedAtSource:
      "https://wiki.evageeks.org/Evangelion_Unit-03 --- ships from the US branch in Ep. 17 (the Fourth Child reveal episode), activated in Ep. 18",
    notes:
      "Black-bodied production EVA shipped from the US branch. Activated in Ep. 18.",
  },
  {
    id: "eva_unit04",
    kind: "eva",
    name: "Unit-04",
    number: 4,
    displayName: "Unit-04",
    shortcodes: ["unit04"],
    revealedAt: { kind: "ep", episode: 18 },
    revealedAtSource:
      "https://wiki.evageeks.org/Evangelion_Unit-04 --- the S² engine experiment / Nevada-branch loss is referenced in Ep. 18",
    notes:
      "Silver prototype. Lost with the Nevada branch in the S2 engine experiment.",
  },
  {
    id: "eva_mass_production",
    kind: "eva",
    name: "Mass Production",
    // Sentinel above 04 so the canonical EVA sort places mass production last.
    number: 99,
    displayName: "Mass Production",
    shortcodes: ["massProduction"],
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/MP_Eva --- End of Evangelion-only series",
    notes:
      "End of Evangelion white-bodied series. Identical clones with rictus grins.",
  },
];

/**
 * Edges. Five kinds in the seed:
 *   - magi_link: tight triangle between the three Magi (3-in-1 joke).
 *   - angel_sequence: chain angel(N) -> angel(N+1) for N = 1..17, mirroring
 *     the canonical TV-series numbering.
 *   - identity_reveal: late-show "X is really Y" edges. Each gated to its
 *     reveal episode independently of either endpoint:
 *       Toji <-> Bardiel  (Ep. 18)
 *       Rei <-> Yui       (Ep. 23)
 *       Kaworu <-> Tabris (Ep. 24)
 *   - pilots: character -> EVA unit. Shinji-Unit01 from Ep. 1; Toji-Unit03
 *     gated to the Fourth Child reveal (Ep. 17).
 *   - member_of_family: character -> family. Shinji/Gendo/Yui -> Ikari,
 *     Ritsuko/Naoko -> Akagi. Endpoint masking handles the gates: Yui's
 *     edge stays hidden until Ep. 20 because the Yui node itself is gated.
 *
 * Each edge is stamped with its kind's spring weight (EDGE_WEIGHT) so the
 * force layout equilibrates at a predictable distance.
 */
function buildEdges(): Edge[] {
  const out: Edge[] = [];

  // Magi triangle: every pair, both directions are not needed --- a single
  // edge per pair is enough for the layout. Three pairs total.
  const magiWeight = EDGE_WEIGHT.magi_link;
  out.push({
    from: "magi_casper",
    to: "magi_melchior",
    kind: "magi_link",
    weight: magiWeight,
    notes: "Casper <-> Melchior (3-in-1)",
  });
  out.push({
    from: "magi_melchior",
    to: "magi_balthasar",
    kind: "magi_link",
    weight: magiWeight,
    notes: "Melchior <-> Balthasar (3-in-1)",
  });
  out.push({
    from: "magi_balthasar",
    to: "magi_casper",
    kind: "magi_link",
    weight: magiWeight,
    notes: "Balthasar <-> Casper (3-in-1)",
  });

  // Angel canonical sequence.
  const angelWeight = EDGE_WEIGHT.angel_sequence;
  const sorted = [...angels].sort((a, b) => a.number - b.number);
  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]!;
    const to = sorted[i + 1]!;
    out.push({
      from: from.id,
      to: to.id,
      kind: "angel_sequence",
      weight: angelWeight,
      notes: `Angel #${from.number} (${from.name}) -> Angel #${to.number} (${to.name})`,
    });
  }

  // Identity reveals --- the spoiler-gated relationships.
  const idWeight = EDGE_WEIGHT.identity_reveal;
  out.push({
    from: "char_toji",
    to: "angel_13_bardiel",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "ep", episode: 18 },
    revealedAtSource:
      "https://wiki.evageeks.org/Bardiel --- the possessed-Unit-03 reveal lands in Ep. 18",
    shortcodes: ["toji", "bardiel"],
    notes: "Toji is the Unit-03 pilot; Bardiel possesses Unit-03 (Ep. 18).",
  });
  out.push({
    from: "char_rei",
    to: "char_yui",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "ep", episode: 23 },
    revealedAtSource:
      "https://wiki.evageeks.org/Rei_Ayanami --- Rei's Yui-derived genetic origin lands in Ep. 23",
    shortcodes: ["rei", "yui"],
    notes: "Rei's origin traces back to Yui's salvaged genetic material.",
  });
  out.push({
    from: "char_kaworu",
    to: "angel_17_tabris",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "ep", episode: 24 },
    revealedAtSource:
      "https://wiki.evageeks.org/Tabris --- Kaworu = Tabris reveal lands in Ep. 24 ('The Final Messenger')",
    shortcodes: ["kaworu", "tabris"],
    notes: "Kaworu IS the Seventeenth Angel, Tabris (Ep. 24).",
  });

  // Pilots --- character -> EVA unit. Each edge inherits the unit's gate
  // unless the pilot reveal is itself a spoiler (Toji as the Fourth Child).
  const pilotsWeight = EDGE_WEIGHT.pilots;
  out.push({
    from: "char_shinji",
    to: "eva_unit01",
    kind: "pilots",
    weight: pilotsWeight,
    shortcodes: ["shinji", "unit01"],
    notes: "Shinji pilots Unit-01 (Ep. 1).",
  });
  out.push({
    from: "char_rei",
    to: "eva_unit00",
    kind: "pilots",
    weight: pilotsWeight,
    shortcodes: ["rei", "unit00"],
    notes: "Rei pilots Unit-00.",
  });
  out.push({
    from: "char_asuka",
    to: "eva_unit02",
    kind: "pilots",
    weight: pilotsWeight,
    revealedAt: { kind: "ep", episode: 8 },
    revealedAtSource: "Inherits Asuka and Unit-02 Ep. 8 first-appearance gates",
    shortcodes: ["asuka", "unit02"],
    notes: "Asuka pilots Unit-02 (arrives Ep. 8).",
  });
  out.push({
    from: "char_toji",
    to: "eva_unit03",
    kind: "pilots",
    weight: pilotsWeight,
    revealedAt: { kind: "ep", episode: 17 },
    revealedAtSource:
      "https://wiki.evageeks.org/Toji_Suzuhara --- the Fourth Child / Unit-03 pilot reveal lands in Ep. 17",
    shortcodes: ["toji", "unit03"],
    notes: "Toji is the Fourth Child / Unit-03 pilot (Ep. 17).",
  });

  // Family memberships --- characters orbit their family roll-up node.
  const familyWeight = EDGE_WEIGHT.member_of_family;
  const familyEdges: Array<{
    from: string;
    to: string;
    shortcodes: [string, string];
    notes: string;
  }> = [
    {
      from: "char_shinji",
      to: "family_ikari",
      shortcodes: ["shinji", "ikari"],
      notes: "Shinji Ikari --- Third Child, Gendo and Yui's son.",
    },
    {
      from: "char_gendo",
      to: "family_ikari",
      shortcodes: ["gendo", "ikari"],
      notes: "Gendo Ikari --- NERV commander, Shinji's father.",
    },
    {
      from: "char_yui",
      to: "family_ikari",
      shortcodes: ["yui", "ikari"],
      notes: "Yui Ikari --- Shinji's mother, lost to Unit-01.",
    },
    {
      from: "char_ritsuko",
      to: "family_akagi",
      shortcodes: ["ritsuko", "akagi"],
      notes: "Ritsuko Akagi --- NERV chief scientist, Naoko's daughter.",
    },
    {
      from: "char_naoko",
      to: "family_akagi",
      shortcodes: ["naoko", "akagi"],
      notes: "Naoko Akagi --- original Magi designer, Ritsuko's mother.",
    },
  ];
  for (const e of familyEdges) {
    out.push({
      from: e.from,
      to: e.to,
      kind: "member_of_family",
      weight: familyWeight,
      shortcodes: e.shortcodes,
      notes: e.notes,
    });
  }

  // Eliminated edges: EVA -> angel the unit took down, one row per
  // participating unit. Each edge is gated to the episode the kill happens
  // on screen --- you don't get to know who eliminated Tabris before you
  // watch Ep 24. Adam (Second Impact backstory), Lilith (EoE, no EVA in
  // canon), Iruel (defeated by Ritsuko's Magi reprogram, no EVA), and Lilim
  // (humanity itself) are intentionally absent --- none have a canonical
  // EVA killer in the TV series.
  const eliminatedWeight = EDGE_WEIGHT.eliminated;
  const eliminations: Array<{
    eva: string;
    evaShortcode: string;
    angel: string;
    angelShortcode: string;
    episode: number;
    notes: string;
  }> = [
    {
      eva: "eva_unit01",
      evaShortcode: "unit01",
      angel: "angel_03_sachiel",
      angelShortcode: "sachiel",
      episode: 2,
      notes: "Unit-01 berserks and finishes the Third Angel in Tokyo-3 (Ep. 2).",
    },
    {
      eva: "eva_unit01",
      evaShortcode: "unit01",
      angel: "angel_04_shamshel",
      angelShortcode: "shamshel",
      episode: 3,
      notes: "Unit-01 cuts down the tendril-whip Fourth Angel with prog knives (Ep. 3).",
    },
    {
      eva: "eva_unit01",
      evaShortcode: "unit01",
      angel: "angel_05_ramiel",
      angelShortcode: "ramiel",
      episode: 6,
      notes: "Operation Yashima --- Unit-01 lands the positron rifle shot, Unit-00 holds the heat shield (Ep. 6).",
    },
    {
      eva: "eva_unit02",
      evaShortcode: "unit02",
      angel: "angel_06_gaghiel",
      angelShortcode: "gaghiel",
      episode: 8,
      notes: "Unit-02 pries open Gaghiel's jaws underwater and detonates the fleet's payload (Ep. 8).",
    },
    {
      eva: "eva_unit01",
      evaShortcode: "unit01",
      angel: "angel_07_israfel",
      angelShortcode: "israfel",
      episode: 9,
      notes: "Synchronized-dance kill --- Unit-01 lands one of the simultaneous strikes (Ep. 9).",
    },
    {
      eva: "eva_unit02",
      evaShortcode: "unit02",
      angel: "angel_07_israfel",
      angelShortcode: "israfel",
      episode: 9,
      notes: "Synchronized-dance kill --- Unit-02 lands the other simultaneous strike (Ep. 9).",
    },
    {
      eva: "eva_unit02",
      evaShortcode: "unit02",
      angel: "angel_08_sandalphon",
      angelShortcode: "sandalphon",
      episode: 10,
      notes: "Unit-02 retrieves the embryonic Sandalphon from the Mt. Asama caldera and destroys it (Ep. 10).",
    },
    {
      eva: "eva_unit01",
      evaShortcode: "unit01",
      angel: "angel_09_matarael",
      angelShortcode: "matarael",
      episode: 11,
      notes: "Manual operation during the Tokyo-3 blackout --- Unit-01 lands the kill shot on Matarael's eye (Ep. 11).",
    },
    {
      // Correction (audited 2026-04-28 against EvaWiki):
      //   prior data attributed the Sahaquiel kill to Unit-01.
      //   wiki/Sahaquiel: Eva-02 'wielded prog knives to penetrate its
      //   core, respectively' --- Unit-02 makes the kill, Unit-00 cut
      //   the AT field, Unit-01 caught the body.
      eva: "eva_unit02",
      evaShortcode: "unit02",
      angel: "angel_10_sahaquiel",
      angelShortcode: "sahaquiel",
      episode: 12,
      notes: "All three EVAs catch the falling Tenth Angel; Unit-02 drives the prog knife through its core (Ep. 12).",
    },
    {
      eva: "eva_unit01",
      evaShortcode: "unit01",
      angel: "angel_12_leliel",
      angelShortcode: "leliel",
      episode: 16,
      notes: "Unit-01 berserks out of Leliel's Dirac sea, splitting the shadow from inside (Ep. 16).",
    },
    {
      eva: "eva_unit01",
      evaShortcode: "unit01",
      angel: "angel_13_bardiel",
      angelShortcode: "bardiel",
      episode: 18,
      notes: "Unit-01 under Dummy Plug control destroys the possessed Unit-03, killing Bardiel (Ep. 18).",
    },
    {
      eva: "eva_unit01",
      evaShortcode: "unit01",
      angel: "angel_14_zeruel",
      angelShortcode: "zeruel",
      episode: 19,
      notes: "Unit-01 berserks again and consumes Zeruel's S2 organ (Ep. 19).",
    },
    {
      // Correction (audited 2026-04-28 against EvaWiki):
      //   prior data attributed the Arael kill to Unit-02 / Asuka.
      //   wiki/Arael: 'Eva-00 then returned to the surface, and hurled
      //   the Spear of Longinus into the sky [...] pierced Arael's
      //   A.T. Field and destroyed the Angel.' Asuka was incapacitated
      //   by Arael's mind-attack; Rei retrieves the Lance from Terminal
      //   Dogma and makes the kill.
      eva: "eva_unit00",
      evaShortcode: "unit00",
      angel: "angel_15_arael",
      angelShortcode: "arael",
      episode: 22,
      notes: "Rei retrieves the Lance from Terminal Dogma and Unit-00 hurls it into the bird-of-light Fifteenth Angel (Ep. 22).",
    },
    {
      eva: "eva_unit00",
      evaShortcode: "unit00",
      angel: "angel_16_armisael",
      angelShortcode: "armisael",
      episode: 23,
      notes: "Rei self-destructs Unit-00 to take the helix Sixteenth Angel with her (Ep. 23).",
    },
    {
      eva: "eva_unit01",
      evaShortcode: "unit01",
      angel: "angel_17_tabris",
      angelShortcode: "tabris",
      episode: 24,
      notes: "Unit-01 crushes Kaworu / Tabris in its hand at Shinji's request (Ep. 24).",
    },
  ];
  for (const e of eliminations) {
    // Each elimination cites the angel's EvaWiki page --- the canonical
    // source that names the killing unit and the episode.
    const angelName = e.angel.replace(/^angel_\d+_/, "");
    const source = `https://wiki.evageeks.org/${angelName.charAt(0).toUpperCase()}${angelName.slice(1)}`;
    out.push({
      from: e.eva,
      to: e.angel,
      kind: "eliminated",
      weight: eliminatedWeight,
      revealedAt: { kind: "ep", episode: e.episode },
      revealedAtSource: source,
      shortcodes: [e.evaShortcode, e.angelShortcode],
      notes: e.notes,
    });
  }

  // Generic EVA <-> EVA mesh: Unit-00 through Unit-04 fully connected
  // (K5 = 10 edges). Mass Production is intentionally excluded --- it's a
  // separate visual class belonging to the EoE finale, not the piloted
  // canon roster. Endpoint masking handles the spoiler gates: an edge
  // touching Unit-04 stays hidden until Ep. 18 because Unit-04 itself is
  // gated there.
  const genericWeight = EDGE_WEIGHT.generic;
  const pilotedEvas = [
    "eva_unit00",
    "eva_unit01",
    "eva_unit02",
    "eva_unit03",
    "eva_unit04",
  ];
  for (let i = 0; i < pilotedEvas.length; i++) {
    for (let j = i + 1; j < pilotedEvas.length; j++) {
      out.push({
        from: pilotedEvas[i]!,
        to: pilotedEvas[j]!,
        kind: "generic",
        weight: genericWeight,
        notes: "",
      });
    }
  }

  // Org membership --- characters orbit their employer / cabal. NERV
  // covers most of the cast; SEELE pulls Gendo (and Kaji, who triple-agents
  // for them); GEHIRN groups the pre-NERV legacy researchers and is gated
  // to the Ep. 21 backstory drop. Each edge inherits the org-node's gate
  // through endpoint masking; a few are stamped with their own gate where
  // the affiliation reveal is the spoiler (Gendo <-> SEELE).
  const memberOfOrgWeight = EDGE_WEIGHT.member_of_org;
  const orgEdges: Array<{
    from: string;
    to: string;
    shortcodes: [string, string];
    revealedAt?: import("./types").RevealedAt;
    revealedAtSource?: string;
    notes: string;
  }> = [
    // NERV staff (open from Ep. 1 unless the character itself is gated).
    { from: "char_misato", to: "org_nerv", shortcodes: ["misato", "nerv"], notes: "Misato Katsuragi --- NERV Operations Director." },
    { from: "char_gendo", to: "org_nerv", shortcodes: ["gendo", "nerv"], notes: "Gendo Ikari --- NERV Commander." },
    { from: "char_ritsuko", to: "org_nerv", shortcodes: ["ritsuko", "nerv"], notes: "Ritsuko Akagi --- NERV Chief Scientist." },
    { from: "char_fuyutsuki", to: "org_nerv", shortcodes: ["fuyutsuki", "nerv"], notes: "Kozo Fuyutsuki --- NERV Sub-Commander." },
    { from: "char_maya", to: "org_nerv", shortcodes: ["maya", "nerv"], notes: "Maya Ibuki --- NERV bridge crew." },
    { from: "char_hyuga", to: "org_nerv", shortcodes: ["hyuga", "nerv"], notes: "Makoto Hyuga --- NERV bridge crew." },
    { from: "char_aoba", to: "org_nerv", shortcodes: ["aoba", "nerv"], notes: "Shigeru Aoba --- NERV bridge crew." },
    {
      from: "char_kaji",
      to: "org_nerv",
      shortcodes: ["kaji", "nerv"],
      revealedAt: { kind: "ep", episode: 8 },
      revealedAtSource: "Inherits Kaji's Ep. 8 first-appearance gate",
      notes: "Ryoji Kaji --- NERV special inspector (overt cover).",
    },

    // SEELE allegiances (each gated independently of NERV).
    {
      from: "char_gendo",
      to: "org_seele",
      shortcodes: ["gendo", "seele"],
      revealedAt: { kind: "ep", episode: 14 },
      revealedAtSource:
        "https://wiki.evageeks.org/Episode_14 --- SEELE committee + Keel Lorenz on screen for the first time, Gendo's chain-of-command made explicit",
      notes: "Gendo answers to the SEELE committee until he doesn't.",
    },
    {
      from: "char_kaji",
      to: "org_seele",
      shortcodes: ["kaji", "seele"],
      revealedAt: { kind: "ep", episode: 21 },
      revealedAtSource:
        "https://wiki.evageeks.org/Episode_21 --- Director's Cut backstory drop names Kaji as a SEELE intelligence asset alongside the Yui/Naoko material",
      notes: "Kaji's third allegiance --- intelligence asset for SEELE.",
    },

    // GEHIRN: NERV's predecessor body. Gated to the Ep. 21 backstory drop;
    // every member also worked for NERV after the rebrand.
    { from: "char_yui", to: "org_gehirn", shortcodes: ["yui", "gehirn"], notes: "Yui Ikari --- GEHIRN researcher; lost to Unit-01 during contact." },
    { from: "char_naoko", to: "org_gehirn", shortcodes: ["naoko", "gehirn"], notes: "Naoko Akagi --- GEHIRN's Magi architect." },
    { from: "char_gendo", to: "org_gehirn", shortcodes: ["gendo", "gehirn"], notes: "Gendo Ikari --- GEHIRN, then NERV." },
    { from: "char_fuyutsuki", to: "org_gehirn", shortcodes: ["fuyutsuki", "gehirn"], notes: "Kozo Fuyutsuki --- GEHIRN, then NERV." },
  ];
  for (const e of orgEdges) {
    out.push({
      from: e.from,
      to: e.to,
      kind: "member_of_org",
      weight: memberOfOrgWeight,
      shortcodes: e.shortcodes,
      ...(e.revealedAt ? { revealedAt: e.revealedAt } : {}),
      ...(e.revealedAtSource ? { revealedAtSource: e.revealedAtSource } : {}),
      notes: e.notes,
    });
  }

  // Spatial nesting: a child place sits inside its parent. Tokyo-3 sits on
  // top of the Geofront, NERV HQ sits inside the Geofront, and Terminal /
  // Central Dogma both sit inside NERV HQ. Antarctica is geographically
  // separate; it is NOT nested under Tokyo-3.
  const locatedInWeight = EDGE_WEIGHT.located_in;
  const locatedInEdges: Array<{
    from: string;
    to: string;
    shortcodes: [string, string];
    revealedAt?: import("./types").RevealedAt;
    revealedAtSource?: string;
    notes: string;
  }> = [
    { from: "loc_geofront", to: "loc_tokyo3", shortcodes: ["geofront", "tokyo3"], notes: "Geofront cavity sits beneath Tokyo-3." },
    { from: "loc_nerv_hq", to: "loc_geofront", shortcodes: ["nervHq", "geofront"], notes: "NERV HQ is built inside the Geofront." },
    { from: "loc_central_dogma", to: "loc_nerv_hq", shortcodes: ["centralDogma", "nervHq"], notes: "Central Dogma is the command bridge inside NERV HQ." },
    {
      from: "loc_terminal_dogma",
      to: "loc_nerv_hq",
      shortcodes: ["terminalDogma", "nervHq"],
      revealedAt: { kind: "ep", episode: 23 },
      revealedAtSource: "Inherits Terminal Dogma's Ep. 23 first-labeled gate",
      notes: "Terminal Dogma is the deepest sublevel of NERV HQ.",
    },
    // Lilith's resting place inside Terminal Dogma --- gated to the late
    // reveal (both endpoints carry their own gate; this stamps the edge).
    {
      from: "angel_02_lilith",
      to: "loc_terminal_dogma",
      shortcodes: ["lilith", "terminalDogma"],
      revealedAt: { kind: "ep", episode: 23 },
      revealedAtSource:
        "https://wiki.evageeks.org/Lilith --- Lilith on the cross at the bottom of Terminal Dogma is the Ep. 23 reveal",
      notes: "Lilith hangs crucified at the bottom of Terminal Dogma.",
    },
    // Adam's resting place / origin (the White Moon) sits in Antarctica.
    // Both endpoints gate to the late backstory drop.
    {
      from: "concept_white_moon",
      to: "loc_antarctica",
      shortcodes: ["whiteMoon", "antarctica"],
      revealedAt: { kind: "ep", episode: 21 },
      revealedAtSource: "Inherits White Moon and Antarctica's Ep. 21 gates",
      notes: "The White Moon sits buried under Antarctica.",
    },
    // The Black Moon hosts the Geofront cavity.
    {
      from: "concept_black_moon",
      to: "loc_geofront",
      shortcodes: ["blackMoon", "geofront"],
      // Black Moon as a named entity lands in EoE (Ep. 26'); endpoint
      // monotonicity demands at least an EoE gate on this edge.
      revealedAt: { kind: "eoe" },
      revealedAtSource: "Inherits Black Moon's EoE gate",
      notes: "The Geofront is the Black Moon's hollow upper shell.",
    },
  ];
  for (const e of locatedInEdges) {
    out.push({
      from: e.from,
      to: e.to,
      kind: "located_in",
      weight: locatedInWeight,
      shortcodes: e.shortcodes,
      ...(e.revealedAt ? { revealedAt: e.revealedAt } : {}),
      ...(e.revealedAtSource ? { revealedAtSource: e.revealedAtSource } : {}),
      notes: e.notes,
    });
  }

  // Causation: cause -> event/concept. The lance, S² engine, dummy plug,
  // entry plug etc. are all *enabling* concepts, not events; the explicit
  // causal arc is angel/expedition -> impact event.
  const causedWeight = EDGE_WEIGHT.caused;
  const causedEdges: Array<{
    from: string;
    to: string;
    shortcodes: [string, string];
    revealedAt?: import("./types").RevealedAt;
    revealedAtSource?: string;
    notes: string;
  }> = [
    {
      from: "angel_01_adam",
      to: "event_second_impact",
      shortcodes: ["adam", "secondImpact"],
      revealedAt: { kind: "ep", episode: 21 },
      revealedAtSource:
        "https://wiki.evageeks.org/Episode_21 --- Adam contact / Katsuragi Expedition revealed as the trigger of Second Impact",
      notes: "Contact with Adam triggered Second Impact.",
    },
    {
      from: "loc_antarctica",
      to: "event_second_impact",
      shortcodes: ["antarctica", "secondImpact"],
      revealedAt: { kind: "ep", episode: 21 },
      revealedAtSource:
        "Inherits Antarctica's Ep. 21 gate; Second Impact location shown via flashbacks",
      notes: "Second Impact unfolded in Antarctica during the Katsuragi Expedition.",
    },
    {
      from: "concept_human_instrumentality",
      to: "concept_third_impact",
      shortcodes: ["humanInstrumentality", "thirdImpact"],
      revealedAt: { kind: "eoe" },
      revealedAtSource: "Inherits Third Impact's EoE gate",
      notes: "Instrumentality is the program that drives Third Impact.",
    },
    {
      from: "org_seele",
      to: "concept_human_instrumentality",
      shortcodes: ["seele", "humanInstrumentality"],
      revealedAt: { kind: "ep", episode: 14 },
      revealedAtSource:
        "https://wiki.evageeks.org/Episode_14 --- SEELE's Human Instrumentality Committee meets on screen for the first time",
      notes: "SEELE owns the Instrumentality Project blueprint.",
    },
    {
      from: "org_jssdf",
      to: "concept_third_impact",
      shortcodes: ["jssdf", "thirdImpact"],
      revealedAt: { kind: "eoe" },
      revealedAtSource: "End of Evangelion --- JSSDF assault triggers Third Impact",
      notes: "JSSDF assault on NERV HQ kicks off Third Impact in End of Evangelion.",
    },
  ];
  for (const e of causedEdges) {
    out.push({
      from: e.from,
      to: e.to,
      kind: "caused",
      weight: causedWeight,
      shortcodes: e.shortcodes,
      ...(e.revealedAt ? { revealedAt: e.revealedAt } : {}),
      ...(e.revealedAtSource ? { revealedAtSource: e.revealedAtSource } : {}),
      notes: e.notes,
    });
  }

  // A few more typed connections that don't fit the kinds above:
  //   - Pen Pen lives with Misato (generic --- household tie).
  //   - Hikari is Asuka's best friend (generic --- close-friend tie).
  //   - Kensuke is Shinji and Toji's classmate (generic --- school tie).
  //   - Unit-02 wields the Lance of Longinus (generic --- weapon use).
  //   - GEHIRN was succeeded by NERV (generic --- predecessor org).
  //   - SEELE controls NERV (generic --- gated authority tie).
  //   - WILLE opposes NERV (generic, Rebuild gate inherited from WILLE).
  const supportEdges: Array<{
    from: string;
    to: string;
    shortcodes: [string, string];
    revealedAt?: import("./types").RevealedAt;
    revealedAtSource?: string;
    notes: string;
  }> = [
    { from: "char_pen_pen", to: "char_misato", shortcodes: ["penPen", "misato"], notes: "Pen Pen lives in Misato's apartment." },
    { from: "char_hikari", to: "char_asuka", shortcodes: ["hikari", "asuka"], notes: "Class rep --- Asuka's best friend.", revealedAt: { kind: "ep", episode: 8 }, revealedAtSource: "Inherits Asuka's Ep. 8 first-appearance gate" },
    { from: "char_hikari", to: "char_toji", shortcodes: ["hikari", "toji"], notes: "Class rep --- not-so-secret crush on Toji.", revealedAt: { kind: "ep", episode: 3 }, revealedAtSource: "Inherits Hikari + Toji Ep. 3 introduction" },
    { from: "char_kensuke", to: "char_shinji", shortcodes: ["kensuke", "shinji"], notes: "Classmate. Camera glued to his hand." },
    { from: "char_kensuke", to: "char_toji", shortcodes: ["kensuke", "toji"], notes: "Classmate.", revealedAt: { kind: "ep", episode: 3 }, revealedAtSource: "Inherits Kensuke + Toji Ep. 3 introduction" },
    { from: "char_misato", to: "char_kaji", shortcodes: ["misato", "kaji"], notes: "Misato and Kaji --- exes from college.", revealedAt: { kind: "ep", episode: 8 }, revealedAtSource: "https://wiki.evageeks.org/Ryoji_Kaji --- Ep. 8 reintroduction reveals their college relationship" },
    { from: "char_kaji", to: "char_asuka", shortcodes: ["kaji", "asuka"], notes: "Asuka's escort on the Pacific fleet.", revealedAt: { kind: "ep", episode: 8 }, revealedAtSource: "https://wiki.evageeks.org/Ryoji_Kaji --- 'accompanies Asuka from Germany to Tokyo-3 during Ep. 8'" },
    { from: "char_fuyutsuki", to: "char_yui", shortcodes: ["fuyutsuki", "yui"], notes: "Yui Ikari was Fuyutsuki's metaphysical-biology student.", revealedAt: { kind: "ep", episode: 21 }, revealedAtSource: "https://wiki.evageeks.org/Episode_21 --- Director's Cut backstory drop establishes Fuyutsuki/Yui mentor-student relationship" },
    { from: "eva_unit00", to: "concept_lance_of_longinus", shortcodes: ["unit00", "lanceOfLonginus"], notes: "Rei (Unit-00) retrieves the Lance from Terminal Dogma and hurls it into Arael.", revealedAt: { kind: "ep", episode: 22 }, revealedAtSource: "https://wiki.evageeks.org/Arael --- 'Eva-00 [...] hurled the Spear of Longinus into the sky [...] pierced Arael's A.T. Field and destroyed the Angel'" },
    { from: "concept_lance_of_longinus", to: "loc_terminal_dogma", shortcodes: ["lanceOfLonginus", "terminalDogma"], notes: "The Lance rests against Lilith in Terminal Dogma.", revealedAt: { kind: "ep", episode: 23 }, revealedAtSource: "Inherits Terminal Dogma's Ep. 23 first-labeled gate; Lance shown alongside Lilith" },
    { from: "org_gehirn", to: "org_nerv", shortcodes: ["gehirn", "nerv"], notes: "GEHIRN was the body that became NERV.", revealedAt: { kind: "ep", episode: 21 }, revealedAtSource: "Inherits GEHIRN's Ep. 21 gate" },
    { from: "org_seele", to: "org_nerv", shortcodes: ["seele", "nerv"], notes: "SEELE is NERV's parent committee.", revealedAt: { kind: "ep", episode: 14 }, revealedAtSource: "Inherits SEELE's Ep. 14 gate" },
    { from: "org_wille", to: "org_nerv", shortcodes: ["wille", "nerv"], notes: "WILLE breaks from NERV in the Rebuild timeline." },
    { from: "org_jssdf", to: "loc_nerv_hq", shortcodes: ["jssdf", "nervHq"], notes: "JSSDF assault on NERV HQ kicks off End of Evangelion.", revealedAt: { kind: "eoe" }, revealedAtSource: "End of Evangelion --- JSSDF assault" },
    { from: "org_marduk", to: "org_nerv", shortcodes: ["marduk", "nerv"], notes: "Marduk Institute --- NERV's Children-selection front. The 108-names paper-tiger reveal lands in Ep. 15 via Kaji's investigation.", revealedAt: { kind: "ep", episode: 15 }, revealedAtSource: "https://wiki.evageeks.org/Marduk_Institute --- 'Ryoji Kaji's investigations in Episode 15' reveal it's a dummy organization" },
    { from: "concept_dummy_plug", to: "char_rei", shortcodes: ["dummyPlug", "rei"], notes: "The Dummy Plug runs on Rei-derived psyche copies.", revealedAt: { kind: "ep", episode: 20 }, revealedAtSource: "https://wiki.evageeks.org/Dummy_Plug --- the Rei-derived personality data is revealed mid-show; Ep. 20 marks the reveal of Yui-in-Unit-01 / Rei lineage" },
    { from: "concept_dummy_plug", to: "eva_unit01", shortcodes: ["dummyPlug", "unit01"], notes: "Unit-01 under Dummy Plug control destroys the possessed Unit-03.", revealedAt: { kind: "ep", episode: 18 }, revealedAtSource: "Inherits Dummy Plug's Ep. 18 first-use gate" },
    { from: "concept_s2_engine", to: "eva_unit01", shortcodes: ["s2Engine", "unit01"], notes: "Unit-01 absorbs Zeruel's S² and goes off-grid.", revealedAt: { kind: "ep", episode: 19 }, revealedAtSource: "https://wiki.evageeks.org/Zeruel --- Unit-01 berserks and absorbs Zeruel's S² in Ep. 19" },
    { from: "concept_entry_plug", to: "concept_lcl", shortcodes: ["entryPlug", "lcl"], notes: "The entry plug floods with LCL on activation." },
    { from: "concept_progressive_knife", to: "eva_unit01", shortcodes: ["progressiveKnife", "unit01"], notes: "Unit-01's prog knife stowed in the shoulder pylon." },
  ];
  for (const e of supportEdges) {
    out.push({
      from: e.from,
      to: e.to,
      kind: "generic",
      weight: genericWeight,
      shortcodes: e.shortcodes,
      ...(e.revealedAt ? { revealedAt: e.revealedAt } : {}),
      ...(e.revealedAtSource ? { revealedAtSource: e.revealedAtSource } : {}),
      notes: e.notes,
    });
  }

  return out;
}

export const evangelion: EvangelionGraph = {
  id: "evangelion",
  title: "Neon Genesis Evangelion --- canon seed",
  source: "Neon Genesis Evangelion (TV) + End of Evangelion",
  nodes: [
    ...characters,
    ...angels,
    ...magi,
    ...organizations,
    ...locations,
    ...concepts,
    ...families,
    ...evas,
    ...events,
  ],
  edges: buildEdges(),
};
