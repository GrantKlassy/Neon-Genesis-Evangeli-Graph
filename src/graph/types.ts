/**
 * Graph schema. Source of truth for types used across data, rendering, and tests.
 *
 * Canon scope: the 1995 TV series (26 episodes) plus End of Evangelion. The
 * Rebuild tetralogy is a parallel timeline and is INTENTIONALLY out of scope
 * --- this graph is the "true" canon view.
 *
 * Top-level node kinds:
 *   - character: cast members (Shinji, Asuka, Rei, Misato, ...).
 *   - angel: the 18 canonical angels of NGE, numbered 1-18.
 *   - magi: the three Magi system nodes (Casper-3, Melchior-1, Balthasar-2).
 *   - event: in-universe events (First Impact, Second Impact, ...). Often
 *     disconnected.
 *   - organization: in-universe orgs (NERV, SEELE, GEHIRN, JSSDF, ...).
 *   - location: physical places (NERV HQ, Tokyo-3, Mt. Asama, ...).
 *   - concept: abstract / in-universe concepts (AT Field, LCL, ...).
 *   - eva: EVA units (Unit-00 through Mass Production).
 *   - family: family/lineage roll-up nodes (Ikari, Akagi). Characters point
 *     at their family via member_of_family edges.
 *   - audience: the viewer-as-Lilim node. Tabris names humanity itself the
 *     18th Angel; the audience IS Lilim. Singular --- only one node of this
 *     kind exists in the graph (id "audience_you"), gated to EoE.
 *
 * Genesis linkage: every node carries a single-entry `shortcodes` array
 * pointing to its canonical identity in src/genesis. "Shinji Ikari" /
 * "Ikari Shinji" both reduce to ["shinji"]; the family-name registry entries
 * (`ikari`, `ayanami`, ...) exist only so body-copy text gets the family
 * color, no graph node references them.
 *
 * Spoiler gate: every node and every edge carries an OPTIONAL `revealedAt`
 * gate. Omit for entities visible from Episode 1. Otherwise pick exactly one
 * threshold:
 *   - { kind: "ep"; episode: N }     visible iff user has seen >= ep N.
 *   - { kind: "eoe" }                visible iff user has seen End of Evangelion
 *                                    OR has watched TV ep 25+ (the original
 *                                    finale covers the same Instrumentality
 *                                    territory abstractly).
 *
 * Node and edge gates are independent: Rei is open from ep 1, but the
 * Rei <-> Yui edge is gated to a late-show episode --- the character renders
 * either way, the relationship line does not.
 *
 * A masked entity STILL participates in the graph (layout, counts) but the
 * renderer paints its color black and replaces its label with full-block
 * mask characters --- the user can see something is there, just not what.
 *
 * Spoiler-aware gravity: the renderer filters masked edges out of the force
 * layout so a hidden relationship contributes zero pull. Rei does not settle
 * next to Yui pre-Ep. 23 just because there's a (still-hidden) edge between
 * them. See src/scripts/graph3d.ts for the entry point.
 */

export type NodeKind =
  | "character"
  | "angel"
  | "magi"
  | "event"
  | "organization"
  | "location"
  | "concept"
  | "eva"
  | "family"
  | "audience";

export type RevealedAt =
  | { kind: "ep"; episode: number }
  | { kind: "eoe" };

/**
 * Closed set of role / status tag identifiers a node can carry. New tags
 * must be added here AND in the TAGS registry (src/graph/tags.ts).
 */
export type TagId = "child" | "dies-by-end-of-series";

/**
 * A tag instance attached to a node. Each occurrence carries its own
 * spoiler gate: whether a node's "child" tag is visible from Ep 1 (Shinji)
 * or only after the Fourth-Child reveal at Ep 17 (Toji) is decided
 * per-node, not per-tag-type. Omit `revealedAt` for tags visible whenever
 * the node itself is visible.
 */
export interface NodeTag {
  id: TagId;
  revealedAt?: RevealedAt;
}

