import type {
  AngelNode,
  AudienceNode,
  CharacterNode,
  ConceptNode,
  Edge,
  EdgeKind,
  EvaNode,
  EvangelionGraph,
  EventNode,
  FamilyNode,
  GraphNode,
  LocationNode,
  MagiNode,
  NodeKind,
  NodeTag,
  OrganizationNode,
  RevealedAt,
  SpoilerProgress,
  TagId,
} from "./types";
import {
  SPOILER_PROGRESS_DEFAULT,
  SPOILER_PROGRESS_FULL,
} from "./types";
import { TAG_IDS, TAGS, isTagId, visibleTags } from "./tags";
import type { TagDef } from "./tags";
import {
  assertGenesisValid,
  colorOf,
  isShortcode,
  validateGenesis,
} from "../genesis";

export type {
  AngelNode,
  AudienceNode,
  CharacterNode,
  ConceptNode,
  Edge,
  EdgeKind,
  EvaNode,
  EvangelionGraph,
  EventNode,
  FamilyNode,
  GraphNode,
  LocationNode,
  MagiNode,
  NodeKind,
  NodeTag,
  OrganizationNode,
  RevealedAt,
  SpoilerProgress,
  TagDef,
  TagId,
};
export { SPOILER_PROGRESS_DEFAULT, SPOILER_PROGRESS_FULL };
export { TAG_IDS, TAGS, isTagId, visibleTags };

export { evangelion } from "./evangelion";

export function isCharacter(node: GraphNode): node is CharacterNode {
  return node.kind === "character";
}

export function isAngel(node: GraphNode): node is AngelNode {
  return node.kind === "angel";
}

export function isMagi(node: GraphNode): node is MagiNode {
  return node.kind === "magi";
}

export function isEvent(node: GraphNode): node is EventNode {
  return node.kind === "event";
}

export function isOrganization(node: GraphNode): node is OrganizationNode {
  return node.kind === "organization";
}

export function isLocation(node: GraphNode): node is LocationNode {
  return node.kind === "location";
}

export function isConcept(node: GraphNode): node is ConceptNode {
  return node.kind === "concept";
}

export function isEva(node: GraphNode): node is EvaNode {
  return node.kind === "eva";
}

export function isFamily(node: GraphNode): node is FamilyNode {
  return node.kind === "family";
}

export function isAudience(node: GraphNode): node is AudienceNode {
  return node.kind === "audience";
}

/**
 * "Show complete" gate: the entire TV run plus End of Evangelion. Stricter
 * than the EoE-visible gate (`progress.eoe || progress.episode >= 25`)
 * because some surfaces only want to fire after the user has explicitly
 * acknowledged finishing both the TV finale AND the film. Used by the
 * dies-by-end-of-series readout badge: the badge is meant as a closing
 * roll-call after every spoiler has fallen, not a live spoiler itself.
 */
export function isShowComplete(progress: SpoilerProgress): boolean {
  return progress.eoe && progress.episode >= 26;
}

export function nodeIndex(graph: EvangelionGraph): Map<string, GraphNode> {
  return new Map(graph.nodes.map((n) => [n.id, n]));
}

/**
 * Uniform color for every Magi node --- the visual punchline of the
 * "3-in-1" joke. Chosen to match the --color-magi-green token used in
 * the rest of the chrome.
 */
export const MAGI_UNIFORM_COLOR = "#5cf5b6";

/**
 * Uniform color for every Angel. AT-field crimson is the visual signature
 * shared by every angel encounter; basic seed paints them all the same.
 */
export const ANGEL_UNIFORM_COLOR = "#ff003c";

/**
 * Uniform color for every Event node. SEELE purple --- events tend to be
 * late-canon flashpoints (Third Impact, Instrumentality) that the show
 * frames through SEELE's scheming.
 */
export const EVENT_UNIFORM_COLOR = "#8a2be2";

