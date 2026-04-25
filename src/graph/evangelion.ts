import type {
  AngelNode,
  CharacterNode,
  Edge,
  EvangelionGraph,
  MagiNode,
} from "./types";

/**
 * Initial seed for the Neon Genesis Evangeli-Graph.
 *
 * Three top-level concepts:
 *   - 8 main-cast characters (matches src/theme/palette character entries).
 *   - 18 angels in canonical NGE TV-series order (Adam = 1, Lilim = 18).
 *   - 3 Magi nodes connected as a tight triangle (the "3-in-1" joke).
 *
 * No character <-> angel edges yet: that is where spoiler gating belongs
 * (e.g. Kaworu <-> Tabris would reveal the 17th-Angel twist), so those
 * connections are intentionally left out of the bare seed.
 */

const characters: CharacterNode[] = [
  {
    id: "char_shinji",
    kind: "character",
    displayName: "Shinji Ikari",
    paletteKey: "shinji",
    role: "Third Child / Pilot of Unit-01",
    spoilerLevel: "open",
    notes: "The protagonist. Reluctant pilot of Evangelion Unit-01.",
  },
  {
    id: "char_asuka",
    kind: "character",
    displayName: "Asuka Langley Soryu",
    paletteKey: "asuka",
    role: "Second Child / Pilot of Unit-02",
    spoilerLevel: "open",
    notes: "Hot-headed German-American pilot of Evangelion Unit-02.",
  },
  {
    id: "char_rei",
    kind: "character",
    displayName: "Rei Ayanami",
    paletteKey: "rei",
    role: "First Child / Pilot of Unit-00",
    spoilerLevel: "spoiler",
    notes: "Quiet pilot of Unit-00. Origins are a late-series reveal.",
  },
  {
    id: "char_misato",
    kind: "character",
    displayName: "Misato Katsuragi",
    paletteKey: "misato",
    role: "NERV Operations Director",
    spoilerLevel: "open",
    notes: "Tactical commander during angel attacks. Shinji's guardian.",
  },
  {
    id: "char_kaworu",
    kind: "character",
    displayName: "Kaworu Nagisa",
    paletteKey: "kaworu",
    role: "Fifth Child",
    spoilerLevel: "spoiler",
    notes:
      "The Fifth Child, introduced in Ep. 24. Connection to Tabris (17th Angel) is gated.",
  },
  {
    id: "char_gendo",
    kind: "character",
    displayName: "Gendo Ikari",
    paletteKey: "gendo",
    role: "NERV Commander",
    spoilerLevel: "open",
    notes: "Shinji's estranged father. Runs NERV with his own agenda.",
  },
  {
    id: "char_ritsuko",
    kind: "character",
    displayName: "Ritsuko Akagi",
    paletteKey: "ritsuko",
    role: "NERV Chief Scientist",
    spoilerLevel: "open",
    notes:
      "Lead engineer on the Evangelions and the Magi. Daughter of Naoko Akagi.",
  },
  {
    id: "char_mari",
    kind: "character",
    displayName: "Mari Makinami Illustrious",
    paletteKey: "mari",
    role: "Pilot (Rebuild)",
    spoilerLevel: "open",
    notes: "Rebuild-only pilot. Excitable, opportunistic, sings in combat.",
  },
];

