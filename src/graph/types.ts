/**
 * Graph schema. Source of truth for types used across data, rendering, and tests.
 *
 * Three top-level node kinds:
 *   - character: cast members (Shinji, Asuka, Rei, Misato, ...).
 *   - angel: the 18 canonical angels of NGE, numbered 1-18.
 *   - magi: the three Magi system nodes (Casper-3, Melchior-1, Balthasar-2).
 *
 * Genesis linkage: every node carries a non-empty `shortcodes` array of
 * keys into src/genesis. "Shinji Ikari" -> ["shinji", "ikari"]. The first
 * shortcode is treated as the node's primary identity for color / sort.
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

interface NodeBase {
  id: string;
  kind: NodeKind;
  /**
   * Human-readable label drawn directly on the node in the 3D scene
   * (centered on the node, depth-disabled so it always reads on top).
   * Required for every node kind.
   */
  displayName: string;
  /**
   * Genesis shortcodes connected to this node, ordered most-canonical first.
   * Must contain at least one entry that resolves in src/genesis.
   */
  shortcodes: string[];
  spoilerLevel: SpoilerLevel;
  notes: string;
}

export interface CharacterNode extends NodeBase {
  kind: "character";
  role: string;
}

export interface AngelNode extends NodeBase {
  kind: "angel";
  /** Canonical angel number 1-18. Fixed ordering across the show. */
  number: number;
  /** Canonical angel name (Sachiel, Ramiel, Tabris, ...). */
  name: string;
  /** Episode of first appearance, freeform ("Ep. 5", "Backstory", ...). */
  introducedEpisode: string;
}

export interface MagiNode extends NodeBase {
  kind: "magi";
  /** Magi name with hyphenated index ("Casper-3", "Melchior-1"). */
  name: string;
  /** Personality fragment carried by this node ("Woman", "Scientist", "Mother"). */
  personality: string;
}

export type GraphNode = CharacterNode | AngelNode | MagiNode;

export interface Edge {
  from: string;
  to: string;
  kind: EdgeKind;
  /**
   * Genesis shortcodes implicated by the relationship (optional). Empty for
   * structural-only edges (the magi triangle, the angel sequence chain).
   */
  shortcodes?: string[];
  /**
   * Spring weight multiplier in the force layout. Values > 1 pull the
   * endpoints toward the rest length more aggressively (tighter group);
   * values < 1 let repulsion overshoot rest more (looser group). Defaults
   * to 1 when unset. The 3-in-1 magi triangle uses a higher weight so the
   * three magi sit as a tight cluster even after the post-layout squish.
   */
  weight?: number;
  notes: string;
}

export interface EvangelionGraph {
  id: string;
  title: string;
  source: string;
  nodes: GraphNode[];
  edges: Edge[];
}