/** Uniform color for every Organization node (NERV / SEELE / GEHIRN chrome). */
export const ORGANIZATION_UNIFORM_COLOR = "#c8102e";

/** Uniform color for every Location node (geofront blue --- "physical world"). */
export const LOCATION_UNIFORM_COLOR = "#62b8ff";

/** Uniform color for every Concept node (abstract pink). */
export const CONCEPT_UNIFORM_COLOR = "#ff6b8b";

/**
 * Uniform color for every Family node. Hard-coded --- families do NOT
 * inherit their color from a per-shortcode genesis primary. The visual
 * punchline is "this is a family roll-up, not a person", so every family
 * paints in the same lavender regardless of which surname it represents.
 */
export const FAMILY_UNIFORM_COLOR = "#c8a4ff";

/**
 * Edge / fallback color for EVA-related visuals (pilot springs, fallback if a
 * unit has no genesis entry). Individual EVA NODES use their per-unit primary
 * from the genesis registry so Unit-00 reads blue, Unit-01 purple, etc.
 */
export const EVA_UNIFORM_COLOR = "#ffae00";

/**
 * Pure white --- the audience node. The viewer-as-Lilim is the absence at
 * the centre of the graph; pure white reads as both "everything" and
 * "nothing" against the OLED-black background, which is the canonical
 * Tabris reading of humanity-as-Lilim.
 */
export const AUDIENCE_UNIFORM_COLOR = "#ffffff";

/** Per-edge-kind line colors. */
export const EDGE_COLORS: Record<EdgeKind, string> = {
  // Magi triangle inherits the same green as the magi nodes themselves --- the
  // edge is a continuation of the "3-in-1" body, not a separate visual class.
  magi_link: MAGI_UNIFORM_COLOR,
  angel_sequence: "#ff6c2a", // warm orange chain
  // SEELE purple for the late-show "X is really Y" identity reveals
  // (Toji <-> Bardiel, Kaworu <-> Tabris, Rei <-> Yui).
  identity_reveal: "#8a2be2",
  // Pilots edges share the EVA-orange so the pilot-to-unit pull reads as
  // one visual class regardless of which character is on which side.
  pilots: EVA_UNIFORM_COLOR,
  // Structural-blue lineage line: family membership reads as a structural
  // tie, not a dramatic reveal --- separate visual class from identity_reveal.
  member_of_family: "#3a8fff",
  // NERV-emblem deep red for org membership --- distinct from the brighter
  // "eliminated" alert red and the structural family blue.
  member_of_org: "#a8131e",
  // Geofront teal for spatial nesting --- LOCATION_UNIFORM_COLOR neighbor.
  located_in: "#3aaad3",
  // Causation tone: warm amber, distinct from both the angel-sequence orange
  // and the event-purple chrome, so cause/effect arcs read on their own.
  caused: "#e0b400",
  // Rose --- interpersonal bonds read as a warm, human class of their own,
  // distinct from the structural family blue (member_of_family ties to a
  // roll-up node, relationship ties two people).
  relationship: "#ff6fae",
  // Dusty indigo --- the psych-wound hubs read muted and melancholy, set
  // apart from the saturated identity-reveal purple.
  afflicts: "#7a6fc0",
  // Hot magenta --- an Angel's assault on a target. Aggressive but distinct
  // from the eva-kill `eliminated` red and the org-chrome NERV reds.
  attacked: "#e0218a",
  // Electric cyan --- the A.T. Field as a manifest energy barrier, distinct
  // from the muted geofront teal used for spatial nesting.
  manifests: "#25d0e0",
  // Plain gray --- generic links carry no canonical meaning, just "these
  // two nodes are related." Reads as background chrome behind the
  // semantically-loaded edge classes.
  generic: "#888888",
  // NERV-red alert tone --- the visual signature of an angel kill. Distinct
  // from the org-chrome NERV red and the AT-field angel red so the edge
  // reads as its own class against either endpoint.
  eliminated: "#ff2a3c",
};

