import type {
  AngelNode,
  AudienceNode,
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
 * Seed for the Neon Genesis Evangeli-Graph. Canon scope: 1995 TV series +
 * End of Evangelion. Rebuild is a parallel timeline and is OUT OF SCOPE.
 *
 * Top-level kinds:
 *   - characters (Shinji, Asuka, ..., plus Naoko Akagi for the Magi line,
 *     and Keel Lorenz for SEELE).
 *   - angels: 18 canonical NGE TV-series order (Adam = 1, Lilim = 18).
 *   - magi: 3 nodes in a tight triangle (the "3-in-1" joke).
 *   - families: lineage roll-ups (Ikari, Akagi). Characters point at their
 *     family via member_of_family edges.
 *   - concepts: AT Field, LCL, Third Impact (the last gated to End of
 *     Evangelion / TV ep 25+).
 *   - organizations / locations / EVAs / events: as below.
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
    notes:
      "The protagonist. Fourteen, summoned to Tokyo-3 by the father who abandoned him after his mother died. Pilots Unit-01 because saying yes hurts less than saying no, and saying no means Rei gets wheeled back into the broken plug. Believes the only way to be loved is to be useful.",
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
    notes:
      "Pilot of Unit-02. Born in Germany to mixed Japanese-American-German parentage, college-graduated at fourteen, fluent in three languages. Arrives on the Pacific fleet from Berlin with Unit-02 in Ep. 8 ('Asuka Strikes'). The EVA program's golden child --- and convinced that being the best is the only thing keeping her safe.",
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
      "First Child, pilot of Unit-00. Pale-blue hair, red eyes, nearly affectless. Lives alone in a barren apartment off-base, speaks rarely, follows orders precisely. Wakes from injuries the show never quite explains and walks back into the entry plug as if it's the only place she belongs.",
  },
  {
    id: "char_misato",
    kind: "character",
    displayName: "Misato Katsuragi",
    shortcodes: ["misato"],
    role: "NERV Operations Director",
    tags: [{ id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } }],
    notes:
      "NERV Captain (later Major) and Operations Director. The voice on the comms during every angel battle --- the calm one, by training, while the city above her is being torn apart. Picks Shinji up the day he arrives in Tokyo-3 and takes him in. Drinks Yebisu like water; the apartment is too quiet otherwise.",
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
      // The 'dies-by-end-of-series' tag is canonically EoE-gated as a
      // finale-prep flag (see TAGS registry --- the tag describes 'all
      // your friends are dead by the closing scene', not a per-character
      // timing). Kaworu's actual on-screen death is Ep. 24; the EVA <->
      // angel eliminated edge captures that beat without leaking the
      // 'dies' label outside the finale window.
      { id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } },
    ],
    notes:
      "The Fifth Child. Silver-grey hair, red eyes, calm voice. Arrives in Ep. 24 already knowing things he should not, plays Beethoven from memory, takes a bath with Shinji. The first person to tell Shinji he is loved. Crushed in Unit-01's grip on his own request before the credits roll.",
  },
  {
    id: "char_gendo",
    kind: "character",
    displayName: "Gendo Ikari",
    shortcodes: ["gendo"],
    role: "NERV Commander",
    tags: [{ id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } }],
    notes:
      "NERV Commander. Tinted glasses, gloved hands, immobile face. Summoned Shinji to Tokyo-3 the day NERV needed a Unit-01 pilot --- the first time he had addressed his son in years. Runs the angel war from the bridge, the Children from arm's length, and his own scenario from somewhere underneath both.",
  },
  {
    id: "char_ritsuko",
    kind: "character",
    displayName: "Ritsuko Akagi",
    shortcodes: ["ritsuko"],
    role: "NERV Chief Scientist",
    tags: [{ id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } }],
    // The 'Naoko's daughter' relationship is the Ep. 13 exposition;
    // mentioning Naoko on a node visible from Ep. 1 would leak. The
    // Ritsuko -> Akagi family edge plus the family member roll-up
    // surfaces the lineage once Naoko unlocks at Ep. 13.
    notes:
      "NERV Chief Scientist. Lead engineer on the Evangelions and operator of the Magi system. Lab coat, blonde hair, ever-present cigarette. The only person on the bridge who can tell the Commander a number is wrong --- and the one who has to live with what the numbers say.",
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
      "Shinji's classmate. Athletic, gruff, fiercely loyal once you're in. His little sister was hospitalized when Sachiel went down on Tokyo-3 --- he punches Shinji for it on the morning they meet, and reverses the moment Unit-01 puts itself between Shamshel and the rooftop he's standing on.",
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
      "Shinji's mother. Metaphysical-biology researcher under Fuyutsuki at Kyoto, married into the Ikari family, volunteered for the 2004 Unit-01 contact experiment. The unit took her whole. Shinji was four and watched it happen. Her soul is what makes Unit-01 fight.",
  },
  {
    id: "char_kyoko",
    kind: "character",
    displayName: "Kyoko Zeppelin Soryu",
    shortcodes: ["kyoko"],
    role: "Asuka's mother / Unit-02 contact-experiment subject (lost)",
    // Kyoko is never on screen alive in NGE. Her backstory surfaces in
    // Ep. 22 ('Don't Be') under Arael's mind-attack on Asuka --- the
    // Kyoko-mistakes-the-doll-for-Asuka / suicide-by-hanging beats are the
    // wound Arael pries open. The 'her soul is in Unit-02' confirmation
    // lands later in Ep. 25' (EoE) when Asuka hears Kyoko's voice
    // mid-Mass-Production-assault.
    revealedAt: { kind: "ep", episode: 22 },
    revealedAtSource:
      "https://wiki.evageeks.org/Asuka_Langley_Soryu --- Kyoko's contact-experiment psychosis, doll obsession, and suicide are exposed under Arael's Ep. 22 mind-attack",
    notes:
      "Asuka's mother. Underwent the Unit-02 contact experiment and lost her mind --- mistook a rag doll for her daughter, asked young Asuka to die with her, hanged herself with the doll while Asuka was offstage celebrating her selection as the Second Child. Her soul lives on inside Unit-02. The wound that drives every Asuka beat.",
  },
  {
    id: "char_naoko",
    kind: "character",
    displayName: "Naoko Akagi",
    shortcodes: ["naoko"],
    role: "Magi designer (lost)",
    // First named in Ep. 13 ("Lilliputian Hitcher" / Iruel attack), where
    // Ritsuko delivers the Magi-personality exposition: Casper / Melchior /
    // Balthasar carry her mother's three personalities (Woman, Scientist,
    // Mother). The Director's Cut Ep. 21 backstory drop ADDS the
    // Gendo-affair / strangling-Rei / suicide details, but the character
    // herself first lands at Ep. 13 by name and role.
    revealedAt: { kind: "ep", episode: 13 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_13 --- Ritsuko's Magi-personality exposition names her late mother as the Magi architect",
    notes:
      "Original architect of the Magi system. Ritsuko's late mother. Split her own psyche into three personality fragments --- Woman, Scientist, Mother --- and burned them into Casper, Melchior, and Balthasar respectively. The three Magi still vote on every NERV operation in her voice.",
  },
  {
    id: "char_kaji",
    kind: "character",
    displayName: "Ryoji Kaji",
    shortcodes: ["kaji"],
    // Public-facing role only --- the triple-agent fact emerges from
    // his three org affiliations (NERV / Japanese Government / SEELE),
    // each gated to its own reveal episode (Ep. 8 / Ep. 15 / Ep. 21).
    role: "NERV special inspector",
    revealedAt: { kind: "ep", episode: 8 },
    revealedAtSource:
      "https://wiki.evageeks.org/Ryoji_Kaji --- 'Kaji's first appearance in the series is in episode 8' (with Asuka on the Pacific fleet)",
    // The 'dies-by-end-of-series' tag is canonically EoE-gated as a
    // finale-prep flag (see TAGS registry); Kaji's actual offscreen
    // death lands at the end of Ep. 21 and is implied by the SEELE
    // edge gate, but the death TAG stays behind the EoE wall.
    tags: [{ id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } }],
    notes:
      "NERV special inspector and Misato's college ex. Escorts Asuka and Unit-02 from Germany on the Pacific fleet in Ep. 8. Carries himself like a man running three jobs and only admitting to one. Tends watermelons in his off hours --- a hobby for someone who wants something that grows back.",
  },
  {
    id: "char_fuyutsuki",
    kind: "character",
    displayName: "Kozo Fuyutsuki",
    shortcodes: ["fuyutsuki"],
    role: "NERV Sub-Commander",
    tags: [{ id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } }],
    // The 'Yui's metaphysical-biology professor' backstory is the Ep. 21
    // Director's Cut drop and lives on the Fuyutsuki <-> Yui edge, not
    // here.
    notes:
      "NERV Sub-Commander. Stands at Gendo's shoulder on every bridge scene --- the only person in the building who has known him long enough to disagree out loud. Carries the kind of patience that comes from outliving most of the people who knew you when.",
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
  {
    id: "char_keel",
    kind: "character",
    displayName: "Keel Lorenz",
    shortcodes: ["keel"],
    role: "Chairman of SEELE",
    revealedAt: { kind: "ep", episode: 14 },
    revealedAtSource:
      "https://wiki.evageeks.org/Keel_Lorenz --- first on-screen as the SEELE chairman in Ep. 14 ('Weaving a Story') alongside the Human Instrumentality Committee scene",
    tags: [{ id: "dies-by-end-of-series", revealedAt: { kind: "eoe" } }],
    notes:
      "Chairman of SEELE-01 and the man holding the Dead Sea Scrolls. Cyborg from the neck down --- visor, exoskeleton, the works. Believes humanity is overdue to be reduced to a single soul, and runs the Instrumentality scenario from the orange SOUND ONLY monolith. Gendo answers to him until Ep. 24, after which the answers stop arriving on time.",
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
      "First Angel. Recovered as an embryo from the White Moon in Antarctica. The trigger of Second Impact via the Katsuragi Expedition's contact experiment.",
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
      "Second Angel. Crucified at the bottom of NERV's Terminal Dogma, with the Lance of Longinus pinning her to the wall.",
  },
  {
    id: "angel_03_sachiel",
    kind: "angel",
    number: 3,
    name: "Sachiel",
    displayName: "Sachiel",
    shortcodes: ["sachiel"],
    introducedEpisode: "Ep. 1",
    notes:
      "First Angel encountered on screen --- bone-mask face, beaked head, broken wings. Walks out of Tokyo Bay onto Tokyo-3 in Ep. 1, the cold open of the entire series. Defeated in Tokyo-3 by Unit-01.",
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
      "Bird-of-light angel. Attacks from orbit by piercing Asuka's mind --- the assault that breaks her sync ratio for the rest of the show. Rei retrieves the Lance of Longinus from Terminal Dogma and hurls it skyward from Unit-00; the Lance pierces Arael's AT field and ends it.",
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
    notes:
      "Seventeenth Angel --- the last to walk among the Lilim. Wears Kaworu Nagisa's face for one episode: learns piano, takes a bath with Shinji, asks to be ended. Crushed in Unit-01's grip on Shinji's command, Ep. 24.",
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
      "Humanity itself --- the Eighteenth Angel. Tabris speaks the word once and the show flinches. Every face in the audience is one. Recognized in End of Evangelion as the species that killed every one of its older siblings to inherit the Earth.",
  },
];

/**
 * Magi nodes. The three supercomputers exist on screen as voting overlays
 * from earlier episodes (Ep. 11 'In the Still Darkness' features the
 * three-way vote during the Tokyo-3 blackout), but the nature of each as a
 * personality fragment of Naoko Akagi --- the data this graph encodes
 * directly in the `personality` field and `notes` body --- is the Ep. 13
 * exposition. Gating the nodes to Ep. 13 keeps the personality split
 * spoiler-clean; pre-Ep-13 the user sees three masked black blobs in a
 * tight triangle.
 */