const angels: AngelNode[] = [
  {
    id: "angel_01_adam",
    kind: "angel",
    number: 1,
    name: "Adam",
    spoilerLevel: "spoiler",
    introducedEpisode: "Backstory",
    notes:
      "First Angel. Source of the Second Impact. Existence and role are major reveals.",
  },
  {
    id: "angel_02_lilith",
    kind: "angel",
    number: 2,
    name: "Lilith",
    spoilerLevel: "spoiler",
    introducedEpisode: "Backstory",
    notes:
      "Second Angel. Crucified at the bottom of NERV in Terminal Dogma. Late-series reveal.",
  },
  {
    id: "angel_03_sachiel",
    kind: "angel",
    number: 3,
    name: "Sachiel",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 1",
    notes: "First Angel encountered on screen. Defeated in Tokyo-3 by Unit-01.",
  },
  {
    id: "angel_04_shamshel",
    kind: "angel",
    number: 4,
    name: "Shamshel",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 3",
    notes: "Tendril-whip angel. Defeated by Unit-01 in close combat.",
  },
  {
    id: "angel_05_ramiel",
    kind: "angel",
    number: 5,
    name: "Ramiel",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 5",
    notes:
      "Giant blue octahedron with a positron beam. The Operation Yashima sniper episode.",
  },
  {
    id: "angel_06_gaghiel",
    kind: "angel",
    number: 6,
    name: "Gaghiel",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 8",
    notes: "Underwater angel. The Pacific fleet engagement with Unit-02.",
  },
  {
    id: "angel_07_israfel",
    kind: "angel",
    number: 7,
    name: "Israfel",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 9",
    notes:
      "Splits into two. Defeated by Shinji and Asuka in the choreographed dance.",
  },
  {
    id: "angel_08_sandalphon",
    kind: "angel",
    number: 8,
    name: "Sandalphon",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 10",
    notes: "Embryonic angel pulled out of Mt. Asama by Unit-02.",
  },
  {
    id: "angel_09_matarael",
    kind: "angel",
    number: 9,
    name: "Matarael",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 11",
    notes: "Spider-shaped acid-rain angel. Defeated during the blackout.",
  },
  {
    id: "angel_10_sahaquiel",
    kind: "angel",
    number: 10,
    name: "Sahaquiel",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 12",
    notes: "Orbital angel that body-checks Tokyo-3. Caught by all three EVAs.",
  },
  {
    id: "angel_11_iruel",
    kind: "angel",
    number: 11,
    name: "Iruel",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 13",
    notes:
      "Nano-machine angel that infiltrates the Magi system. Defeated by Ritsuko.",
  },
  {
    id: "angel_12_leliel",
    kind: "angel",
    number: 12,
    name: "Leliel",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 16",
    notes:
      "Shadow / Dirac sea angel. Swallows Unit-01. The introspective bottle episode.",
  },
  {
    id: "angel_13_bardiel",
    kind: "angel",
    number: 13,
    name: "Bardiel",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 18",
    notes:
      "Possesses Unit-03 with Toji aboard. Forces Unit-01 into a brutal fight.",
  },
  {
    id: "angel_14_zeruel",
    kind: "angel",
    number: 14,
    name: "Zeruel",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 19",
    notes:
      "Paper-ribbon angel. Tears through Tokyo-3. Triggers Unit-01's berserk feeding.",
  },
  {
    id: "angel_15_arael",
    kind: "angel",
    number: 15,
    name: "Arael",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 22",
    notes:
      "Bird-of-light angel. Mind-attacks Asuka. Defeated by the Lance of Longinus.",
  },
  {
    id: "angel_16_armisael",
    kind: "angel",
    number: 16,
    name: "Armisael",
    spoilerLevel: "open",
    introducedEpisode: "Ep. 23",
    notes: "Helix angel that fuses with Unit-00. Forces Rei to self-destruct.",
  },
  {
    id: "angel_17_tabris",
    kind: "angel",
    number: 17,
    name: "Tabris",
    spoilerLevel: "spoiler",
    introducedEpisode: "Ep. 24",
    notes:
      "Final visible angel. Identity reveal is a major spoiler --- gated until unlocked.",
  },
  {
    id: "angel_18_lilim",
    kind: "angel",
    number: 18,
    name: "Lilim",
    spoilerLevel: "spoiler",
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
    personality: "Woman",
    paletteKey: "casper",
    notes:
      "Naoko Akagi's woman fragment. The terminal-green default Magi node.",
  },
  {
    id: "magi_melchior",
    kind: "magi",
    name: "Melchior-1",
    personality: "Scientist",
    paletteKey: "melchior",
    notes: "Naoko Akagi's scientist fragment. Lead vote on cold logic.",
  },
  {
    id: "magi_balthasar",
    kind: "magi",
    name: "Balthasar-2",
    personality: "Mother",
    paletteKey: "balthasar",
    notes: "Naoko Akagi's mother fragment. Tiebreaker on protective calls.",
  },
];

/**
 * Edges. Two kinds in the basic seed:
 *   - magi_link: tight triangle between the three Magi (3-in-1 joke).
 *   - angel_sequence: chain angel(N) -> angel(N+1) for N = 1..17, mirroring
 *     the canonical TV-series numbering.
 *
 * Characters do not yet have edges to anything; that is reserved for future
 * relationship layers (pilot <-> EVA, guardian <-> ward, ...).
 */
function buildEdges(): Edge[] {
  const out: Edge[] = [];

  // Magi triangle: every pair, both directions are not needed --- a single
  // edge per pair is enough for the layout. Three pairs total.
  out.push({
    from: "magi_casper",
    to: "magi_melchior",
    kind: "magi_link",
    notes: "Casper <-> Melchior (3-in-1)",
  });
  out.push({
    from: "magi_melchior",
    to: "magi_balthasar",
    kind: "magi_link",
    notes: "Melchior <-> Balthasar (3-in-1)",
  });
  out.push({
    from: "magi_balthasar",
    to: "magi_casper",
    kind: "magi_link",
    notes: "Balthasar <-> Casper (3-in-1)",
  });

  // Angel canonical sequence.
  const sorted = [...angels].sort((a, b) => a.number - b.number);
  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]!;
    const to = sorted[i + 1]!;
    out.push({
      from: from.id,
      to: to.id,
      kind: "angel_sequence",
      notes: `Angel #${from.number} (${from.name}) -> Angel #${to.number} (${to.name})`,
    });
  }

  return out;
}

export const evangelion: EvangelionGraph = {
  id: "evangelion",
  title: "Neon Genesis Evangelion --- canon seed",
  source: "Neon Genesis Evangelion (TV) + End of Evangelion",
  nodes: [...characters, ...angels, ...magi],
  edges: buildEdges(),
};