export { EDGE_SPRING_LENGTH, EDGE_WEIGHT } from "./layoutTuning";

// ---------------------------------------------------------------------------
// Spoiler gate
// ---------------------------------------------------------------------------

/**
 * Mask palette. Black sphere, dim halo, dim label --- enough silhouette to
 * tell the user something is hidden there without revealing what.
 */
export const MASK_FILL_COLOR = "#000000";
export const MASK_HALO_COLOR = "#1a1a1a";
export const MASK_LABEL_COLOR = "#666666";

/** CustomEvent name dispatched whenever the gate broadcasts new progress. */
export const SPOILER_EVENT_NAME = "ngg-spoiler-progress-changed";

/**
 * Resolve a single revealedAt gate against the user's progress. An undefined
 * gate (the common case) is open-from-ep-1.
 *
 * EoE-gated entities ALSO unlock once the user has watched TV episode 25 or
 * later: the original TV finale (eps 25-26) covers the same Instrumentality
 * material that EoE re-renders, so anyone past ep 24 has already been spoiled
 * for the third-impact reveal.
 */
export function isVisible(
  gate: RevealedAt | undefined,
  progress: SpoilerProgress,
): boolean {
  if (!gate) return true;
  switch (gate.kind) {
    case "ep":
      return progress.episode >= gate.episode;
    case "eoe":
      return progress.eoe || progress.episode >= 25;
  }
}

export function isNodeMasked(
  node: GraphNode,
  progress: SpoilerProgress,
): boolean {
  return !isVisible(node.revealedAt, progress);
}

/**
 * An edge is masked when (a) its own gate fails OR (b) either endpoint is
 * masked. A half-revealed line --- visible endpoint to hidden endpoint ---
 * leaks information about the hidden node, so the renderer treats it the
 * same as a fully masked relationship.
 */
export function isEdgeMasked(
  edge: Edge,
  progress: SpoilerProgress,
  nodes: Map<string, GraphNode>,
): boolean {
  if (!isVisible(edge.revealedAt, progress)) return true;
  const from = nodes.get(edge.from);
  const to = nodes.get(edge.to);
  if (!from || !to) return true;
  return isNodeMasked(from, progress) || isNodeMasked(to, progress);
}

/**
 * Replace every non-whitespace character with U+2588 FULL BLOCK so the mask
 * preserves word boundaries and length without revealing letters. Spaces
 * and punctuation pass through.
 */
export function maskLabel(text: string): string {
  return text
    .split("")
    .map((c) => (/\s/.test(c) ? c : "█"))
    .join("");
}

/**
 * Human-readable description of a gate. Used in tooltips, readout panels,
 * and tests. An undefined gate is "open" (visible from Ep 1).
 */
export function gateLabel(gate: RevealedAt | undefined): string {
  if (!gate) return "open";
  switch (gate.kind) {
    case "ep":
      return `Ep. ${gate.episode}+`;
    case "eoe":
      return "End of Evangelion";
  }
}

/**
 * Parse a SpoilerProgress out of a JSON string, returning the default if the
 * string is missing or malformed. Used by the gate's localStorage read path
 * so a corrupt cookie doesn't blow up the renderer.
 *
 * Hard invariant: EoE implies the user finished Episode 26 --- EoE picks up
 * after the TV finale. When we encounter the impossible state (eoe=true with
 * ep<26) we lift the episode rather than dropping the EoE flag --- the safer
 * assumption is that the user really has been spoiled and we should not hide
 * content from them.
 */
export function normalizeSpoilerProgress(p: SpoilerProgress): SpoilerProgress {
  const episode = Math.max(0, Math.min(26, Math.floor(p.episode)));
  const eoe = p.eoe === true;
  return {
    episode: eoe && episode < 26 ? 26 : episode,
    eoe,
  };
}

