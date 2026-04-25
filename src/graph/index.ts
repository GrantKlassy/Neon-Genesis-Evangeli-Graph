import type {
  AngelNode,
  CharacterNode,
  Edge,
  EdgeKind,
  EvangelionGraph,
  GraphNode,
  MagiNode,
  NodeKind,
  SpoilerLevel,
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
  Edge,
  EdgeKind,
  EvangelionGraph,
  GraphNode,
  MagiNode,
  NodeKind,
  SpoilerLevel,
};

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

/** Per-edge-kind line colors. */
export const EDGE_COLORS: Record<EdgeKind, string> = {
  // Magi triangle inherits the same green as the magi nodes themselves --- the
  // edge is a continuation of the "3-in-1" body, not a separate visual class.
  magi_link: MAGI_UNIFORM_COLOR,
  angel_sequence: "#ff6c2a", // warm orange chain
};

export { EDGE_SPRING_LENGTH, EDGE_WEIGHT } from "./layoutTuning";

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

/**
 * Validate graph integrity. Throws on first failure with a descriptive message.
 *
 * Now also enforces:
 *   - Every node has a non-empty shortcodes array.
 *   - Every shortcode referenced by a node resolves in the genesis registry.
 *   - The genesis registry itself passes its own invariants
 *     (validateGenesis()).
 *
 * Note: orphan-node check is intentionally NOT enforced. Characters do not
 * yet carry edges in the basic seed, and that is deliberate --- relationship
 * layers (pilot/EVA, spoiler-gated angel/character mappings, ...) come later.
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
  return 0.42; // magi
}

/**
 * Resolve a node's render color. Characters use their primary shortcode's
 * color from the genesis registry; angels share the AT-field uniform; magi
 * share the green uniform (3-in-1 joke).
 */
export function colorFor(node: GraphNode): string {
  if (isMagi(node)) return MAGI_UNIFORM_COLOR;
  if (isAngel(node)) return ANGEL_UNIFORM_COLOR;
  // character: look up genesis by primary shortcode (the first entry).
  const primaryCode = node.shortcodes[0];
  if (!primaryCode) return "#cccccc";
  return colorOf(primaryCode);
}