const magi: MagiNode[] = [
  {
    id: "magi_casper",
    kind: "magi",
    name: "Casper-3",
    displayName: "Casper-3",
    personality: "Woman",
    shortcodes: ["casper"],
    revealedAt: { kind: "ep", episode: 13 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_13 --- Ritsuko's Iruel-attack monologue exposes the three personality fragments (Woman / Scientist / Mother)",
    notes: "Carries the Woman aspect. The terminal-green default Magi node.",
  },
  {
    id: "magi_melchior",
    kind: "magi",
    name: "Melchior-1",
    displayName: "Melchior-1",
    personality: "Scientist",
    shortcodes: ["melchior"],
    revealedAt: { kind: "ep", episode: 13 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_13 --- Ritsuko's Iruel-attack monologue exposes the three personality fragments (Woman / Scientist / Mother)",
    notes: "Carries the Scientist aspect. Lead vote on cold logic.",
  },
  {
    id: "magi_balthasar",
    kind: "magi",
    name: "Balthasar-2",
    displayName: "Balthasar-2",
    personality: "Mother",
    shortcodes: ["balthasar"],
    revealedAt: { kind: "ep", episode: 13 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_13 --- Ritsuko's Iruel-attack monologue exposes the three personality fragments (Woman / Scientist / Mother)",
    notes: "Carries the Mother aspect. Tiebreaker on protective calls.",
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
    id: "org_japan_gov",
    kind: "organization",
    name: "Japanese Government",
    displayName: "Japanese Government",
    shortcodes: ["japanGov"],
    // Misato confronts Kaji at Terminal Dogma in Ep. 15 and asks whether
    // he works for NERV or 'as an agent for the Japanese Department of
    // Home Affairs' --- Kaji's double-agent status is exposed on screen
    // here. (His third allegiance to SEELE lands separately in Ep. 21.)
    revealedAt: { kind: "ep", episode: 15 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_15 --- Misato exposes Kaji's Department of Home Affairs allegiance at Terminal Dogma",
    notes:
      "Civilian government of Japan. Quietly investigating NERV behind the UN cover; runs Kaji as an intelligence asset.",
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
    // investigation; that fact lives on the Marduk -> NERV edge gate,
    // not in this node's notes.
    revealedAt: { kind: "ep", episode: 4 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_04 --- Gendo first references the Marduk Institute",
    notes: "The committee that 'selects' the Children for the EVA program.",
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
    // The 'upper hull of the Black Moon' reveal is EoE-only and lives on
    // the Black Moon -> Geofront located_in edge gate, not here. The
    // cavity itself is on screen from the early eps as NERV's setting.
    notes: "Cavernous green-tinted void beneath Tokyo-3. Houses NERV HQ.",
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
  {
    id: "loc_mt_asama",
    kind: "location",
    name: "Mt. Asama",
    displayName: "Mt. Asama (Location)",
    shortcodes: ["mtAsama"],
    revealedAt: { kind: "ep", episode: 10 },
    revealedAtSource:
      "https://wiki.evageeks.org/Sandalphon --- the embryonic Eighth Angel is recovered from Mt. Asama's caldera in Ep. 10",
    notes:
      "Active volcano in Honshu. Sandalphon gestates in the magma chamber; Unit-02 in heat-resistant Type-D armor abseils into the caldera in Ep. 10 to retrieve it. Asuka kicks the angel apart at the bottom of a volcano.",
  },
  {
    id: "loc_matsushiro",
    kind: "location",
    name: "Matsushiro",
    displayName: "Matsushiro (Location)",
    shortcodes: ["matsushiro"],
    revealedAt: { kind: "ep", episode: 18 },
    revealedAtSource:
      "https://wiki.evageeks.org/Matsushiro --- NERV's Second (Japanese) Branch in Nagano, used for Unit-03's activation test in Ep. 18",
    notes:
      "NERV's Second Branch in Nagano Prefecture. Repurposed as the Unit-03 activation test site in Ep. 18 --- where Bardiel takes the unit and the Dummy Plug takes Unit-01.",
  },
  {
    id: "loc_pribnow_box",
    kind: "location",
    name: "Pribnow Box",
    displayName: "Pribnow Box (Location)",
    shortcodes: ["pribnowBox"],
    revealedAt: { kind: "ep", episode: 13 },
    revealedAtSource:
      "https://wiki.evageeks.org/Pribnow_box --- the test facility Iruel infiltrates in Ep. 13 ('Lilliputian Hitcher')",
    notes:
      "Test facility deep inside NERV HQ. Houses the Evangelion simulation bodies and their plug controls. Iruel infiltrates the building through a contaminated 87th protein wall installed here in Ep. 13.",
  },
  {
    id: "loc_nerv2",
    kind: "location",
    name: "NERV-2 (Nevada)",
    displayName: "NERV-2 (Nevada) (Location)",
    shortcodes: ["nerv2"],
    revealedAt: { kind: "ep", episode: 18 },
    revealedAtSource:
      "https://wiki.evageeks.org/Evangelion_Unit-04 --- the S² engine experiment / Nevada-branch loss is established in Ep. 18 fallout",
    notes:
      "NERV's Second Branch in the Nevada desert. Where Unit-04 was test-fitted with an experimental S² engine in 2015 --- the entire branch and a Mojave-sized crater of land vanished in the failure. Unit-03 was shipped from here to Matsushiro.",
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
      "Absolute Terror Field. The wall between self and other. Angels project them as visible hexagonal red shields; EVAs neutralize an angel's field with their own and punch through. Late in the show the term widens to mean the same wall every person builds against every other person.",
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
    id: "concept_depression",
    kind: "concept",
    name: "Depression",
    displayName: "Depression",
    shortcodes: ["depression"],
    notes:
      "Shinji's defining affliction. 'I mustn't run away' as a depressive command. The bathwater stillness, the LCL passivity, the Ep. 16 acceptance of being eaten by Leliel, the Ep. 24 'I don't want to do anything' bath scene with Kaworu, the Ep. 25-26 closing surrender. He carries it the entire run and never names it.",
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
  {
    id: "concept_dead_sea_scrolls",
    kind: "concept",
    name: "Dead Sea Scrolls",
    displayName: "Dead Sea Scrolls",
    shortcodes: ["deadSeaScrolls"],
    // Named on screen in Ep. 14 alongside the first Human Instrumentality
    // Committee meeting --- the Scrolls are the prophecy SEELE runs the
    // entire scenario by.
    revealedAt: { kind: "ep", episode: 14 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_14 --- 'first mention of Seele's use of the Dead Sea Scrolls as a guide for their scenario'",
    notes:
      "The prophecy SEELE runs the world by. Predicts the angels in numerical order, names the two Moons, and lays out the Instrumentality scenario. Keel keeps the only complete copy.",
  },
  {
    id: "concept_sound_only",
    kind: "concept",
    name: "Sound Only",
    displayName: "Sound Only",
    shortcodes: ["soundOnly"],
    revealedAt: { kind: "ep", episode: 14 },
    revealedAtSource:
      "https://wiki.evageeks.org/Episode_14 --- the SEELE clip-show meeting introduces the SOUND ONLY monolith presentation",
    notes:
      "The orange 'SOUND ONLY' monolith. SEELE's twelve members appear to Gendo as numbered red triangles plus this one black-on-orange slab; nobody on the bridge ever sees a face. The most stylish committee meeting in anime.",
  },
  {
    id: "concept_berserk",
    kind: "concept",
    name: "Berserk Mode",
    displayName: "Berserk Mode",
    shortcodes: ["berserk"],
    revealedAt: { kind: "ep", episode: 2 },
    revealedAtSource:
      "https://wiki.evageeks.org/Berserk --- Unit-01 first goes berserk in Ep. 2 finishing off Sachiel with bare hands after umbilical disconnect",
    notes:
      "What happens when an EVA's umbilical drops, the sync ratio spikes past 100, and the soul inside decides it has had enough. Unit-01 goes there in Eps. 2 (Sachiel), 16 (Leliel), and 19 (Zeruel) --- it bites, it screams, it eats S² engines.",
  },
  {
    id: "concept_yebisu",
    kind: "concept",
    name: "Yebisu",
    displayName: "Yebisu",
    shortcodes: ["yebisu"],
    revealedAt: { kind: "ep", episode: 2 },
    revealedAtSource:
      "https://wiki.evageeks.org/Misato_Katsuragi --- Misato's Yebisu can introduces the apartment in Ep. 2",
    notes:
      "Misato's drink. A 500ml gold-label can opened over the head, drained in three seconds flat, finished with the loudest 'PUHAAA!' on Japanese television. Load-bearing structural element of the Katsuragi apartment.",
  },
  {
    id: "concept_watermelons",
    kind: "concept",
    name: "Watermelons",
    displayName: "Watermelons",
    shortcodes: ["watermelons"],
    revealedAt: { kind: "ep", episode: 17 },
    revealedAtSource:
      "https://wiki.evageeks.org/Ryoji_Kaji --- Kaji's NERV greenhouse watermelon plot is established as his off-hours hobby in Ep. 17",
    notes:
      "Kaji's hobby. Triple-agent on three payrolls; on his off days he tends a NERV greenhouse plot of striped melons. A man running three jobs wants something that grows back.",
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
  {
    id: "event_operation_yashima",
    kind: "event",
    name: "Operation Yashima",
    displayName: "Operation Yashima",
    shortcodes: ["operationYashima"],
    revealedAt: { kind: "ep", episode: 6 },
    revealedAtSource:
      "https://wiki.evageeks.org/Operation_Yashima --- the positron sniper op against Ramiel that defines Ep. 6",
    notes:
      "Ep. 6. Every spare watt in the Japanese archipelago drains into a single positron rifle so Unit-01 can shoot the Fifth Angel through the head from outside its AT field range. Rei in Unit-00 holds the heat shield, Shinji takes the shot, and the show stops being about giant robots and starts being about the kids.",
  },
];

/**
 * Audience nodes. Singular --- the viewer-as-Lilim. Tabris names humanity
 * itself the 18th Angel in Ep. 24, and End of Evangelion makes the reading
 * literal: the audience IS Lilim. The node is gated to EoE (mirroring
 * angel_18_lilim's gate) and connects to Lilim with an identity_reveal
 * edge of the same gate. Pre-EoE the user sees nothing; post-EoE a pure
 * white node sits beside Lilim with the line "you ARE Lilim" implied.
 */
const audience: AudienceNode[] = [
  {
    id: "audience_you",
    kind: "audience",
    name: "You",
    displayName: "You",
    shortcodes: ["you"],
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/Lilim --- Tabris names humanity itself the 18th Angel in Ep. 24; End of Evangelion makes the reading literal (the audience IS Lilim).",
    notes:
      "The eighteenth angel. Tabris speaks the word once and the show flinches. Every face in the audience is one. You are watching this. You are one.",
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
    notes:
      "Test type. Iconic violet body, green chest plate, single orange horn. The temperamental one --- it sometimes moves without input from the bridge. Shinji's unit.",
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
      "The first true production-spec EVA. Bright red body, four-eyed visor, twin orange shoulder pylons. Asuka's unit. Arrives on the Pacific fleet from Berlin in Ep. 8 and immediately drops underwater to pry Gaghiel's jaws open.",
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
      "Black-bodied production EVA shipped from the NERV-2 (US) branch in Ep. 17. Activated inside a Matsushiro test cage in Ep. 18 --- the activation goes wrong from the first second and Unit-01 is sent in to handle it.",
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
  // Yui Ikari is fused inside Unit-01 --- the contact-experiment reveal
  // is the heart of the Ep. 20 backstory drop ('Weaving a Story 2: oral
  // stage'). The character node and the EVA node both render from earlier
  // episodes, but the line connecting them is the late-show plot beat.
  out.push({
    from: "char_yui",
    to: "eva_unit01",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "ep", episode: 20 },
    revealedAtSource:
      "https://wiki.evageeks.org/Yui_Ikari --- Director's Cut Ep. 20 establishes Yui's soul fused into Unit-01 during the contact experiment",
    shortcodes: ["yui", "unit01"],
    notes: "Yui's soul is what makes Unit-01 tick (Ep. 20 contact-experiment reveal).",
  });
  // The three Magi each carry one of Naoko's three personality fragments
  // (Casper = Woman, Melchior = Scientist, Balthasar = Mother) ---
  // Ritsuko's Ep. 13 Iruel-attack monologue exposes the split. Both
  // endpoints (Magi nodes and Naoko) are gated to Ep. 13; the edges stamp
  // the relationship explicitly.
  const magiFragments: Array<{ magi: string; magiCode: string; aspect: string }> = [
    { magi: "magi_casper", magiCode: "casper", aspect: "Woman" },
    { magi: "magi_melchior", magiCode: "melchior", aspect: "Scientist" },
    { magi: "magi_balthasar", magiCode: "balthasar", aspect: "Mother" },
  ];
  for (const f of magiFragments) {
    out.push({
      from: f.magi,
      to: "char_naoko",
      kind: "identity_reveal",
      weight: idWeight,
      revealedAt: { kind: "ep", episode: 13 },
      revealedAtSource:
        "https://wiki.evageeks.org/Episode_13 --- Ritsuko's Magi-personality exposition splits Naoko into Woman, Scientist, Mother",
      shortcodes: [f.magiCode, "naoko"],
      notes: `${f.magi.replace(/^magi_/, "").replace(/^./, (c) => c.toUpperCase())} carries Naoko's ${f.aspect} aspect (Ep. 13).`,
    });
  }

  // The viewer is Lilim. Tabris speaks the line in Ep. 24 ("Lilim --- so
  // that's what you call yourselves"); End of Evangelion makes the reading
  // literal. Edge gated to EoE so the relationship lands at the same time
  // both endpoints become visible. The endpoint masking layer hides the
  // line until then anyway, but the explicit gate keeps the citation
  // attached for the test suite + future audit trail.
  out.push({
    from: "audience_you",
    to: "angel_18_lilim",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/Lilim --- the 'humanity is the Eighteenth Angel' reading lands in End of Evangelion",
    shortcodes: ["you", "lilim"],
    notes: "Tabris's reading: humanity is the 18th angel. The viewer IS Lilim.",
  });

  // Kaworu IS Adam --- not just the Seventeenth Angel. SEELE salvaged Adam's
  // soul into Kaworu's body; per EvaWiki "Kaworu's body is a vessel for the
  // salvaged soul of Adam itself" / "in effect Adam reborn as a human." The
  // Tabris identity reveal lands at Ep. 24; the Adam-vessel layer is fully
  // surfaced in End of Evangelion (Kaworu's soul returns to Adam's embryo
  // alongside Rei-Lilith's transformation).
  out.push({
    from: "char_kaworu",
    to: "angel_01_adam",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/Kaworu_Nagisa --- 'Kaworu's body is a vessel for the salvaged soul of Adam itself'; the Adam-vessel layer is the EoE-level read",
    shortcodes: ["kaworu", "adam"],
    notes: "Kaworu's body carries Adam's salvaged soul --- in effect, Adam reborn.",
  });

  // Rei is Lilith's vessel. Per EvaWiki: 'Rei Ayanami may incorporate DNA
  // from the Second Angel, Lilith, because she is the vessel for Lilith's
  // soul.' The full reveal lands in End of Evangelion when Rei merges with
  // Lilith's body and transforms into a giant white Rei to initiate Third
  // Impact. Rei's node is open from Ep. 1; the Lilith-vessel relationship
  // is gated separately to EoE.
  out.push({
    from: "char_rei",
    to: "angel_02_lilith",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/Rei_Ayanami --- 'Rei Ayanami [...] is the vessel for Lilith's soul'; the merge lands in Episode 26'",
    shortcodes: ["rei", "lilith"],
    notes: "Rei is the vessel for Lilith's soul --- the merge is the engine of Third Impact.",
  });

  // Unit-01 is Lilith's clone, not Adam's. Per EvaWiki: 'Unlike the other
  // Evas, its body was generated directly from the body of Lilith, and is
  // consequently referred to as Lilith's offspring or clone.' This is the
  // canonical cleavage in the EVA series: every other unit is Adam-derived,
  // but Unit-01 is Lilith-derived. EoE-gated as a deep-canon read.
  out.push({
    from: "eva_unit01",
    to: "angel_02_lilith",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/Evangelion_Unit-01 --- 'its body was generated directly from the body of Lilith [...] referred to as Lilith's offspring or clone'",
    shortcodes: ["unit01", "lilith"],
    notes: "Unit-01 is Lilith's clone --- the only EVA derived from the Second Angel rather than Adam.",
  });

  // Lilim are Lilith's children. Per EvaWiki: 'Lilith is the direct
  // progenitor of humanity.' Humanity 'arose from Lilith,' who 'spread
  // primordial ooze, LCL (actually, Lilith's own blood), into the primitive
  // ocean.' This is the EoE-level reveal that closes the audience-Lilim-
  // -Lilith chain: you ARE Lilim, and Lilim descend from Lilith.
  out.push({
    from: "angel_18_lilim",
    to: "angel_02_lilith",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/Lilim --- 'Lilith is the direct progenitor of humanity' / humanity 'arose from Lilith'",
    shortcodes: ["lilim", "lilith"],
    notes: "Lilim --- humanity --- descend from Lilith. The audience IS Lilim, and Lilim ARE Lilith's offspring.",
  });

  // Adam-based EVA clones. Per EvaWiki/Unit-01: 'Eva-01 has the same
  // characteristics as an Adam-based (i.e., any other) Evangelion' ---
  // every other piloted unit is cloned from Adam's flesh. Unit-01 is the
  // exception (Lilith-cloned, edge above). EoE-gated as deep canon: pre-
  // -finale a viewer doesn't know the EVA biology splits this way.
  const adamClones: Array<{ eva: string; evaShortcode: string }> = [
    { eva: "eva_unit00", evaShortcode: "unit00" },
    { eva: "eva_unit02", evaShortcode: "unit02" },
    { eva: "eva_unit03", evaShortcode: "unit03" },
    { eva: "eva_unit04", evaShortcode: "unit04" },
  ];
  for (const c of adamClones) {
    out.push({
      from: c.eva,
      to: "angel_01_adam",
      kind: "identity_reveal",
      weight: idWeight,
      revealedAt: { kind: "eoe" },
      revealedAtSource:
        "https://wiki.evageeks.org/Evangelion_Unit-01 --- 'Eva-01 has the same characteristics as an Adam-based (i.e., any other) Evangelion' (every non-01 EVA is Adam-cloned)",
      shortcodes: [c.evaShortcode, "adam"],
      notes: `${c.eva.replace("eva_", "")} is cloned from Adam --- the canonical EVA-biology cleavage (Unit-01 is the lone Lilith exception).`,
    });
  }

  // Unit-02 carries Kyoko Zeppelin Soryu's soul. Per EvaWiki/Unit-02:
  // 'Eva-02's soul is that of Kyoko Zeppelin Soryu, and for this reason,
  // her daughter, Asuka Langley Soryu, was chosen as the Eva's pilot.'
  // Confirmation lands in Ep. 25' (EoE) when Kyoko's voice reaches Asuka
  // mid-Mass-Production assault: 'You mustn't die! You must live!'
  out.push({
    from: "eva_unit02",
    to: "char_kyoko",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "eoe" },
    revealedAtSource:
      "https://wiki.evageeks.org/Evangelion_Unit-02 --- 'Eva-02's soul is that of Kyoko Zeppelin Soryu' (confirmed Ep. 25')",
    shortcodes: ["unit02", "kyoko"],
    notes: "Unit-02 carries Kyoko Soryu's soul --- the reason Asuka was selected. The Mama!-moment of Ep. 25'.",
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
      // Sahaquiel was a three-EVA kill (audited against EvaWiki):
      //   Unit-00 (Rei) exposes the core with a progressive knife cut
      //     through the AT field.
      //   Unit-02 (Asuka) drives the killing strike into the exposed
      //     core --- the angel self-destructs.
      //   Unit-01 (Shinji) holds the falling body up so the other two
      //     can land their hits.
      // All three earn an eliminated edge --- per-user guidance:
      // elimination is the most aggressive bond on the graph and
      // every participant should read.
      eva: "eva_unit00",
      evaShortcode: "unit00",
      angel: "angel_10_sahaquiel",
      angelShortcode: "sahaquiel",
      episode: 12,
      notes: "Unit-00 (Rei) exposes Sahaquiel's core with a prog knife through the AT field (Ep. 12).",
    },
    {
      eva: "eva_unit01",
      evaShortcode: "unit01",
      angel: "angel_10_sahaquiel",
      angelShortcode: "sahaquiel",
      episode: 12,
      notes: "Unit-01 (Shinji) holds the falling Tenth Angel up so the others can land the kill (Ep. 12).",
    },
    {
      eva: "eva_unit02",
      evaShortcode: "unit02",
      angel: "angel_10_sahaquiel",
      angelShortcode: "sahaquiel",
      episode: 12,
      notes: "Unit-02 (Asuka) drives the prog knife into Sahaquiel's exposed core --- the angel self-destructs (Ep. 12).",
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
      to: "org_japan_gov",
      shortcodes: ["kaji", "japanGov"],
      revealedAt: { kind: "ep", episode: 15 },
      revealedAtSource:
        "https://wiki.evageeks.org/Episode_15 --- Misato confronts Kaji at Terminal Dogma about working for the Department of Home Affairs",
      notes: "Kaji's second allegiance --- intelligence asset for the Japanese government (Ep. 15 reveal).",
    },
    {
      from: "char_kaji",
      to: "org_seele",
      shortcodes: ["kaji", "seele"],
      revealedAt: { kind: "ep", episode: 21 },
      revealedAtSource:
        "https://wiki.evageeks.org/Episode_21 --- Director's Cut backstory drop names Kaji as a SEELE intelligence asset alongside the Yui/Naoko material",
      notes: "Kaji's third allegiance --- intelligence asset for SEELE (Ep. 21 reveal).",
    },

    // GEHIRN: NERV's predecessor body. Gated to the Ep. 21 backstory drop;
    // every member also worked for NERV after the rebrand.
    { from: "char_yui", to: "org_gehirn", shortcodes: ["yui", "gehirn"], notes: "Yui Ikari --- GEHIRN researcher; lost to Unit-01 during contact." },
    { from: "char_naoko", to: "org_gehirn", shortcodes: ["naoko", "gehirn"], notes: "Naoko Akagi --- GEHIRN's Magi architect." },
    { from: "char_gendo", to: "org_gehirn", shortcodes: ["gendo", "gehirn"], notes: "Gendo Ikari --- GEHIRN, then NERV." },
    { from: "char_fuyutsuki", to: "org_gehirn", shortcodes: ["fuyutsuki", "gehirn"], notes: "Kozo Fuyutsuki --- GEHIRN, then NERV." },

    // Keel Lorenz chairs SEELE-01. Anchors the SEELE side of the graph
    // around an actual person instead of just a monolith stand-in.
    {
      from: "char_keel",
      to: "org_seele",
      shortcodes: ["keel", "seele"],
      revealedAt: { kind: "ep", episode: 14 },
      revealedAtSource: "Inherits Keel's Ep. 14 first-appearance gate",
      notes: "Keel Lorenz --- SEELE-01 chairman.",
    },
    // Kaworu is SEELE's last messenger --- the Fifth Child sent to NERV in
    // place of Toji's replacement, with orders to descend to Adam (and
    // ending up at Lilith instead). Per EvaWiki his arrival at NERV is a
    // SEELE handoff, not a NERV recruitment, so the membership edge belongs
    // here even though his on-screen role looks like a Child slot.
    {
      from: "char_kaworu",
      to: "org_seele",
      shortcodes: ["kaworu", "seele"],
      revealedAt: { kind: "ep", episode: 24 },
      revealedAtSource:
        "https://wiki.evageeks.org/Kaworu_Nagisa --- 'Seele dispatches Kaworu to NERV' as the Fifth Child / final messenger (Ep. 24)",
      notes: "Kaworu is SEELE's final messenger --- dispatched to NERV as the Fifth Child.",
    },
    // The Mass Production EVA series belongs to SEELE, not NERV. The MP
    // line is unloaded into the EoE assault on NERV HQ from SEELE-aligned
    // transport. EoE-gated alongside the Mass Production node itself.
    {
      from: "eva_mass_production",
      to: "org_seele",
      shortcodes: ["massProduction", "seele"],
      revealedAt: { kind: "eoe" },
      revealedAtSource:
        "https://wiki.evageeks.org/MP_Eva --- the Mass Production series is SEELE's, deployed against NERV in End of Evangelion",
      notes: "The Mass Production EVA series is SEELE's, deployed against NERV in End of Evangelion.",
    },
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
    // Pribnow Box sits deep inside NERV HQ (one of the Sigma Unit
    // sub-bays).
    {
      from: "loc_pribnow_box",
      to: "loc_nerv_hq",
      shortcodes: ["pribnowBox", "nervHq"],
      revealedAt: { kind: "ep", episode: 13 },
      revealedAtSource: "Inherits Pribnow Box's Ep. 13 gate",
      notes: "The Pribnow Box test facility is a sub-bay inside NERV HQ.",
    },
    // Sandalphon (the embryonic Eighth Angel) gestated inside Mt. Asama
    // until Unit-02 retrieved it.
    {
      from: "angel_08_sandalphon",
      to: "loc_mt_asama",
      shortcodes: ["sandalphon", "mtAsama"],
      revealedAt: { kind: "ep", episode: 10 },
      revealedAtSource: "Inherits Sandalphon's Ep. 10 + Mt. Asama Ep. 10 gates",
      notes: "Sandalphon gestated inside the Mt. Asama caldera.",
    },
    // Unit-04 (the Nevada-branch silver prototype) was located at NERV-2
    // until the S² experiment took both with it.
    {
      from: "eva_unit04",
      to: "loc_nerv2",
      shortcodes: ["unit04", "nerv2"],
      revealedAt: { kind: "ep", episode: 18 },
      revealedAtSource: "Inherits Unit-04 + NERV-2 Ep. 18 gates",
      notes: "Unit-04 was the Nevada (NERV-2) branch's prototype, lost with the base.",
    },
    // EVAs are housed in NERV HQ's cages. Open-from-Ep-1 for Unit-00 / -01;
    // Unit-02 inherits the Ep. 8 first-appearance gate.
    {
      from: "eva_unit00",
      to: "loc_nerv_hq",
      shortcodes: ["unit00", "nervHq"],
      notes: "Unit-00 is housed in the NERV HQ cages.",
    },
    {
      from: "eva_unit01",
      to: "loc_nerv_hq",
      shortcodes: ["unit01", "nervHq"],
      notes: "Unit-01 is housed in the NERV HQ cages --- the temperamental violet body in Cage 5.",
    },
    {
      from: "eva_unit02",
      to: "loc_nerv_hq",
      shortcodes: ["unit02", "nervHq"],
      revealedAt: { kind: "ep", episode: 8 },
      revealedAtSource: "Inherits Unit-02's Ep. 8 first-appearance gate",
      notes: "Unit-02 is housed at NERV HQ after arriving on the Pacific fleet (Ep. 8).",
    },
    // Unit-03's only on-screen activation site is Matsushiro (Ep. 18). It
    // is destroyed there before it ever reaches Tokyo-3.
    {
      from: "eva_unit03",
      to: "loc_matsushiro",
      shortcodes: ["unit03", "matsushiro"],
      revealedAt: { kind: "ep", episode: 18 },
      revealedAtSource: "Inherits Unit-03's Ep. 17 + Matsushiro's Ep. 18 gates",
      notes: "Unit-03 was activated inside the Matsushiro test cage (Ep. 18).",
    },
    // Adam's embryonic origin: recovered from the White Moon in Antarctica
    // by the Katsuragi Expedition. Per EvaWiki: 'Seele retrieved both Adam's
    // soul and what remained of its body from the Dead Sea that was once
    // Antarctica.' Both endpoints gate to Ep. 21 (Director's Cut backstory
    // drop).
    {
      from: "angel_01_adam",
      to: "loc_antarctica",
      shortcodes: ["adam", "antarctica"],
      revealedAt: { kind: "ep", episode: 21 },
      revealedAtSource:
        "https://wiki.evageeks.org/Adam --- Adam recovered from Antarctica by SEELE post-Second-Impact",
      notes: "Adam was recovered from the Dead Sea that Antarctica became after Second Impact.",
    },
    // Iruel's infiltration site is the Pribnow Box --- the nano-machine
    // angel breaches NERV through a contaminated 87th protein wall in the
    // test facility (Ep. 13).
    {
      from: "angel_11_iruel",
      to: "loc_pribnow_box",
      shortcodes: ["iruel", "pribnowBox"],
      revealedAt: { kind: "ep", episode: 13 },
      revealedAtSource:
        "https://wiki.evageeks.org/Iruel --- 'enters NERV HQ via a contaminated 87th protein wall installed in the Pribnow Box' (Ep. 13)",
      notes: "Iruel breaches NERV through the Pribnow Box test facility (Ep. 13).",
    },
    // NERV occupies its own HQ and the surrounding fortress city. Without
    // these edges the org node has no spatial anchor on the graph, even
    // though every angel battle is fought 'at NERV / in Tokyo-3.'
    {
      from: "org_nerv",
      to: "loc_nerv_hq",
      shortcodes: ["nerv", "nervHq"],
      notes: "NERV's headquarters --- the building the org operates out of.",
    },
    {
      from: "org_nerv",
      to: "loc_tokyo3",
      shortcodes: ["nerv", "tokyo3"],
      notes: "NERV operates the Tokyo-3 fortress city around its HQ.",
    },
    // GEHIRN occupied the same physical site before the rebrand to NERV.
    // Same building, different placard. Inherits GEHIRN's Ep. 21 gate.
    {
      from: "org_gehirn",
      to: "loc_nerv_hq",
      shortcodes: ["gehirn", "nervHq"],
      revealedAt: { kind: "ep", episode: 21 },
      revealedAtSource: "Inherits GEHIRN's Ep. 21 gate; same physical site as NERV HQ",
      notes: "GEHIRN occupied the same building before the rebrand to NERV.",
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
    // Operation Yashima is NERV's response to Ramiel's appearance.
    {
      from: "angel_05_ramiel",
      to: "event_operation_yashima",
      shortcodes: ["ramiel", "operationYashima"],
      revealedAt: { kind: "ep", episode: 6 },
      revealedAtSource: "Inherits Ramiel + Operation Yashima Ep. 5/6 gates",
      notes: "Ramiel's positron-beam siege forced Operation Yashima.",
    },
    // Unit-01's three canonical TV-series berserk awakenings, each provoked
    // by a specific angel encounter. Per EvaWiki/Berserk: Sachiel (first
    // sortie, 'bestial battle rage'), Leliel (umbilical out, internal
    // batteries drained), Zeruel ('mauls and devours'). The S² engine and
    // the Yui-in-Unit-01 reveal both connect into this concept; these three
    // arrows wire the trigger angels straight into berserk mode.
    {
      from: "angel_03_sachiel",
      to: "concept_berserk",
      shortcodes: ["sachiel", "berserk"],
      revealedAt: { kind: "ep", episode: 2 },
      revealedAtSource:
        "https://wiki.evageeks.org/Berserk --- Unit-01 'goes out of control during its first sortie, against Sachiel' (Ep. 2)",
      notes: "Sachiel's assault triggers Unit-01's first berserk awakening (Ep. 2).",
    },
    {
      from: "angel_12_leliel",
      to: "concept_berserk",
      shortcodes: ["leliel", "berserk"],
      revealedAt: { kind: "ep", episode: 16 },
      revealedAtSource:
        "https://wiki.evageeks.org/Berserk --- Unit-01 'brings about Leliel's gruesome destruction' from inside the Dirac sea (Ep. 16)",
      notes: "Unit-01 berserks out of Leliel's shadow with Shinji blacked out (Ep. 16).",
    },
    {
      from: "angel_14_zeruel",
      to: "concept_berserk",
      shortcodes: ["zeruel", "berserk"],
      revealedAt: { kind: "ep", episode: 19 },
      revealedAtSource:
        "https://wiki.evageeks.org/Berserk --- Unit-01 'mauls and devours Zeruel' under battery-drained conditions (Ep. 19)",
      notes: "Unit-01 berserks again, devours Zeruel's S² engine, dissolves Shinji into LCL (Ep. 19).",
    },
    // Lilith --- merged with Rei's body --- is the proximate engine of
    // Third Impact. Per EvaWiki/Rei: 'Lilith ingests Rei's body, and her
    // soul, Adam's embryo, and Lilith's body merge, and transform into a
    // new Lilith [...] which initiates Third Impact.' Existing edges already
    // wire SEELE -> Instrumentality -> Third Impact; this edge wires the
    // Second Angel directly to the cataclysm she powers.
    {
      from: "angel_02_lilith",
      to: "concept_third_impact",
      shortcodes: ["lilith", "thirdImpact"],
      revealedAt: { kind: "eoe" },
      revealedAtSource:
        "https://wiki.evageeks.org/Rei_Ayanami --- 'Lilith's body merge[s] [...] and transform[s] into a new Lilith [...] initiates Third Impact'",
      notes: "Lilith is the engine of Third Impact --- Rei's body fuses into a giant white Lilith-Rei to start it.",
    },
    // The collapse of every A.T. Field at once IS Third Impact --- the
    // Anti-A.T.-Field the Rei/Adam/Lilith being generates reverts all of
    // humanity to LCL. Wires the previously-orphaned A.T. Field concept to
    // the cataclysm it underwrites. (Full EvaGeeks re-scan, 2026-05-24.)
    {
      from: "concept_at_field",
      to: "concept_third_impact",
      shortcodes: ["atField", "thirdImpact"],
      revealedAt: { kind: "eoe" },
      revealedAtSource:
        "https://wiki.evageeks.org/A.T._Field --- the Rei/Adam/Lilith being generates 'a massive Anti A.T. Field which neutralizes all A.T. Fields across the world, causing all of humanity to revert into [...] LCL'",
      notes:
        "Third Impact IS the collapse of every A.T. Field at once --- the Anti-A.T.-Field reverts all of humanity to LCL.",
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
    { from: "org_jssdf", to: "loc_nerv_hq", shortcodes: ["jssdf", "nervHq"], notes: "JSSDF assault on NERV HQ kicks off End of Evangelion.", revealedAt: { kind: "eoe" }, revealedAtSource: "End of Evangelion --- JSSDF assault" },
    { from: "org_marduk", to: "org_nerv", shortcodes: ["marduk", "nerv"], notes: "Marduk Institute --- NERV's Children-selection front. The 108 dummy companies reveal lands in Ep. 15 via Kaji's investigation.", revealedAt: { kind: "ep", episode: 15 }, revealedAtSource: "https://wiki.evageeks.org/Marduk_Institute --- 'Ryoji Kaji's investigations in Episode 15' reveal it's a dummy organization composed of 108 front companies" },
    { from: "concept_dummy_plug", to: "char_rei", shortcodes: ["dummyPlug", "rei"], notes: "The Dummy Plug runs on Rei-derived psyche copies.", revealedAt: { kind: "ep", episode: 20 }, revealedAtSource: "https://wiki.evageeks.org/Dummy_Plug --- the Rei-derived personality data is revealed mid-show; Ep. 20 marks the reveal of Yui-in-Unit-01 / Rei lineage" },
    { from: "concept_dummy_plug", to: "eva_unit01", shortcodes: ["dummyPlug", "unit01"], notes: "Unit-01 under Dummy Plug control destroys the possessed Unit-03.", revealedAt: { kind: "ep", episode: 18 }, revealedAtSource: "Inherits Dummy Plug's Ep. 18 first-use gate" },
    { from: "concept_s2_engine", to: "eva_unit01", shortcodes: ["s2Engine", "unit01"], notes: "Unit-01 absorbs Zeruel's S² and goes off-grid.", revealedAt: { kind: "ep", episode: 19 }, revealedAtSource: "https://wiki.evageeks.org/Zeruel --- Unit-01 berserks and absorbs Zeruel's S² in Ep. 19" },
    { from: "concept_entry_plug", to: "concept_lcl", shortcodes: ["entryPlug", "lcl"], notes: "The entry plug floods with LCL on activation." },
    { from: "concept_progressive_knife", to: "eva_unit01", shortcodes: ["progressiveKnife", "unit01"], notes: "Unit-01's prog knife stowed in the shoulder pylon." },

    // Keel + the SEELE chrome --- the chairman holds the Scrolls and runs
    // the SOUND ONLY meeting that frames every late-show beat.
    { from: "char_keel", to: "concept_dead_sea_scrolls", shortcodes: ["keel", "deadSeaScrolls"], notes: "Keel keeps the only complete copy of the Dead Sea Scrolls.", revealedAt: { kind: "ep", episode: 14 }, revealedAtSource: "Inherits Keel + Dead Sea Scrolls Ep. 14 gates" },
    { from: "org_seele", to: "concept_dead_sea_scrolls", shortcodes: ["seele", "deadSeaScrolls"], notes: "SEELE's scenario is whatever the Dead Sea Scrolls predict.", revealedAt: { kind: "ep", episode: 14 }, revealedAtSource: "Inherits SEELE + Dead Sea Scrolls Ep. 14 gates" },
    { from: "org_seele", to: "concept_sound_only", shortcodes: ["seele", "soundOnly"], notes: "SEELE conducts every meeting through the SOUND ONLY monoliths.", revealedAt: { kind: "ep", episode: 14 }, revealedAtSource: "Inherits SEELE + SOUND ONLY Ep. 14 gates" },
    // Berserk Mode is Yui-in-Unit-01 finally moving.
    { from: "eva_unit01", to: "concept_berserk", shortcodes: ["unit01", "berserk"], notes: "Unit-01 goes berserk in Eps. 2, 16, and 19.", revealedAt: { kind: "ep", episode: 2 }, revealedAtSource: "Inherits Berserk Ep. 2 first-occurrence gate" },
    // Yebisu --- the Misato apartment running gag, and a structural beat
    // for every cohabitation scene with Shinji.
    { from: "char_misato", to: "concept_yebisu", shortcodes: ["misato", "yebisu"], notes: "Misato opens a Yebisu over her head every other scene in the apartment.", revealedAt: { kind: "ep", episode: 2 }, revealedAtSource: "Inherits Yebisu Ep. 2 first-appearance gate" },
    // Watermelons --- Kaji's hobby. The triple-agent's only honest job.
    { from: "char_kaji", to: "concept_watermelons", shortcodes: ["kaji", "watermelons"], notes: "Kaji tends his watermelon plot in NERV's greenhouse on his off days.", revealedAt: { kind: "ep", episode: 17 }, revealedAtSource: "Inherits Watermelons Ep. 17 first-appearance gate" },
    // Operation Yashima participants --- both EVAs were on the firing line.
    { from: "event_operation_yashima", to: "eva_unit01", shortcodes: ["operationYashima", "unit01"], notes: "Unit-01 took the positron-rifle shot in Operation Yashima.", revealedAt: { kind: "ep", episode: 6 }, revealedAtSource: "Inherits Operation Yashima Ep. 6 gate" },
    { from: "event_operation_yashima", to: "eva_unit00", shortcodes: ["operationYashima", "unit00"], notes: "Unit-00 held the heat shield in Operation Yashima.", revealedAt: { kind: "ep", episode: 6 }, revealedAtSource: "Inherits Operation Yashima Ep. 6 gate" },

    // Misato as guardian / cohabitant. Shinji moves into the Katsuragi
    // apartment in Ep. 2 ('The Beast'); Asuka moves in alongside him in
    // Ep. 9 ('Both of you, dance like you want to win!'). These are the
    // structural anchors of every apartment-side scene in the show and
    // belong on the graph.
    { from: "char_misato", to: "char_shinji", shortcodes: ["misato", "shinji"], notes: "Misato is Shinji's guardian --- he moves into her apartment in Ep. 2.", revealedAt: { kind: "ep", episode: 2 }, revealedAtSource: "https://wiki.evageeks.org/Misato_Katsuragi --- Shinji moves into the Katsuragi apartment in Ep. 2 ('The Beast')" },
    { from: "char_misato", to: "char_asuka", shortcodes: ["misato", "asuka"], notes: "Asuka moves into Misato's apartment in Ep. 9 ('Both of you, dance!').", revealedAt: { kind: "ep", episode: 9 }, revealedAtSource: "https://wiki.evageeks.org/Episode_09 --- Asuka moves into the Katsuragi apartment for the synchronized-dance training arc" },

    // Maya's devotion to Ritsuko --- a structural beat across the show,
    // most overt in the Ep. 23 'Maya kisses Ritsuko's body in the LCL pool'
    // beat. Maya's character notes already mark this; the edge surfaces it.
    { from: "char_maya", to: "char_ritsuko", shortcodes: ["maya", "ritsuko"], notes: "Maya adores Ritsuko --- her structural anchor on the bridge." },

    // Hyuga's quiet crush on Misato --- the recurring bridge-crew running
    // beat. Open from Ep. 1 alongside the bridge introductions.
    { from: "char_hyuga", to: "char_misato", shortcodes: ["hyuga", "misato"], notes: "Hyuga carries a quiet crush on Misato across every bridge scene." },

    // Gendo and Rei. The pseudo-paternal dynamic --- Gendo visits Rei in
    // her apartment, fixes her broken glasses (which she keeps), the only
    // person he treats with anything resembling tenderness. On screen from
    // the Ep. 5/6 Operation Yashima arc onward.
    { from: "char_gendo", to: "char_rei", shortcodes: ["gendo", "rei"], notes: "Gendo's pseudo-paternal bond with Rei --- the one person he treats with tenderness.", revealedAt: { kind: "ep", episode: 5 }, revealedAtSource: "https://wiki.evageeks.org/Rei_Ayanami --- the Gendo-Rei dynamic surfaces during the Ep. 5/6 Ramiel arc" },

    // Gendo's love-affair web. Yui (marriage) -> Naoko (post-Yui affair) ->
    // Ritsuko (post-Naoko affair). Each gated to its on-screen reveal.
    // Yui: the marriage is implicit early but the Yui node itself is gated
    // to the Ep. 20 Director's Cut backstory drop.
    // Naoko: the affair lands with the Ep. 21 Director's Cut backstory.
    // Ritsuko: the 'I've been discarded' line + the destruction of the
    //   Rei tank room is Ep. 23 ('Rei III').
    { from: "char_yui", to: "char_gendo", shortcodes: ["yui", "gendo"], notes: "Yui Ikari --- Gendo's wife, lost to Unit-01 during the contact experiment.", revealedAt: { kind: "ep", episode: 20 }, revealedAtSource: "https://wiki.evageeks.org/Yui_Ikari --- Director's Cut Ep. 20 establishes the Yui/Gendo marriage alongside the contact-experiment backstory" },
    { from: "char_naoko", to: "char_gendo", shortcodes: ["naoko", "gendo"], notes: "Naoko Akagi's affair with Gendo --- the spark that ends in her strangling Rei and jumping from the Magi catwalk.", revealedAt: { kind: "ep", episode: 21 }, revealedAtSource: "https://wiki.evageeks.org/Episode_21 --- Director's Cut backstory: 'He also starts an affair with Naoko'" },
    { from: "char_ritsuko", to: "char_gendo", shortcodes: ["ritsuko", "gendo"], notes: "Ritsuko Akagi's affair with Gendo --- the daughter retracing her mother's steps. Ends in 'I've been discarded' (Ep. 23).", revealedAt: { kind: "ep", episode: 23 }, revealedAtSource: "https://wiki.evageeks.org/Ritsuko_Akagi --- the Ritsuko/Gendo affair surfaces alongside the Ep. 23 'Rei III' tank-room destruction" },

    // Adam in Gendo's right hand. Per EvaWiki: 'In 2015, the embryonic
    // Adam is clandestinely obtained by Ryoji Kaji [...] and delivered to
    // Gendo Ikari at Nerv Headquarters [...] Gendo has Adam fused into his
    // right palm.' Two edges: Kaji as the courier (Ep. 21 Director's Cut
    // backstory drop), Gendo as the host (Ep. 24, when Kaworu touches
    // Gendo's palm and confirms Adam's presence on screen).
    { from: "char_kaji", to: "angel_01_adam", shortcodes: ["kaji", "adam"], notes: "Kaji smuggled the embryonic Adam from Antarctica to Gendo at NERV HQ.", revealedAt: { kind: "ep", episode: 21 }, revealedAtSource: "https://wiki.evageeks.org/Adam --- 'In 2015, the embryonic Adam is clandestinely obtained by Ryoji Kaji [...] and delivered to Gendo Ikari at Nerv Headquarters'" },
    { from: "char_gendo", to: "angel_01_adam", shortcodes: ["gendo", "adam"], notes: "Adam is fused into Gendo's right palm --- Kaworu touches it and recognizes Adam's presence (Ep. 24).", revealedAt: { kind: "ep", episode: 24 }, revealedAtSource: "https://wiki.evageeks.org/Adam --- Gendo has Adam fused into his right palm; Kaworu confirms its presence on screen via touch in Ep. 24" },

    // Adam's vessel was the White Moon. Per the Adam/White Moon backstory,
    // 'Adam emerged from the White Moon' before SEELE recovered the
    // embryo. Both endpoints gate to Ep. 21 (the Katsuragi Expedition
    // Director's Cut flashback).
    { from: "angel_01_adam", to: "concept_white_moon", shortcodes: ["adam", "whiteMoon"], notes: "Adam was the passenger of the White Moon --- the vessel cracked open by the Katsuragi Expedition.", revealedAt: { kind: "ep", episode: 21 }, revealedAtSource: "Inherits Adam + White Moon Ep. 21 gates" },

    // Misato's Antarctica backstory. She was the sole survivor of her
    // father's Katsuragi Expedition --- her father sealed her in an escape
    // pod moments before Second Impact. The dialogue surfaces in Ep. 12
    // (Sahaquiel) and the visual flashbacks land in Ep. 21 Director's Cut.
    // Note: Antarctica's node gate is Ep. 21, so the edge to Antarctica
    // must respect that monotonicity (use Ep. 21). The edge to Second
    // Impact (open node) can land at Ep. 12 where Misato's backstory first
    // surfaces in dialogue.
    { from: "char_misato", to: "event_second_impact", shortcodes: ["misato", "secondImpact"], notes: "Misato survived Second Impact at Antarctica --- the sole survivor of the Katsuragi Expedition.", revealedAt: { kind: "ep", episode: 12 }, revealedAtSource: "https://wiki.evageeks.org/Misato_Katsuragi --- 'sole survivor of his expedition, otherwise wiped out as a result of Second Impact'" },
    { from: "char_misato", to: "loc_antarctica", shortcodes: ["misato", "antarctica"], notes: "Misato was at Antarctica during Second Impact --- her father sealed her in an escape pod.", revealedAt: { kind: "ep", episode: 21 }, revealedAtSource: "Inherits Antarctica's Ep. 21 gate; Misato's flashback lands here" },

    // Ritsuko defeated Iruel by reprogramming Casper's logic from inside
    // the Magi system. Existing data marks this in Iruel's notes ('Defeated
    // by Ritsuko') but no edge captures it. The kill is the only one in
    // the show without an EVA killer.
    { from: "char_ritsuko", to: "angel_11_iruel", shortcodes: ["ritsuko", "iruel"], notes: "Ritsuko defeated Iruel by self-reprogramming the Magi from inside (Ep. 13) --- the only canonical kill without an EVA on the kill chain.", revealedAt: { kind: "ep", episode: 13 }, revealedAtSource: "https://wiki.evageeks.org/Iruel --- 'Ritsuko Akagi defeats Iruel by self-modifying Casper-3 to attack Iruel from within' (Ep. 13)" },

    // Lance of Longinus rests against Lilith on the cross at the bottom of
    // Terminal Dogma. Existing edge already wires Lance -> Terminal Dogma;
    // this edge wires Lance directly to Lilith.
    { from: "concept_lance_of_longinus", to: "angel_02_lilith", shortcodes: ["lanceOfLonginus", "lilith"], notes: "The Lance pins Lilith to the cross at the bottom of Terminal Dogma.", revealedAt: { kind: "ep", episode: 23 }, revealedAtSource: "https://wiki.evageeks.org/Lance_of_Longinus --- the Lance is shown alongside Lilith in Terminal Dogma in Ep. 23" },

    // Kaworu descends to Terminal Dogma to merge with what he believes is
    // Adam --- realizes mid-descent it's actually Lilith --- and asks
    // Shinji to end him rather than complete the misaimed convergence.
    // The descent itself is the Ep. 24 plot beat.
    { from: "char_kaworu", to: "angel_02_lilith", shortcodes: ["kaworu", "lilith"], notes: "Kaworu descends toward Lilith in Terminal Dogma --- realizes mid-descent it is Lilith, not Adam, and asks to be killed (Ep. 24).", revealedAt: { kind: "ep", episode: 24 }, revealedAtSource: "https://wiki.evageeks.org/Kaworu_Nagisa --- Kaworu's Ep. 24 descent to Terminal Dogma to merge with Lilith" },

    // LCL = Tang. The orange amniotic fluid is what every soul dissolves
    // into during Instrumentality / Third Impact. Ties the entry-plug
    // medium to the cataclysm it scales up to.
    { from: "concept_lcl", to: "concept_third_impact", shortcodes: ["lcl", "thirdImpact"], notes: "LCL is the medium of Third Impact --- humanity dissolves into Tang during Instrumentality.", revealedAt: { kind: "eoe" }, revealedAtSource: "Inherits Third Impact's EoE gate; LCL = Tang is the Instrumentality medium" },

    // Hedgehog's Dilemma names the Trauma loop. Ritsuko explains the
    // metaphor to Misato in Ep. 4: 'two hedgehogs huddling for warmth wound
    // each other with their spines.' This is the single most-named concept
    // pair in the show after AT Field / LCL.
    { from: "concept_hedgehogs_dilemma", to: "concept_trauma", shortcodes: ["hedgehogsDilemma", "trauma"], notes: "Hedgehog's Dilemma is the trauma loop the cast keeps re-entering --- closer hurts more, distance hurts more.", revealedAt: { kind: "ep", episode: 4 }, revealedAtSource: "https://wiki.evageeks.org/Hedgehog_Dilemma --- named on screen by Ritsuko in Ep. 4" },

    // NERV's branch architecture. Matsushiro is the Second (Japanese) Branch;
    // NERV-2 is the Nevada (US) Branch. Each is a building NERV operates
    // out of, but the org node has no other tie to either site without
    // these edges.
    { from: "loc_matsushiro", to: "org_nerv", shortcodes: ["matsushiro", "nerv"], notes: "Matsushiro is NERV's Second Branch in Nagano Prefecture.", revealedAt: { kind: "ep", episode: 18 }, revealedAtSource: "Inherits Matsushiro's Ep. 18 gate" },
    { from: "loc_nerv2", to: "org_nerv", shortcodes: ["nerv2", "nerv"], notes: "NERV-2 is NERV's Second Branch in the Nevada desert --- lost with Unit-04.", revealedAt: { kind: "ep", episode: 18 }, revealedAtSource: "Inherits NERV-2's Ep. 18 gate" },

    // Psych traits as concept hubs. Each canonical psych concept (rejection,
    // abandonment, trauma, hedgehog's dilemma, depression) wires to the
    // characters who carry that wound on screen. Gates pin to the episode
    // where the wound becomes legible to the viewer --- Asuka's mother
    // backstory lands at Ep. 22 (Arael's mind-attack pulls it open), so
    // her psych-edges gate there; Ritsuko's 'I've been discarded' line
    // and the strangling-Rei flashback both land at Ep. 23 / Ep. 21
    // respectively, etc.

    // Rejection --- characters who have been pushed away. Shinji is open
    // because Gendo's rejection is on screen from Ep. 1.
    { from: "concept_rejection", to: "char_shinji", shortcodes: ["rejection", "shinji"], notes: "Gendo abandoned Shinji at Yui's death and has rejected him every interaction since. The defining wound." },
    { from: "concept_rejection", to: "char_asuka", shortcodes: ["rejection", "asuka"], notes: "Kyoko mistook a doll for Asuka before her suicide. Asuka's overcompensating bravado is rejection-armor.", revealedAt: { kind: "ep", episode: 22 }, revealedAtSource: "https://wiki.evageeks.org/Arael --- Arael's Ep. 22 mind-attack pries open Asuka's mother-rejection backstory" },
    { from: "concept_rejection", to: "char_ritsuko", shortcodes: ["rejection", "ritsuko"], notes: "Ritsuko realizes Gendo has used and discarded her --- 'I've been discarded' (Ep. 23, 'Rei III').", revealedAt: { kind: "ep", episode: 23 }, revealedAtSource: "https://wiki.evageeks.org/Ritsuko_Akagi --- the 'I've been discarded' confrontation lands in Ep. 23" },
    { from: "concept_rejection", to: "char_rei", shortcodes: ["rejection", "rei"], notes: "Rei III walks past Rei II's clothes in the locker --- the replacement is the rejection.", revealedAt: { kind: "ep", episode: 23 }, revealedAtSource: "https://wiki.evageeks.org/Rei_Ayanami --- Ep. 23 'Rei III' establishes the replacement chain" },

    // Abandonment --- parents who left or were taken. The through-line
    // the show keeps naming.
    { from: "concept_abandonment", to: "char_shinji", shortcodes: ["abandonment", "shinji"], notes: "Gendo placed Shinji with a teacher after Yui's death and did not see him again until summoning him to pilot Unit-01.", revealedAt: { kind: "ep", episode: 1 }, revealedAtSource: "https://wiki.evageeks.org/Episode_01 --- the 'sent away after Mom died' backstory is dropped in the opening episode" },
    { from: "concept_abandonment", to: "char_asuka", shortcodes: ["abandonment", "asuka"], notes: "Kyoko Zeppelin Soryu's psychotic break and suicide left Asuka raised by stepmother and EVA program.", revealedAt: { kind: "ep", episode: 22 }, revealedAtSource: "https://wiki.evageeks.org/Arael --- the Kyoko-suicide backstory surfaces during Arael's Ep. 22 mind-attack" },
    { from: "concept_abandonment", to: "char_misato", shortcodes: ["abandonment", "misato"], notes: "Misato's father sealed her in an escape pod and died at Antarctica. The grief drives her drinking and the Kaji push-pull.", revealedAt: { kind: "ep", episode: 12 }, revealedAtSource: "https://wiki.evageeks.org/Misato_Katsuragi --- her father's loss surfaces in the Ep. 12 Sahaquiel breakdown" },
    { from: "concept_abandonment", to: "char_rei", shortcodes: ["abandonment", "rei"], notes: "Rei lives alone in a barren apartment off-base. No parents, no family, no home --- abandonment as default state.", revealedAt: { kind: "ep", episode: 5 }, revealedAtSource: "https://wiki.evageeks.org/Rei_Ayanami --- Rei's solitary apartment is established in Ep. 5" },
    { from: "concept_abandonment", to: "char_ritsuko", shortcodes: ["abandonment", "ritsuko"], notes: "Naoko's suicide off the Magi catwalk left Ritsuko an orphan and chasing her mother's role at NERV.", revealedAt: { kind: "ep", episode: 21 }, revealedAtSource: "https://wiki.evageeks.org/Episode_21 --- the Naoko-suicide flashback lands in the Director's Cut backstory drop" },
    { from: "concept_abandonment", to: "char_gendo", shortcodes: ["abandonment", "gendo"], notes: "Yui's loss to Unit-01 is the wound Gendo organizes the entire Instrumentality scenario around. He runs the war to reach her.", revealedAt: { kind: "ep", episode: 20 }, revealedAtSource: "https://wiki.evageeks.org/Yui_Ikari --- the contact-experiment loss surfaces in the Ep. 20 Director's Cut backstory" },

    // Trauma --- the unhealed wounds the cast carries into every
    // interaction. concept_trauma's notes already name these five; the
    // edges make the implicit explicit.
    { from: "concept_trauma", to: "char_shinji", shortcodes: ["trauma", "shinji"], notes: "Watched Unit-01 swallow his mother at age four. Carries it into every entry plug." },
    { from: "concept_trauma", to: "char_asuka", shortcodes: ["trauma", "asuka"], notes: "The doll. The hospital. The mother who didn't recognize her. Asuka's whole sync ratio collapses around it in Ep. 22.", revealedAt: { kind: "ep", episode: 22 }, revealedAtSource: "https://wiki.evageeks.org/Arael --- the Kyoko trauma surfaces under Arael's mind-attack (Ep. 22)" },
    { from: "concept_trauma", to: "char_rei", shortcodes: ["trauma", "rei"], notes: "Strangled by Naoko in 2010, replaced after each death --- the trauma is being replaceable.", revealedAt: { kind: "ep", episode: 21 }, revealedAtSource: "https://wiki.evageeks.org/Episode_21 --- Naoko strangling Rei is the Director's Cut backstory drop" },
    { from: "concept_trauma", to: "char_misato", shortcodes: ["trauma", "misato"], notes: "Sole survivor of the Katsuragi Expedition. Mute for years after Second Impact. The Yebisu and the Kaji are the painkiller.", revealedAt: { kind: "ep", episode: 12 }, revealedAtSource: "https://wiki.evageeks.org/Misato_Katsuragi --- the Antarctica survival trauma surfaces in Ep. 12" },
    { from: "concept_trauma", to: "char_ritsuko", shortcodes: ["trauma", "ritsuko"], notes: "Mother's suicide, mother's affair, the role she stepped into. Ritsuko inherits Naoko's place in Gendo's bed and at the Magi terminal.", revealedAt: { kind: "ep", episode: 21 }, revealedAtSource: "https://wiki.evageeks.org/Ritsuko_Akagi --- the Naoko backstory surfaces in Ep. 21" },
    { from: "concept_trauma", to: "char_gendo", shortcodes: ["trauma", "gendo"], notes: "The contact experiment took Yui whole while he watched. Every gloved-hand silence after is the same room.", revealedAt: { kind: "ep", episode: 20 }, revealedAtSource: "https://wiki.evageeks.org/Yui_Ikari --- Gendo's witnessing of the contact experiment surfaces in Ep. 20" },

    // Hedgehog's Dilemma --- closer hurts, distance hurts. Named on screen
    // by Ritsuko in Ep. 4 about Shinji and Misato. Asuka enters the
    // dilemma the moment she moves into the apartment.
    { from: "concept_hedgehogs_dilemma", to: "char_shinji", shortcodes: ["hedgehogsDilemma", "shinji"], notes: "The named subject of Ritsuko's Ep. 4 dialogue. Every approach toward intimacy ends in retreat.", revealedAt: { kind: "ep", episode: 4 }, revealedAtSource: "https://wiki.evageeks.org/Hedgehog_Dilemma --- named on screen in Ep. 4 about Shinji" },
    { from: "concept_hedgehogs_dilemma", to: "char_asuka", shortcodes: ["hedgehogsDilemma", "asuka"], notes: "Pushes everyone away with rage; demands closeness with the same breath.", revealedAt: { kind: "ep", episode: 9 }, revealedAtSource: "https://wiki.evageeks.org/Episode_09 --- Asuka's push-pull lands in the Ep. 9 dance-training arc" },
    { from: "concept_hedgehogs_dilemma", to: "char_misato", shortcodes: ["hedgehogsDilemma", "misato"], notes: "Ritsuko frames the dilemma about Misato in the Ep. 4 dialogue --- the Kaji push-pull is the adult version.", revealedAt: { kind: "ep", episode: 4 }, revealedAtSource: "https://wiki.evageeks.org/Hedgehog_Dilemma --- the Ep. 4 framing applies to Misato as well as Shinji" },

    // Depression --- per the user directive, scoped to Shinji as the
    // canonical carrier. Open from Ep. 1 since the affliction is on
    // screen from his first scenes (the running-away reflex, the train-
    // -seat stillness, the 'I shouldn't be here' refrain).
    { from: "concept_depression", to: "char_shinji", shortcodes: ["depression", "shinji"], notes: "The defining carrier. 'I mustn't run away' as a depressive command, Ep. 16 acceptance of being eaten, Ep. 24 bathwater stillness, Ep. 25-26 surrender." },

    // Asuka and her mother. The defining wound surfaces under Arael's
    // mind-attack in Ep. 22; the Kyoko-soul-in-Unit-02 reveal lands in
    // Ep. 25'. The mother edge itself gates with the Kyoko node (Ep. 22).
    { from: "char_asuka", to: "char_kyoko", shortcodes: ["asuka", "kyoko"], notes: "Asuka's mother --- the doll, the hospital, the 'die with me.' Every Asuka collapse is this wound resurfacing.", revealedAt: { kind: "ep", episode: 22 }, revealedAtSource: "Inherits Kyoko's Ep. 22 first-surfacing gate" },

    // Mass Production EVA armament + dummy systems. Per EvaWiki/MP_Eva:
    // 'They carry no armament except for replicas of the Spear of Longinus,
    // colored blue-gray and initially disguised as giant, gray swords.'
    // And: 'dummy systems generated from Kaworu Nagisa's thought patterns.'
    // Both edges gated to EoE alongside the MP-Eva node.
    { from: "concept_lance_of_longinus", to: "eva_mass_production", shortcodes: ["lanceOfLonginus", "massProduction"], notes: "Mass Production wields Lance of Longinus replicas --- the gray swords that crucify Unit-02 in End of Evangelion.", revealedAt: { kind: "eoe" }, revealedAtSource: "https://wiki.evageeks.org/MP_Eva --- MP units 'carry no armament except for replicas of the Spear of Longinus'" },
    { from: "char_kaworu", to: "eva_mass_production", shortcodes: ["kaworu", "massProduction"], notes: "Mass Production runs on dummy systems generated from Kaworu's thought patterns --- the Fifth Child's pattern, multiplied nine times.", revealedAt: { kind: "eoe" }, revealedAtSource: "https://wiki.evageeks.org/MP_Eva --- 'dummy systems generated from Kaworu Nagisa's thought patterns'" },

    // Naoko strangling Rei. The Director's Cut Ep. 21 backstory drop
    // shows Naoko offering Rei the chance to leave with her, Rei calling
    // her an 'old hag,' and Naoko strangling Rei in a rage before jumping
    // from the Magi catwalk. The original Rei (Rei I) dies here.
    { from: "char_naoko", to: "char_rei", shortcodes: ["naoko", "rei"], notes: "Naoko strangled Rei I in 2010 after Rei called her an 'old hag,' then jumped from the Magi catwalk. The original Rei dies here.", revealedAt: { kind: "ep", episode: 21 }, revealedAtSource: "https://wiki.evageeks.org/Episode_21 --- the Naoko-strangles-Rei flashback lands in the Director's Cut backstory drop" },

    // Ritsuko operates the Magi --- the canonical role she inherited from
    // Naoko. The Ep. 13 Iruel-attack monologue establishes her as the
    // person who knows the Magi from the inside (she reprograms Casper
    // mid-attack to defeat Iruel from within). Three edges --- one per
    // Magi --- because the operator relationship is symmetrical across
    // the triangle, just as Naoko's mother-Magi soul-fragments are.
    { from: "char_ritsuko", to: "magi_casper", shortcodes: ["ritsuko", "casper"], notes: "Ritsuko inherited Naoko's role and operates Casper --- she reprograms it from inside to defeat Iruel (Ep. 13).", revealedAt: { kind: "ep", episode: 13 }, revealedAtSource: "https://wiki.evageeks.org/Episode_13 --- Ritsuko's reprogramming of Casper to attack Iruel from within establishes the operator role" },
    { from: "char_ritsuko", to: "magi_melchior", shortcodes: ["ritsuko", "melchior"], notes: "Ritsuko operates Melchior --- the Scientist console.", revealedAt: { kind: "ep", episode: 13 }, revealedAtSource: "Inherits Magi Ep. 13 gate; Ritsuko's operator role established alongside the personality-split exposition" },
    { from: "char_ritsuko", to: "magi_balthasar", shortcodes: ["ritsuko", "balthasar"], notes: "Ritsuko operates Balthasar --- the Mother console.", revealedAt: { kind: "ep", episode: 13 }, revealedAtSource: "Inherits Magi Ep. 13 gate; Ritsuko's operator role established alongside the personality-split exposition" },

    // Magi authority: the three supercomputers govern NERV operations and
    // Tokyo-3's municipal systems by majority vote. Per EvaWiki/Magi:
    // 'The three Magi run Nerv Headquarters and the municipal government
    // of Tokyo-3 by majority decision.' Six edges --- each Magi votes on
    // both NERV and the city, so the rule is encoded as a per-Magi tie
    // rather than collapsing the triangle to a single arrow.
    { from: "magi_casper", to: "org_nerv", shortcodes: ["casper", "nerv"], notes: "Casper-3 votes on every NERV operation --- one third of the majority that runs the org.", revealedAt: { kind: "ep", episode: 13 }, revealedAtSource: "https://wiki.evageeks.org/Magi --- 'The three Magi run Nerv Headquarters [...] by majority decision'" },
    { from: "magi_melchior", to: "org_nerv", shortcodes: ["melchior", "nerv"], notes: "Melchior-1 votes on every NERV operation --- the Scientist console's vote in the majority.", revealedAt: { kind: "ep", episode: 13 }, revealedAtSource: "https://wiki.evageeks.org/Magi --- 'The three Magi run Nerv Headquarters [...] by majority decision'" },
    { from: "magi_balthasar", to: "org_nerv", shortcodes: ["balthasar", "nerv"], notes: "Balthasar-2 votes on every NERV operation --- the Mother console's vote in the majority.", revealedAt: { kind: "ep", episode: 13 }, revealedAtSource: "https://wiki.evageeks.org/Magi --- 'The three Magi run Nerv Headquarters [...] by majority decision'" },
    { from: "magi_casper", to: "loc_tokyo3", shortcodes: ["casper", "tokyo3"], notes: "Casper-3 also governs Tokyo-3's municipal systems --- the city retracts, the alarms fire, the buildings sink, all on Magi vote.", revealedAt: { kind: "ep", episode: 13 }, revealedAtSource: "https://wiki.evageeks.org/Magi --- 'The three Magi run [...] the municipal government of Tokyo-3 by majority decision'" },
    { from: "magi_melchior", to: "loc_tokyo3", shortcodes: ["melchior", "tokyo3"], notes: "Melchior-1 also governs Tokyo-3's municipal systems by majority vote.", revealedAt: { kind: "ep", episode: 13 }, revealedAtSource: "https://wiki.evageeks.org/Magi --- 'The three Magi run [...] the municipal government of Tokyo-3 by majority decision'" },
    { from: "magi_balthasar", to: "loc_tokyo3", shortcodes: ["balthasar", "tokyo3"], notes: "Balthasar-2 also governs Tokyo-3's municipal systems by majority vote.", revealedAt: { kind: "ep", episode: 13 }, revealedAtSource: "https://wiki.evageeks.org/Magi --- 'The three Magi run [...] the municipal government of Tokyo-3 by majority decision'" },

    // S² Mine: the catastrophic S² engine activation experiment at NERV's
    // Nevada (Second) Branch. Per EvaWiki/S2_Engine: 'the disappearance
    // of the Eva, related facilities, and everything else within an 89
    // kilometer radius, swallowed by a Sea of Dirac.' The unit, the base,
    // and a Mojave-sized crater of land vanished. The S² engine concept
    // already wires to Unit-01 (Zeruel absorption); these two edges wire
    // it to its other on-screen consequences --- the deaths the user is
    // asking us to encode. Both gated to Ep. 18 (the Misato exposition
    // that surfaces the Nevada incident in the Bardiel pre-attack briefing).
    { from: "concept_s2_engine", to: "eva_unit04", shortcodes: ["s2Engine", "unit04"], notes: "Unit-04 was lost when its S² engine activation went into uncontrolled feedback --- the entire EVA vanished into the Dirac Sea that opened.", revealedAt: { kind: "ep", episode: 18 }, revealedAtSource: "https://wiki.evageeks.org/S2_Engine --- 'the disappearance of the Eva [...] swallowed by a Sea of Dirac'" },
    { from: "concept_s2_engine", to: "loc_nerv2", shortcodes: ["s2Engine", "nerv2"], notes: "NERV-2 (Nevada) and an 89km radius around it were swallowed by the S² Mine's Dirac Sea --- everyone at the base died.", revealedAt: { kind: "ep", episode: 18 }, revealedAtSource: "https://wiki.evageeks.org/S2_Engine --- 'related facilities, and everything else within an 89 kilometer radius, swallowed by a Sea of Dirac'" },

    // =====================================================================
    // Canon-expansion pass (2026-05-24): a full EvaGeeks re-scan surfaced 40
    // edges the seed was missing. The A.T. Field shipped as an ORPHAN node
    // (zero edges); this pass wires it in as a cross-cutting hub, adds the
    // angel-attack target sites, the EVA/concept mechanics, and the core
    // character relationships the dataset lacked --- most glaringly the
    // direct Gendo <-> Shinji tie, the spine of the whole show, which until
    // now existed only through the shared Ikari family node. Each gated edge
    // cites the EvaGeeks page it was authored against. (One more edge --- the
    // A.T. Field -> Third Impact causal link --- lives in causedEdges above.)
    // =====================================================================

    // --- A.T. Field hub: per wiki/A.T._Field every Angel AND Evangelion
    // manifests one, and Instrumentality is the deliberate collapse of all of
    // them at once. The field is also the literal wall the Hedgehog's Dilemma
    // describes between people. ---
    { from: "concept_at_field", to: "eva_unit01", shortcodes: ["atField", "unit01"], notes: "Evangelions project an A.T. Field of their own --- the same barrier the Angels manifest, strong enough to erode an Angel's field on contact and punch through. (wiki/A.T._Field)" },
    { from: "concept_at_field", to: "angel_05_ramiel", shortcodes: ["atField", "ramiel"], notes: "Ramiel carries one of the strongest A.T. Fields of any Angel --- 180 million kilowatts were needed to punch through it at Operation Yashima.", revealedAt: { kind: "ep", episode: 5 }, revealedAtSource: "https://wiki.evageeks.org/Ramiel --- 'one of the strongest A.T. Fields of all the Angels'" },
    { from: "concept_at_field", to: "concept_human_instrumentality", shortcodes: ["atField", "humanInstrumentality"], notes: "Instrumentality is the deliberate collapse of every A.T. Field at once --- the Anti-A.T.-Field that dissolves the walls between souls.", revealedAt: { kind: "ep", episode: 14 }, revealedAtSource: "https://wiki.evageeks.org/A.T._Field --- the EoE Anti-A.T.-Field 'neutralizes all A.T. Fields across the world'; Instrumentality is the project that wields it" },
    { from: "concept_at_field", to: "concept_hedgehogs_dilemma", shortcodes: ["atField", "hedgehogsDilemma"], notes: "Every person's A.T. Field is the wall the Hedgehog's Dilemma names --- it 'holds individual beings' egos together, separating individuals.' (wiki/A.T._Field)" },

    // --- Angel attack targets: each Angel that drove for NERV gets wired to
    // the site it struck. Previously Angels touched only the sequence chain,
    // their eliminated edges, and a couple of resting-place located_in ties. ---
    { from: "angel_03_sachiel", to: "loc_tokyo3", shortcodes: ["sachiel", "tokyo3"], notes: "The Third Angel walks out of the bay into Tokyo-3 in the Ep. 1 cold open --- the first Angel attack of the series." },
    { from: "angel_05_ramiel", to: "loc_nerv_hq", shortcodes: ["ramiel", "nervHq"], notes: "Ramiel drills through Tokyo-3's armor plating to reach NERV HQ in the Geofront below.", revealedAt: { kind: "ep", episode: 5 }, revealedAtSource: "https://wiki.evageeks.org/Ramiel --- 'a large drill-appendage to begin drilling through the armor plating of Tokyo-3 to reach Nerv HQ below in the GeoFront'" },
    { from: "angel_09_matarael", to: "loc_geofront", shortcodes: ["matarael", "geofront"], notes: "Matarael hangs above the Geofront and secretes corrosive acid to dissolve its way down to the Evangelions.", revealedAt: { kind: "ep", episode: 11 }, revealedAtSource: "https://wiki.evageeks.org/Matarael --- 'moved into a position above the Geofront and began to secrete corrosive acid from its central eye to breach the armor below'" },
    { from: "angel_10_sahaquiel", to: "loc_geofront", shortcodes: ["sahaquiel", "geofront"], notes: "The orbital Tenth Angel drops itself toward the Geofront, refining its aim to penetrate it and recover Adam.", revealedAt: { kind: "ep", episode: 12 }, revealedAtSource: "https://wiki.evageeks.org/Sahaquiel --- 'its ultimate goal is to finally descend with its entire mass in order penetrate the Geofront and recover Adam'" },
    { from: "angel_14_zeruel", to: "loc_central_dogma", shortcodes: ["zeruel", "centralDogma"], notes: "Zeruel breaches NERV HQ and tears all the way down into Central Dogma, breaking into the command center itself.", revealedAt: { kind: "ep", episode: 19 }, revealedAtSource: "https://wiki.evageeks.org/Zeruel --- 'breached Nerv headquarters and descended to Central Dogma, breaking through the wall into the command center's central display area'" },

    // --- Angels vs. specific Evangelions / pilots: engulfing (Leliel),
    // possession (Bardiel), dismemberment (Zeruel), mind-attack (Arael),
    // biofusion (Armisael). ---
    { from: "angel_12_leliel", to: "eva_unit01", shortcodes: ["leliel", "unit01"], notes: "Leliel swallows Unit-01 whole into its shadow --- the Dirac Sea that becomes Shinji's hour-long introspection.", revealedAt: { kind: "ep", episode: 16 }, revealedAtSource: "https://wiki.evageeks.org/Leliel --- Eva-01 is 'sucked down into Leliel's real shadow-body and communication was lost'" },
    { from: "angel_13_bardiel", to: "eva_unit03", shortcodes: ["bardiel", "unit03"], notes: "Bardiel infects Unit-03 as a fungus-like growth, revealing itself the instant the unit is activated at Matsushiro.", revealedAt: { kind: "ep", episode: 18 }, revealedAtSource: "https://wiki.evageeks.org/Bardiel --- 'the fungus-like Bardiel-infection spread into the Evangelion's systems, revealing itself when Eva-03 was activated at the secondary Nerv testing facility at Matsushiro'" },
    { from: "angel_14_zeruel", to: "eva_unit02", shortcodes: ["zeruel", "unit02"], notes: "Zeruel cuts off Unit-02's arms and head in seconds on its way down to Central Dogma.", revealedAt: { kind: "ep", episode: 19 }, revealedAtSource: "https://wiki.evageeks.org/Zeruel --- Zeruel 'cut off Eva-02's arms' and head before reaching the command center" },
    { from: "angel_14_zeruel", to: "eva_unit00", shortcodes: ["zeruel", "unit00"], notes: "Zeruel destroys Unit-00 (Rei's unit) during its rampage through NERV HQ.", revealedAt: { kind: "ep", episode: 19 }, revealedAtSource: "https://wiki.evageeks.org/Zeruel --- Zeruel 'destroyed Eva-00' during the descent to Central Dogma" },
    { from: "angel_15_arael", to: "char_asuka", shortcodes: ["arael", "asuka"], notes: "Arael attacks from orbit by piercing Asuka's mind --- the assault that collapses her sync ratio for the rest of the show.", revealedAt: { kind: "ep", episode: 22 }, revealedAtSource: "https://wiki.evageeks.org/Arael --- the bird-of-light Fifteenth Angel mind-attacks Asuka in Ep. 22" },
    { from: "angel_16_armisael", to: "eva_unit00", shortcodes: ["armisael", "unit00"], notes: "Armisael undertakes biofusion with Unit-00 --- physically invading the unit's body with its own biomass.", revealedAt: { kind: "ep", episode: 23 }, revealedAtSource: "https://wiki.evageeks.org/Armisael --- 'Armisael begins to undertake biofusion, that is, physically invading the foreign body with its own biomass'" },
    { from: "angel_16_armisael", to: "char_rei", shortcodes: ["armisael", "rei"], notes: "Armisael speaks to Rei mid-fusion with a child-like naivete, naming its loneliness only as 'pain' --- the exchange Rei answers by self-destructing Unit-00.", revealedAt: { kind: "ep", episode: 23 }, revealedAtSource: "https://wiki.evageeks.org/Armisael --- 'Armisael's brief interchange with Rei establishes it as possessing a child-like naivete'" },

    // --- Lance of Longinus as the kill weapon on Arael (the Lance already
    // ties to Unit-00, Lilith, Terminal Dogma and the MP replicas). ---
    { from: "concept_lance_of_longinus", to: "angel_15_arael", shortcodes: ["lanceOfLonginus", "arael"], notes: "Rei hurls the Lance from Unit-00 and it pierces Arael's A.T. Field, destroying the Fifteenth Angel from orbit.", revealedAt: { kind: "ep", episode: 22 }, revealedAtSource: "https://wiki.evageeks.org/Arael --- the Spear of Longinus 'pierced Arael's A.T. Field and destroyed the Angel'" },

    // --- EVA / concept mechanics: the prog knife and entry plug are not
    // unique to Unit-01; the S2 engine has two on-screen sources (Shamshel's
    // corpse, Zeruel's body); the Dummy Plug drives the Mass Production line. ---
    { from: "concept_s2_engine", to: "angel_04_shamshel", shortcodes: ["s2Engine", "shamshel"], notes: "The first S2 Engine NERV ever recovered came mostly intact from Shamshel's corpse in the Ep. 5 autopsy.", revealedAt: { kind: "ep", episode: 5 }, revealedAtSource: "https://wiki.evageeks.org/S2_Engine --- 'a mostly-intact S² Engine is obtained from the corpse of Shamshel'" },
    { from: "concept_s2_engine", to: "angel_14_zeruel", shortcodes: ["s2Engine", "zeruel"], notes: "Zeruel's S2 Engine is the one a berserk Unit-01 tears out and devours, going off-grid for good.", revealedAt: { kind: "ep", episode: 19 }, revealedAtSource: "https://wiki.evageeks.org/Zeruel --- Eva-01 'proceeded to consume the Angel's body, absorbing Zeruel's S² Engine in the process'" },
    { from: "concept_progressive_knife", to: "eva_unit00", shortcodes: ["progressiveKnife", "unit00"], notes: "Unit-00 carries a Progressive Knife as well --- standard close-combat armament for every Evangelion. (wiki/Progressive_Knife)" },
    { from: "concept_progressive_knife", to: "eva_unit02", shortcodes: ["progressiveKnife", "unit02"], notes: "Unit-02 stows a Progressive Knife in each shoulder pylon --- the close-quarters tool when the rifle is empty.", revealedAt: { kind: "ep", episode: 8 }, revealedAtSource: "https://wiki.evageeks.org/Progressive_Knife --- every Evangelion is equipped with a Progressive Knife" },
    { from: "concept_entry_plug", to: "eva_unit01", shortcodes: ["entryPlug", "unit01"], notes: "The entry plug is the capsule the pilot rides --- it slots into Unit-01's spine and floods with LCL on activation. (wiki/Entry_Plug)" },
    { from: "concept_dummy_plug", to: "eva_mass_production", shortcodes: ["dummyPlug", "massProduction"], notes: "The nine Mass Production units fly autonomously on dummy systems --- the Dummy Plug taken to its mass-built conclusion.", revealedAt: { kind: "eoe" }, revealedAtSource: "https://wiki.evageeks.org/MP_Eva --- the MP series runs on 'dummy systems generated from Kaworu Nagisa's thought patterns'" },

    // --- Kaworu commandeers Unit-02. NOT a Children pilots line: per the
    // invariants test that omission is deliberate, so this one-off Ep. 24
    // commandeering beat is encoded as a generic tie instead. ---
    { from: "char_kaworu", to: "eva_unit02", shortcodes: ["kaworu", "unit02"], notes: "Kaworu takes manual control of Unit-02 and walks it down toward Terminal Dogma --- the unit barely resists him.", revealedAt: { kind: "ep", episode: 24 }, revealedAtSource: "https://wiki.evageeks.org/Kaworu_Nagisa --- during his Terminal Dogma descent 'Kaworu is manipulating Eva-02'" },

    // --- LCL is Lilith's blood: ties the Second Angel to the fluid the whole
    // cast breathes (and dissolves back into at Instrumentality). ---
    { from: "angel_02_lilith", to: "concept_lcl", shortcodes: ["lilith", "lcl"], notes: "LCL is literally Lilith's blood --- the Terminal Dogma 'LCL Plant' is a lake drained from the crucified Second Angel.", revealedAt: { kind: "ep", episode: 23 }, revealedAtSource: "https://wiki.evageeks.org/LCL --- 'LCL is, in fact, the blood of the Second Angel, Lilith'" },

    // --- Core character relationships the seed never wired directly. The
    // glaring gap was Gendo <-> Shinji, present only through the shared Ikari
    // family node until now. ---
    { from: "char_gendo", to: "char_shinji", shortcodes: ["gendo", "shinji"], notes: "Father and son. Gendo summoned Shinji to Tokyo-3 the day NERV needed a Unit-01 pilot --- the first time he had addressed him in years. The wound the whole show turns on." },
    { from: "char_shinji", to: "char_rei", shortcodes: ["shinji", "rei"], notes: "Shinji and the First Child. He carries the broken-and-bandaged Rei off her gurney, refuses to let her be the spare, and slowly thaws her affect --- the bond that teaches him people are reachable." },
    { from: "char_shinji", to: "char_asuka", shortcodes: ["shinji", "asuka"], notes: "The central teen dynamic --- co-pilots, flatmates, rivals, the Ep. 15 kiss 'to kill time.' Every approach toward each other ends in retreat.", revealedAt: { kind: "ep", episode: 8 }, revealedAtSource: "https://wiki.evageeks.org/Asuka_Langley_Soryu --- Asuka arrives in Ep. 8 and is folded into Shinji's life from there" },
    { from: "char_shinji", to: "char_kaworu", shortcodes: ["shinji", "kaworu"], notes: "The Fifth Child befriends Shinji in a single episode --- shares a bath, says 'suki da,' and is the first person to tell Shinji he is worthy of love, before asking to be killed.", revealedAt: { kind: "ep", episode: 24 }, revealedAtSource: "https://wiki.evageeks.org/Kaworu_Nagisa --- Kaworu tells Shinji he is 'favorable' (suki) in Ep. 24" },
    { from: "char_shinji", to: "char_toji", shortcodes: ["shinji", "toji"], notes: "Classmate turned friend. Toji swings a punch at Shinji over his hospitalized sister, then asks Shinji to hit him back after the Shamshel sortie --- and later pilots the doomed Unit-03.", revealedAt: { kind: "ep", episode: 3 }, revealedAtSource: "https://wiki.evageeks.org/Toji_Suzuhara --- 'Toji Suzuhara is Shinji Ikari's classmate and later friend'; the punch lands in Ep. 3" },
    { from: "char_rei", to: "char_asuka", shortcodes: ["rei", "asuka"], notes: "The other two Children. Asuka cannot stand Rei's blank obedience --- pilots 'like a doll' --- and the contrast defines them both.", revealedAt: { kind: "ep", episode: 8 }, revealedAtSource: "https://wiki.evageeks.org/Asuka_Langley_Soryu --- Asuka and Rei share the Children roster from Ep. 8" },
    { from: "char_gendo", to: "char_fuyutsuki", shortcodes: ["gendo", "fuyutsuki"], notes: "Commander and Sub-Commander. Fuyutsuki has stood at Gendo's shoulder since the GEHIRN days --- the one man who knew Yui and still disagrees with Gendo out loud." },
    { from: "char_misato", to: "char_ritsuko", shortcodes: ["misato", "ritsuko"], notes: "College friends from Tokyo-2 (where Misato was dating Kaji). The bridge's operations/science double act, drifting apart as Ritsuko keeps NERV's secrets. (wiki/Ritsuko_Akagi)" },
    { from: "char_ritsuko", to: "char_kaji", shortcodes: ["ritsuko", "kaji"], notes: "Ritsuko knew Kaji at Tokyo-2 college as Misato's boyfriend --- the third corner of the university triangle.", revealedAt: { kind: "ep", episode: 8 }, revealedAtSource: "https://wiki.evageeks.org/Ritsuko_Akagi --- 'Ritsuko met Misato Katsuragi in college at Tokyo-2, as well as Misato's boyfriend Ryoji Kaji'" },
    { from: "char_kaji", to: "char_gendo", shortcodes: ["kaji", "gendo"], notes: "Kaji answers to Gendo as NERV's special inspector --- and personally hand-delivers the embryonic Adam to him, the courier job that gets him killed.", revealedAt: { kind: "ep", episode: 8 }, revealedAtSource: "https://wiki.evageeks.org/Ryoji_Kaji --- Kaji rejoins NERV as a special inspector under Gendo from Ep. 8" },
    { from: "char_ritsuko", to: "char_rei", shortcodes: ["ritsuko", "rei"], notes: "Ritsuko maintains the Rei clones --- and in Ep. 23 destroys the Dummy Plant tank of spare Reis, insisting what she really killed was Rei, her rival.", revealedAt: { kind: "ep", episode: 23 }, revealedAtSource: "https://wiki.evageeks.org/Ritsuko_Akagi --- 'Ritsuko destroyed the Dummy System and with it the mindless Rei clones'" },

    // --- Instrumentality's two architects: SEELE's Keel runs the official
    // scenario; Gendo runs a secret divergent one to reach Yui. Keel chairs
    // the committee Gendo answers to. ---
    { from: "char_keel", to: "concept_human_instrumentality", shortcodes: ["keel", "humanInstrumentality"], notes: "Keel runs SEELE's Instrumentality scenario --- the forced evolution of humanity through a controlled Third Impact.", revealedAt: { kind: "ep", episode: 14 }, revealedAtSource: "https://wiki.evageeks.org/Human_Instrumentality_Project --- 'Seele's secret goal: the forced evolution of humanity through bringing about Third Impact under their own control'" },
    { from: "char_gendo", to: "concept_human_instrumentality", shortcodes: ["gendo", "humanInstrumentality"], notes: "Gendo lets SEELE think he follows their plan while running his own --- using Instrumentality to reunite with Yui.", revealedAt: { kind: "ep", episode: 14 }, revealedAtSource: "https://wiki.evageeks.org/Human_Instrumentality_Project --- 'Gendo allows Seele to believe he is following their plan, but actually sticks to his own: he wishes to use Instrumentality to reunite with his wife Yui'" },
    { from: "char_keel", to: "char_gendo", shortcodes: ["keel", "gendo"], notes: "Keel chairs the committee Gendo answers to --- SEELE-01 over the NERV Commander, until Gendo stops taking the calls late in the show.", revealedAt: { kind: "ep", episode: 14 }, revealedAtSource: "https://wiki.evageeks.org/Keel_Lorenz --- Keel is the SEELE chairman directing Gendo's chain of command (first on screen Ep. 14)" },
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
  title: "Neon Genesis Evangelion --- canon graph",
  source: "Neon Genesis Evangelion (TV, 1995) + End of Evangelion",
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
    ...audience,
  ],
  edges: buildEdges(),
};