export function parseSpoilerProgress(raw: string | null): SpoilerProgress {
  if (!raw) return { ...SPOILER_PROGRESS_DEFAULT };
  try {
    const obj = JSON.parse(raw) as unknown;
    if (!obj || typeof obj !== "object") return { ...SPOILER_PROGRESS_DEFAULT };
    const o = obj as Record<string, unknown>;
    const ep = typeof o.episode === "number" ? o.episode : 0;
    const eoe = o.eoe === true;
    return normalizeSpoilerProgress({ episode: ep, eoe });
  } catch {
    return { ...SPOILER_PROGRESS_DEFAULT };
  }
}

/** Build adjacency: nodeId -> edges that touch it (either direction). */
export function adjacency(graph: EvangelionGraph): Map<string, Edge[]> {
  const adj = new Map<string, Edge[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adj.get(edge.from)?.push(edge);
    if (edge.from !== edge.to) {
      adj.get(edge.to)?.push(edge);
    }
  }
  return adj;
}

function validateRevealedAt(loc: string, gate: RevealedAt | undefined): void {
  if (!gate) return;
  switch (gate.kind) {
    case "ep":
      if (
        typeof gate.episode !== "number" ||
        !Number.isFinite(gate.episode) ||
        gate.episode < 1 ||
        gate.episode > 26
      ) {
        throw new Error(
          `${loc}: revealedAt.episode must be 1..26, got ${gate.episode}`,
        );
      }
      break;
    case "eoe":
      break;
    default: {
      const _exhaustive: never = gate;
      throw new Error(
        `${loc}: revealedAt has unknown kind ${JSON.stringify(_exhaustive)}`,
      );
    }
  }
}

/**
 * Compare two gates: returns -1 if a is strictly earlier (more permissive)
 * than b, 0 if they're equivalent, 1 if a is strictly later (more
 * restrictive). Used by the monotonicity invariant.
 *
 * Total order: undefined < ep1 < ep2 < ... < ep26 < eoe.
 *
 *   - undefined (open) reveals from Ep. 1 onward, the most permissive gate.
 *   - eoe unlocks at episode 25+ OR the eoe flag (effectively post-26).
 */
function gateRank(gate: RevealedAt | undefined): number {
  if (!gate) return 0;
  switch (gate.kind) {
    case "ep":
      return gate.episode;
    case "eoe":
      // EoE sits just after Ep. 26 in the canonical viewing order.
      return 27;
  }
}

/**
 * Endpoint-kind whitelist for typed edges. Each new edge kind that ties
 * a specific node-pair shape declares its allowed (from, to) sets here.
 * The validator throws when an edge violates the shape, catching e.g.
 * a `pilots` edge between two characters or a `member_of_org` edge with
 * an angel as the from-node.
 */
const EDGE_ENDPOINT_SHAPES: Partial<
  Record<
    EdgeKind,
    {
      from: ReadonlyArray<NodeKind>;
      to: ReadonlyArray<NodeKind>;
      // Allow either direction (the graph is undirected for layout, so a
      // few edges are authored in the "natural language" direction even
      // though the validator could see them flipped).
      symmetric?: boolean;
    }
  >
