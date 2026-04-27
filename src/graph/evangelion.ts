import type {
  AngelNode,
  CharacterNode,
  ConceptNode,
  Edge,
  EvaNode,
  EvangelionGraph,
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
    notes: "The protagonist. Reluctant pilot of Evangelion Unit-01.",
  },
  {
    id: "char_asuka",
    kind: "character",
    displayName: "Asuka Langley Soryu",
    shortcodes: ["asuka"],
    role: "Second Child / Pilot of Unit-02",
    revealedAt: { kind: "ep", episode: 8 },
    notes: "Hot-headed German-American pilot of Evangelion Unit-02.",
  },
  {
    id: "char_rei",
    kind: "character",
    displayName: "Rei Ayanami",
    shortcodes: ["rei"],
    role: "First Child / Pilot of Unit-00",
    notes:
      "Quiet pilot of Unit-00. Lives alone, speaks rarely, follows orders precisely.",
  },
  {
    id: "char_misato",
    kind: "character",
    displayName: "Misato Katsuragi",
    shortcodes: ["misato"],
    role: "NERV Operations Director",
    notes: "Tactical commander during angel attacks. Shinji's guardian.",
  },
  {
    id: "char_kaworu",
    kind: "character",
    displayName: "Kaworu Nagisa",
    shortcodes: ["kaworu"],
    role: "Fifth Child",
    revealedAt: { kind: "ep", episode: 24 },
    notes:
      "The Fifth Child. Walks into the show with quiet, cosmic significance.",
  },
  {
    id: "char_gendo",
    kind: "character",
    displayName: "Gendo Ikari",
    shortcodes: ["gendo"],
    role: "NERV Commander",
    notes: "Shinji's estranged father. Runs NERV with his own agenda.",
  },
  {
    id: "char_ritsuko",
    kind: "character",
    displayName: "Ritsuko Akagi",
    shortcodes: ["ritsuko"],
    role: "NERV Chief Scientist",
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
    shortcodes: ["yui"],
    role: "Lost researcher (Unit-01 contact experiment)",
    revealedAt: { kind: "ep", episode: 20 },
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
    notes:
      "Original architect of the Magi system. Ritsuko's mother. Took her own life on the Magi launch day; her three personalities became Casper, Melchior, and Balthasar.",
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
    // Location nodes always render their displayName as "Place (Location)"
    // so the 3D label disambiguates them from organization or character
    // nodes. validateGraph enforces this suffix.
    displayName: "NERV HQ (Location)",
    shortcodes: ["nervHq"],
    notes:
      "NERV's underground headquarters beneath Tokyo-3, set inside the Geofront cavity.",
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

  // Eliminated edges: EVA -> angel/concept the unit took down. Seed with
  // the canonical first kill, Unit-01 vs Sachiel (Ep. 2). More entries
  // accrue as the catalog grows.
  out.push({
    from: "eva_unit01",
    to: "angel_03_sachiel",
    kind: "eliminated",
    weight: EDGE_WEIGHT.eliminated,
    shortcodes: ["unit01", "sachiel"],
    notes: "Unit-01 eliminates Sachiel, the Third Angel (Ep. 2).",
  });

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
  ],
  edges: buildEdges(),
};
