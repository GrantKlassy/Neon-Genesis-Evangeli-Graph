import type {
  AngelNode,
  CharacterNode,
  ConceptNode,
  Edge,
  EdgeKind,
  EvaNode,
  EvangelionGraph,
  EventNode,
  GraphNode,
  LocationNode,
  MagiNode,
  NodeKind,
  OrganizationNode,
  RevealedAt,
  SpoilerProgress,
} from "./types";
import {
  SPOILER_PROGRESS_DEFAULT,
  SPOILER_PROGRESS_FULL,
} from "./types";
import {
  assertGenesisValid,
  colorOf,
  isShortcode,
  validateGenesis,
} from "../genesis";

export type {
  AngelNode,
  CharacterNode,
  ConceptNode,
  Edge,
  EdgeKind,
  EvaNode,
  EvangelionGraph,
  EventNode,
  GraphNode,
  LocationNode,
  MagiNode,
  NodeKind,
  OrganizationNode,
  RevealedAt,
  SpoilerProgress,
};
export { SPOILER_PROGRESS_DEFAULT, SPOILER_PROGRESS_FULL };

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

/** Uniform color for every Organization node (NERV / SEELE / WILLE chrome). */
export const ORGANIZATION_UNIFORM_COLOR = "#c8102e";

/** Uniform color for every Location node (geofront blue --- "physical world"). */
export const LOCATION_UNIFORM_COLOR = "#62b8ff";

/** Uniform color for every Concept node (abstract pink). */
export const CONCEPT_UNIFORM_COLOR = "#ff6b8b";

/** Uniform color for every EVA Unit (eva-orange). */
export const EVA_UNIFORM_COLOR = "#ffae00";

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

/** localStorage key for the user's declared spoiler progress. */
export const SPOILER_STORAGE_KEY = "ngg-spoiler-progress";

/** CustomEvent name dispatched whenever the gate writes new progress. */
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
    case "rebuild":
      return progress.rebuild;
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
    case "rebuild":
      return "Rebuild films";
  }
}

/**
 * Parse a SpoilerProgress out of a JSON string, returning the default if the
 * string is missing or malformed. Used by the gate's localStorage read path
 * so a corrupt cookie doesn't blow up the renderer.
 *
 * Hard invariant: a stored EoE flag implies the user finished Episode 26.
 * EoE picks up after the events of Ep 26 (the original TV finale covers the
 * same Instrumentality territory abstractly), so claiming "watched EoE" with
 * episode < 26 is an impossible state. We force episode to 26 in that case
 * rather than dropping the EoE flag --- the safer assumption is that the user
 * really has been spoiled, and we should not hide content from them.
 */
export function normalizeSpoilerProgress(p: SpoilerProgress): SpoilerProgress {
  const episode = Math.max(0, Math.min(26, Math.floor(p.episode)));
  const eoe = p.eoe === true;
  const rebuild = p.rebuild === true;
  return {
    episode: eoe && episode < 26 ? 26 : episode,
    eoe,
    rebuild,
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
    const rebuild = o.rebuild === true;
    return normalizeSpoilerProgress({ episode: ep, eoe, rebuild });
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
        gate.episode < 1
      ) {
        throw new Error(
          `${loc}: revealedAt.episode must be a positive number, got ${gate.episode}`,
        );
      }
      break;
    case "eoe":
    case "rebuild":
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

    if (!Array.isArray(node.shortcodes) || node.shortcodes.length === 0) {
      throw new Error(
        `Node ${node.id} must declare at least one genesis shortcode`,
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
  return 0.42; // magi
}

/**
 * Resolve a node's render color. Characters use their primary shortcode's
 * color from the genesis registry; everything else paints with a per-kind
 * uniform (the visual punchline of node type, e.g. all magi green).
 */
export function colorFor(node: GraphNode): string {
  if (isMagi(node)) return MAGI_UNIFORM_COLOR;
  if (isAngel(node)) return ANGEL_UNIFORM_COLOR;
  if (isEvent(node)) return EVENT_UNIFORM_COLOR;
  if (isOrganization(node)) return ORGANIZATION_UNIFORM_COLOR;
  if (isLocation(node)) return LOCATION_UNIFORM_COLOR;
  if (isConcept(node)) return CONCEPT_UNIFORM_COLOR;
  if (isEva(node)) return EVA_UNIFORM_COLOR;
  // character: look up genesis by primary shortcode (the first entry).
  const primaryCode = node.shortcodes[0];
  if (!primaryCode) return "#cccccc";
  return colorOf(primaryCode);
}