> = {
  magi_link: { from: ["magi"], to: ["magi"], symmetric: true },
  angel_sequence: { from: ["angel"], to: ["angel"], symmetric: true },
  pilots: { from: ["character"], to: ["eva"], symmetric: true },
  member_of_family: {
    from: ["character"],
    to: ["family"],
    symmetric: true,
  },
  member_of_org: {
    // Characters or EVA units (Mass Production line is org-affiliated)
    // can be members of an organization.
    from: ["character", "eva"],
    to: ["organization"],
    symmetric: true,
  },
  located_in: {
    // Spatial nesting: location -> location, OR a thing-with-physical-
    // -presence (angel, eva, concept-with-physical-form like the Moons,
    // org with HQ) -> location. Keep the from-side broad; tighten if a
    // specific bug shows up.
    from: ["location", "angel", "eva", "concept", "organization"],
    to: ["location"],
    symmetric: false,
  },
  caused: {
    // A cause -> an event or a concept-as-effect. The from-side is
    // intentionally broad (an angel, an org, a location, even another
    // event can be a cause); the to-side must be event or concept so
    // the edge expresses cause-to-effect, not effect-to-cause.
    from: [
      "angel",
      "eva",
      "organization",
      "location",
      "concept",
      "event",
      "character",
    ],
    to: ["event", "concept"],
    symmetric: false,
  },
  eliminated: {
    // EVA -> angel. The Israfel double-attribution and Sahaquiel team-up
    // are encoded as separate edges, each EVA -> angel.
    from: ["eva"],
    to: ["angel"],
    symmetric: false,
  },
  identity_reveal: {
    // Late-show "X is really Y" reveals. Canon cases:
    //   Toji <-> Bardiel       (character <-> angel)
    //   Kaworu <-> Tabris      (character <-> angel)
    //   Rei <-> Yui            (character <-> character)
    //   Yui <-> Unit-01        (character <-> eva, Ep. 20)
    //   Magi-X <-> Naoko       (magi    <-> character, Ep. 13)
    //   You <-> Lilim          (audience <-> angel, EoE)
    // Both sides span character / angel / eva / magi / audience --- the
    // shape captures the dramatic "this entity is really a fragment of
    // that entity" pattern across the canonical reveal beats.
    from: ["character", "angel", "eva", "magi", "audience"],
    to: ["character", "angel", "eva", "magi", "audience"],
    symmetric: true,
  },
  relationship: {
    // Interpersonal bond between two cast members. Symmetric --- authored
    // in whichever "natural language" direction reads best.
    from: ["character"],
    to: ["character"],
    symmetric: true,
  },
  afflicts: {
    // A psych-wound concept (trauma, rejection, abandonment, hedgehog's
    // dilemma, depression) weighing on a character.
    from: ["concept"],
    to: ["character"],
    symmetric: false,
  },
  attacked: {
    // An Angel's assault on a site, a unit, or a pilot. The inbound
    // complement of `eliminated` (eva -> angel); directed angel -> target.
    from: ["angel"],
    to: ["location", "eva", "character"],
    symmetric: false,
  },
  manifests: {
    // An entity projecting an A.T. Field (concept_at_field -> the Angel /
    // Evangelion / human that manifests one). Directed concept -> bearer.
    from: ["concept"],
    to: ["eva", "angel", "character"],
    symmetric: false,
  },
  // generic intentionally absent --- no shape constraint, that's the
  // point of generic.
};

/**
 * Validate graph integrity. Throws on first failure with a descriptive message.
 *
 * Now also enforces:
 *   - Every node has a non-empty shortcodes array.
 *   - Every shortcode referenced by a node resolves in the genesis registry.
 *   - The genesis registry itself passes its own invariants
 *     (validateGenesis()).
 *   - Every revealedAt gate has a recognized kind and a positive episode (ep gates).
 *
 * Note: orphan-node check is intentionally NOT enforced. Some nodes (events
 * like Third Impact) are deliberately disconnected.
 */