export type EdgeKind =
  | "magi_link"
  | "angel_sequence"
  | "identity_reveal"
  | "pilots"
  | "member_of_family"
  | "member_of_org"
  | "located_in"
  | "caused"
  | "generic"
  | "eliminated";

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
   * Single-entry genesis shortcode for this node's canonical identity.
   * Always length 1; the array shape is kept so existing iterators (CSS
   * vars, readout panel, tests) continue to work without per-call branches.
   */
  shortcodes: string[];
  /**
   * Spoiler gate. Omit for entities visible from Episode 1.
   */
  revealedAt?: RevealedAt;
  /**
   * Citation grounding the spoiler gate. Free-text, but in practice an
   * EvaWiki URL or "Ep. NN --- <event>" string. REQUIRED whenever
   * revealedAt is set (the validator throws when missing). The field
   * exists to force-author every gate against a checkable source instead
   * of trusting recall --- see CLAUDE.md / "your knowledge of the spoiler
   * may be false."
   */
  revealedAtSource?: string;
  /**
   * Optional role / status tags. Each tag instance carries its own spoiler
   * gate (see NodeTag). Tags are render-only metadata --- they do NOT
   * affect graph layout or edge resolution.
   */
  tags?: NodeTag[];
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

export interface EventNode extends NodeBase {
  kind: "event";
  /** Canonical event name ("Third Impact", "Second Impact"). */
  name: string;
}

export interface OrganizationNode extends NodeBase {
  kind: "organization";
  /** Canonical org name ("NERV", "SEELE", "GEHIRN"). */
  name: string;
}

export interface LocationNode extends NodeBase {
  kind: "location";
  /** Canonical place name ("NERV HQ", "Tokyo-3", "Geofront"). */
  name: string;
}

export interface ConceptNode extends NodeBase {
  kind: "concept";
  /** Canonical concept label ("AT Field", "LCL", "Instrumentality"). */
  name: string;
}

export interface EvaNode extends NodeBase {
  kind: "eva";
  /** Canonical unit name ("Unit-00", "Unit-01", "Mass Production"). */
  name: string;
  /**
   * Numeric designation for sorting / canonical ordering. Mass Production
   * is conventionally numbered last; pick a sentinel above 04.
   */
  number: number;
}

export interface FamilyNode extends NodeBase {
  kind: "family";
  /** Canonical family/lineage name ("Ikari", "Akagi"). */
  name: string;
}

/**
 * The viewer-as-Lilim node. There is exactly one node of this kind
 * ("audience_you"), gated to End of Evangelion. Tabris speaks the line
 * "Lilim" once and the show flinches; the audience is named as the 18th
 * Angel. The node connects to angel_18_lilim with an identity_reveal
 * edge so the graph reads "you ARE Lilim" once the late-show reveal lands.
 */
export interface AudienceNode extends NodeBase {
  kind: "audience";
  /** Display name --- always "You" in the canon node. */
  name: string;
}

export type GraphNode =
  | CharacterNode
  | AngelNode
  | MagiNode
  | EventNode
  | OrganizationNode
  | LocationNode
  | ConceptNode
  | EvaNode
  | FamilyNode
  | AudienceNode;

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
  /**
   * Spoiler gate for the relationship itself, independent of either endpoint.
   * Omit for edges visible from Ep 1. The renderer also masks an edge whose
   * either endpoint is masked (a half-revealed line still leaks information).
   */
  revealedAt?: RevealedAt;
  /**
   * Citation grounding the edge's spoiler gate. Required when revealedAt
   * is set --- same rule as on NodeBase.
   */
  revealedAtSource?: string;
  notes: string;
}

export interface EvangelionGraph {
  id: string;
  title: string;
  source: string;
  nodes: GraphNode[];
  edges: Edge[];
}

/**
 * The user-declared progress that gates entity visibility. Default state
 * for a brand-new visitor is { episode: 0, eoe: false } --- nothing
 * reveals until the user steps through the spoiler prompt.
 */
export interface SpoilerProgress {
  /** TV episode last finished, 0..26. 0 = haven't started. */
  episode: number;
  /** Has seen End of Evangelion. */
  eoe: boolean;
}

export const SPOILER_PROGRESS_DEFAULT: SpoilerProgress = {
  episode: 0,
  eoe: false,
};

export const SPOILER_PROGRESS_FULL: SpoilerProgress = {
  episode: 26,
  eoe: true,
};
