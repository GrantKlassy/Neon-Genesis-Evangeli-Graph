import type {
  AngelNode,
  CharacterNode,
  ConceptNode,
  Edge,
  EvaNode,
  EvangelionGraph,
  EventNode,
  LocationNode,
  MagiNode,
  OrganizationNode,
} from "./types";
import { EDGE_WEIGHT } from "./layoutTuning";

/**
 * Initial seed for the Neon Genesis Evangeli-Graph.
 *
 * Four top-level concepts:
 *   - 10 main-cast characters (matches src/genesis character entries).
 *   - 18 angels in canonical NGE TV-series order (Adam = 1, Lilim = 18).
 *   - 3 Magi nodes connected as a tight triangle (the "3-in-1" joke).
 *   - 1 event (Third Impact) gated to End-of-Evangelion / TV ep 25+.
 *
 * Each node lists the genesis shortcodes it links to. Shinji Ikari maps to
 * BOTH `shinji` (given name) and `ikari` (family) so the family shortcode is
 * shared between Shinji, Gendo, and Yui.
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
    shortcodes: ["shinji", "ikari"],
    role: "Third Child / Pilot of Unit-01",
    notes: "The protagonist. Reluctant pilot of Evangelion Unit-01.",
  },
  {
    id: "char_asuka",
    kind: "character",
    displayName: "Asuka Langley Soryu",
    shortcodes: ["asuka", "langley"],
    role: "Second Child / Pilot of Unit-02",
    revealedAt: { kind: "ep", episode: 8 },
    notes: "Hot-headed German-American pilot of Evangelion Unit-02.",
  },
  {
    id: "char_rei",
    kind: "character",
    displayName: "Rei Ayanami",
    shortcodes: ["rei", "ayanami"],
    role: "First Child / Pilot of Unit-00",
    notes:
      "Quiet pilot of Unit-00. Lives alone, speaks rarely, follows orders precisely.",
  },
  {
    id: "char_misato",
    kind: "character",
    displayName: "Misato Katsuragi",
    shortcodes: ["misato", "katsuragi"],
    role: "NERV Operations Director",
    notes: "Tactical commander during angel attacks. Shinji's guardian.",
  },
  {
    id: "char_kaworu",
    kind: "character",
    displayName: "Kaworu Nagisa",
    shortcodes: ["kaworu", "nagisa"],
    role: "Fifth Child",
    revealedAt: { kind: "ep", episode: 24 },
    notes:
      "The Fifth Child. Walks into the show with quiet, cosmic significance.",
  },
  {
    id: "char_gendo",
    kind: "character",
    displayName: "Gendo Ikari",
    shortcodes: ["gendo", "ikari"],
    role: "NERV Commander",
    notes: "Shinji's estranged father. Runs NERV with his own agenda.",
  },
  {
    id: "char_ritsuko",
    kind: "character",
    displayName: "Ritsuko Akagi",
    shortcodes: ["ritsuko", "akagi"],
    role: "NERV Chief Scientist",
    notes:
      "Lead engineer on the Evangelions and the Magi. Daughter of Naoko Akagi.",
  },
  {
    id: "char_mari",
    kind: "character",
    displayName: "Mari Makinami Illustrious",
    shortcodes: ["mari", "makinami"],
    role: "Pilot (Rebuild)",
    revealedAt: { kind: "rebuild" },
    notes: "Rebuild-only pilot. Excitable, opportunistic, sings in combat.",
  },
  {
    id: "char_toji",
    kind: "character",
    displayName: "Toji Suzuhara",
    shortcodes: ["toji"],
    role: "Classmate",
    revealedAt: { kind: "ep", episode: 3 },
    notes:
      "Shinji's classmate. Athletic, gruff, fiercely loyal to those close to him.",
  },
  {
    id: "char_yui",
    kind: "character",
    displayName: "Yui Ikari",
    shortcodes: ["yui", "ikari"],
    role: "Lost researcher (Unit-01 contact experiment)",
    revealedAt: { kind: "ep", episode: 20 },
    notes:
      "Shinji's mother. Lost during a contact experiment with Unit-01.",
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

const events: EventNode[] = [
  {
    id: "event_third_impact",
    kind: "event",
    name: "Third Impact",
    displayName: "Third Impact",
    shortcodes: ["thirdImpact"],
    revealedAt: { kind: "eoe" },
    notes:
      "Instrumentality. Unfolds across End of Evangelion (and abstractly in TV ep 25-26).",
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
];

const locations: LocationNode[] = [
  {
    id: "loc_nerv_hq",
    kind: "location",
    name: "NERV HQ",
    displayName: "NERV HQ",
    shortcodes: ["nervHq"],
    notes:
      "NERV's underground headquarters beneath Tokyo-3, set inside the Geofront cavity.",
  },
];

const concepts: ConceptNode[] = [
  // Placeholder seed concept node. The real concept catalog (AT Field, LCL,
  // Anti-AT Field, etc.) lands as the investigation grows --- this single
  // node exists to (a) prove out the concept kind end-to-end and (b) give
  // the renderer a node to paint in the new concept color.
  {
    id: "concept_test_node",
    kind: "concept",
    name: "TEST NODE",
    displayName: "TEST NODE",
    shortcodes: ["atField"],
    notes: "Placeholder concept node. Real concept entries land later.",
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
    notes:
      "End of Evangelion white-bodied series. Identical clones with rictus grins.",
  },
];

/**
 * Edges. Four kinds in the seed:
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
    shortcodes: ["toji", "bardiel"],
    notes: "Toji is the Unit-03 pilot; Bardiel possesses Unit-03 (Ep. 18).",
  });
  out.push({
    from: "char_rei",
    to: "char_yui",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "ep", episode: 23 },
    shortcodes: ["rei", "yui"],
    notes: "Rei's origin traces back to Yui's salvaged genetic material.",
  });
  out.push({
    from: "char_kaworu",
    to: "angel_17_tabris",
    kind: "identity_reveal",
    weight: idWeight,
    revealedAt: { kind: "ep", episode: 24 },
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
    shortcodes: ["asuka", "unit02"],
    notes: "Asuka pilots Unit-02 (arrives Ep. 8).",
  });
  out.push({
    from: "char_toji",
    to: "eva_unit03",
    kind: "pilots",
    weight: pilotsWeight,
    revealedAt: { kind: "ep", episode: 17 },
    shortcodes: ["toji", "unit03"],
    notes: "Toji is the Fourth Child / Unit-03 pilot (Ep. 17).",
  });

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
    ...events,
    ...organizations,
    ...locations,
    ...concepts,
    ...evas,
  ],
  edges: buildEdges(),
};
