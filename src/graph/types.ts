/**
 * Graph schema. Source of truth for types used across data, rendering, and tests.
 *
 * Three top-level node kinds:
 *   - character: cast members (Shinji, Asuka, Rei, Misato, ...).
 *   - angel: the 18 canonical angels of NGE, numbered 1-18.
 *   - magi: the three Magi system nodes (Casper-3, Melchior-1, Balthasar-2).
 *
 * Spoiler gate: some entities (and edges between them) reveal late-show
 * plot points. Anything tagged `spoilerLevel: "spoiler"` (or, in the
 * future, edges of that level) should be hidden by default once a
 * "no-spoilers" mode is wired up. The first basic seed simply omits the
 * spoiler-revealing edges (e.g. char_kaworu <-> angel_17_tabris) entirely
 * so the bare graph cannot give that away.
 */

export type NodeKind = "character" | "angel" | "magi";

export type SpoilerLevel = "open" | "spoiler";

export type EdgeKind = "magi_link" | "angel_sequence";

export interface CharacterNode {
  id: string;
  kind: "character";
  displayName: string;
  /** Key into src/theme/palette for primary color. */
  paletteKey: string;
  role: string;
  spoilerLevel: SpoilerLevel;
  notes: string;
}

export interface AngelNode {
  id: string;
  kind: "angel";
  /** Canonical angel number 1-18. Fixed ordering across the show. */
  number: number;
  /** Canonical angel name (Sachiel, Ramiel, Tabris, ...). */
  name: string;
  spoilerLevel: SpoilerLevel;
  /** Episode of first appearance, freeform ("Ep. 5", "Backstory", ...). */
  introducedEpisode: string;
  notes: string;
}

export interface MagiNode {
  id: string;
  kind: "magi";
  /** Display name with hyphenated index ("Casper-3", "Melchior-1"). */
  name: string;
  /** Personality fragment carried by this node ("Woman", "Scientist", "Mother"). */
  personality: string;
  /** Key into src/theme/palette (kept for lore tooltips; renderer paints all 3 the same). */
  paletteKey: string;
  notes: string;
}

export type GraphNode = CharacterNode | AngelNode | MagiNode;

export interface Edge {
  from: string;
  to: string;
  kind: EdgeKind;
  notes: string;
}

export interface EvangelionGraph {
  id: string;
  title: string;
  source: string;
  nodes: GraphNode[];
  edges: Edge[];
}