export function validateGraph(graph: EvangelionGraph): void {
  if (!graph.id || !graph.title) {
    throw new Error("Graph missing id or title");
  }

  // The genesis registry must be self-consistent before we trust references.
  assertGenesisValid();

  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (ids.has(node.id)) {
      throw new Error(`Duplicate node id: ${node.id}`);
    }
    ids.add(node.id);

    if (typeof node.displayName !== "string" || node.displayName.trim() === "") {
      throw new Error(`Node ${node.id} must declare a non-empty displayName`);
    }

    // Family nodes always render as "Surname (Family)" so the label /
    // readout never reads as a person. Locations always render as
    // "Place (Location)" for the same reason.
    if (isFamily(node) && !/\(Family\)\s*$/.test(node.displayName)) {
      throw new Error(
        `Family node ${node.id} displayName must end with "(Family)" --- got "${node.displayName}"`,
      );
    }
    if (isLocation(node) && !/\(Location\)/.test(node.displayName)) {
      throw new Error(
        `Location node ${node.id} displayName must contain "(Location)" --- got "${node.displayName}"`,
      );
    }

    if (!Array.isArray(node.shortcodes) || node.shortcodes.length === 0) {
      throw new Error(
        `Node ${node.id} must declare at least one genesis shortcode`,
      );
    }
    if (node.shortcodes.length !== 1) {
      throw new Error(
        `Node ${node.id} must declare exactly one genesis shortcode (got ${node.shortcodes.length}: ${node.shortcodes.join(", ")})`,
      );
    }
    for (const code of node.shortcodes) {
      if (!isShortcode(code)) {
        throw new Error(
          `Node ${node.id} references unknown shortcode "${code}"`,
        );
      }
    }
    validateRevealedAt(`Node ${node.id}`, node.revealedAt);

    // Citation invariant: a gated node must declare its source. Same
    // shape as the edge invariant below.
    if (node.revealedAt !== undefined) {
      if (
        node.revealedAtSource === undefined ||
        node.revealedAtSource.trim().length === 0
      ) {
        throw new Error(
          `Node ${node.id} has revealedAt without revealedAtSource --- every gate must cite its source (wiki URL or "Inherits ..." reference)`,
        );
      }
    }

    if (node.tags !== undefined) {
      if (!Array.isArray(node.tags)) {
        throw new Error(`Node ${node.id} tags must be an array`);
      }
      const seenTags = new Set<TagId>();
      for (const tag of node.tags) {
        if (!tag || typeof tag.id !== "string") {
          throw new Error(`Node ${node.id} has a malformed tag entry`);
        }
        if (!isTagId(tag.id)) {
          throw new Error(
            `Node ${node.id} carries unknown tag id "${tag.id}"`,
          );
        }
        if (seenTags.has(tag.id)) {
          throw new Error(
            `Node ${node.id} carries duplicate tag "${tag.id}"`,
          );
        }
        seenTags.add(tag.id);
        validateRevealedAt(`Node ${node.id} tag ${tag.id}`, tag.revealedAt);

        // Tags with a canonicalGate in the registry must be stamped
        // consistently across every node --- this is what makes the
        // "always-EoE" invariant for dies-by-end-of-series testable.
        const def = TAGS[tag.id];
        if (def.canonicalGate) {
          const stamped = JSON.stringify(tag.revealedAt ?? null);
          const expected = JSON.stringify(def.canonicalGate);
          if (stamped !== expected) {
            throw new Error(
              `Node ${node.id} tag "${tag.id}" must use canonical gate ${expected} --- got ${stamped}`,
            );
          }
        }
      }
    }
  }

  // Build a node-id -> node lookup for the per-edge shape and gate-monotonicity
  // checks below.
  const nodeById = new Map<string, GraphNode>();
  for (const node of graph.nodes) {
    nodeById.set(node.id, node);
  }

  for (const edge of graph.edges) {
    if (!ids.has(edge.from)) {
      throw new Error(
        `Edge references unknown 'from' node: ${edge.from} -> ${edge.to}`,
      );
    }
    if (!ids.has(edge.to)) {
      throw new Error(
        `Edge references unknown 'to' node: ${edge.from} -> ${edge.to}`,
      );
    }
    if (edge.from === edge.to) {
      throw new Error(`Self-loop edge on ${edge.from}`);
    }
    if (edge.shortcodes) {
      for (const code of edge.shortcodes) {
        if (!isShortcode(code)) {
          throw new Error(
            `Edge ${edge.from} -> ${edge.to} references unknown shortcode "${code}"`,
          );
        }
      }
    }
    validateRevealedAt(`Edge ${edge.from} -> ${edge.to}`, edge.revealedAt);

    // Endpoint-kind shape: a typed edge declares which node kinds may
    // sit on each side. A misuse (e.g. a pilots edge between two
    // angels) is a data bug, not a layout choice.
    const shape = EDGE_ENDPOINT_SHAPES[edge.kind];
    if (shape) {
      const from = nodeById.get(edge.from)!;
      const to = nodeById.get(edge.to)!;
      const fromKind = from.kind;
      const toKind = to.kind;
      const ok = (() => {
        const direct =
          shape.from.includes(fromKind) && shape.to.includes(toKind);
        if (direct) return true;
        if (shape.symmetric) {
          return (
            shape.from.includes(toKind) && shape.to.includes(fromKind)
          );
        }
        return false;
      })();
      if (!ok) {
        throw new Error(
          `Edge ${edge.from} (${fromKind}) -> ${edge.to} (${toKind}) of kind "${edge.kind}" violates endpoint shape: expected ${shape.symmetric ? "{" + shape.from.join("|") + "} <-> {" + shape.to.join("|") + "}" : "{" + shape.from.join("|") + "} -> {" + shape.to.join("|") + "}"}`,
        );
      }
    }

    // Spoiler-gate monotonicity: an edge's gate cannot be strictly more
    // permissive than either endpoint's gate. If Lilith reveals at Ep.
    // 23, an edge touching Lilith cannot reveal at Ep. 5 --- the user
    // would see the line connecting "<MASKED>" to its other endpoint
    // long before they know what Lilith is. Endpoint masking already
    // hides such an edge in the renderer, but the data is logically
    // inconsistent and almost certainly indicates an authoring bug.
    const fromNode = nodeById.get(edge.from)!;
    const toNode = nodeById.get(edge.to)!;
    const edgeRank = gateRank(edge.revealedAt);
    const fromRank = gateRank(fromNode.revealedAt);
    const toRank = gateRank(toNode.revealedAt);
    const endpointRank = Math.max(fromRank, toRank);
    if (edge.revealedAt !== undefined && edgeRank < endpointRank) {
      throw new Error(
        `Edge ${edge.from} -> ${edge.to} (kind=${edge.kind}) gate is more permissive than its endpoints: edge=${JSON.stringify(edge.revealedAt)} (rank ${edgeRank}) but endpoint rank ${endpointRank} (from=${JSON.stringify(fromNode.revealedAt) || "open"}, to=${JSON.stringify(toNode.revealedAt) || "open"})`,
      );
    }

    // Citation invariant: every gated edge must declare a source. The
    // source can be a wiki URL, an "Inherits X gate" string, or any
    // free-text reference --- it just has to be non-empty so we know
    // a human checked it.
    if (edge.revealedAt !== undefined) {
      if (
        edge.revealedAtSource === undefined ||
        edge.revealedAtSource.trim().length === 0
      ) {
        throw new Error(
          `Edge ${edge.from} -> ${edge.to} (kind=${edge.kind}) has revealedAt without revealedAtSource --- every gate must cite its source`,
        );
      }
    }
  }

  // No duplicate edges: same (from, to, kind) cannot appear twice. The
  // graph is undirected for layout purposes, so (A->B, kind=K) and
  // (B->A, kind=K) also count as duplicates --- only one direction needed.
  const edgeKey = (a: string, b: string, kind: string): string => {
    const [lo, hi] = a < b ? [a, b] : [b, a];
    return `${lo}|${hi}|${kind}`;
  };
  const seenEdges = new Set<string>();
  for (const edge of graph.edges) {
    const key = edgeKey(edge.from, edge.to, edge.kind);
    if (seenEdges.has(key)) {
      throw new Error(
        `Duplicate edge: ${edge.from} <-> ${edge.to} (kind=${edge.kind})`,
      );
    }
    seenEdges.add(key);
  }

  // Family invariant: every family node must collect at least 2 members
  // (otherwise it's not really a family --- it's a one-person lineage).
  // Members are connected via member_of_family edges in either direction.
  const familyMemberCount = new Map<string, number>();
  for (const node of graph.nodes) {
    if (isFamily(node)) familyMemberCount.set(node.id, 0);
  }
  for (const edge of graph.edges) {
    if (edge.kind !== "member_of_family") continue;
    if (familyMemberCount.has(edge.from)) {
      familyMemberCount.set(edge.from, familyMemberCount.get(edge.from)! + 1);
    }
    if (familyMemberCount.has(edge.to)) {
      familyMemberCount.set(edge.to, familyMemberCount.get(edge.to)! + 1);
    }
  }
  for (const [familyId, count] of familyMemberCount) {
    if (count < 2) {
      throw new Error(
        `Family node ${familyId} must have at least 2 member_of_family edges --- got ${count}`,
      );
    }
  }

  // Angels must have unique sequential numbers 1..N (canonical NGE order).
  const angelNumbers = graph.nodes
    .filter(isAngel)
    .map((a) => a.number)
    .sort((a, b) => a - b);
  for (let i = 0; i < angelNumbers.length; i++) {
    if (angelNumbers[i] !== i + 1) {
      throw new Error(
        `Angel numbers must be a contiguous 1..N sequence; got ${angelNumbers.join(",")}`,
      );
    }
  }
}

/**
 * Combined validation result --- registry + graph in one shot. The precommit
 * hook calls this so a single command surfaces every invariant.
 */
export function validateAll(graph: EvangelionGraph): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const reg = validateGenesis();
  errors.push(...reg.errors);
  try {
    validateGraph(graph);
  } catch (err) {
    errors.push((err as Error).message);
  }
  return { ok: errors.length === 0, errors };
}

/** Pick a node radius. Characters are largest, magi smallest (so the triad reads tight). */
export function nodeRadius(node: GraphNode): number {
  if (isCharacter(node)) return 0.6;
  if (isAngel(node)) return 0.55;
  if (isEvent(node)) return 0.65; // events read as the heaviest singletons
  if (isOrganization(node)) return 0.65; // structural anchors
  if (isLocation(node)) return 0.55;
  if (isConcept(node)) return 0.5;
  if (isEva(node)) return 0.6; // EVA units sit beside their pilots
  if (isFamily(node)) return 0.65; // families are roll-up anchors
  if (isAudience(node)) return 0.7; // YOU sits a touch larger than any character
  return 0.42; // magi
}

/**
 * Resolve a node's render color. Characters and EVA units pull from their
 * primary shortcode in the genesis registry (so each unit paints with its
 * canon body color --- Unit-00 blue, Unit-01 purple, etc.). Every other
 * kind --- including FAMILY --- paints with a per-kind uniform (the visual
 * punchline of node type: all magi green, all angels NERV-red, all
 * families lavender). Family color is intentionally NOT derived from the
 * shortcode so Ikari/Akagi/etc. all read as the same "family" visual class.
 */
export function colorFor(node: GraphNode): string {
  if (isMagi(node)) return MAGI_UNIFORM_COLOR;
  if (isAngel(node)) return ANGEL_UNIFORM_COLOR;
  if (isEvent(node)) return EVENT_UNIFORM_COLOR;
  if (isOrganization(node)) return ORGANIZATION_UNIFORM_COLOR;
  if (isLocation(node)) return LOCATION_UNIFORM_COLOR;
  if (isConcept(node)) return CONCEPT_UNIFORM_COLOR;
  if (isFamily(node)) return FAMILY_UNIFORM_COLOR;
  if (isAudience(node)) return AUDIENCE_UNIFORM_COLOR;
  // character / eva: look up genesis by primary shortcode (the first entry).
  const primaryCode = node.shortcodes[0];
  if (!primaryCode) {
    if (isEva(node)) return EVA_UNIFORM_COLOR;
    return "#cccccc";
  }
  return colorOf(primaryCode);
}
