import type {
  AccountNode,
  Cluster,
  CommunityNode,
  Edge,
  EdgeKind,
  GraphNode,
  InvestigationGraph,
} from "./types";

export type {
  AccountNode,
  Cluster,
  CommunityNode,
  Edge,
  EdgeKind,
  GraphNode,
  InvestigationGraph,
};

export { wordword4numbers } from "./wordword4numbers";

export function isAccount(node: GraphNode): node is AccountNode {
  return node.kind === "account";
}

export function isCommunity(node: GraphNode): node is CommunityNode {
  return node.kind === "community";
}

export function nodeIndex(graph: InvestigationGraph): Map<string, GraphNode> {
  return new Map(graph.nodes.map((n) => [n.id, n]));
}

/** Color tokens for cluster classification. NERV/Magi-inspired. */
export const CLUSTER_COLORS: Record<Cluster, string> = {
  CL1_hidden_profiles: "#8a2be2", // SEELE purple --- privacy/hidden
  CL1b_activity_compression: "#ffae00", // EVA-01 yellow/orange --- anomaly
  CL2_late_night_pair: "#ff2a3c", // NERV red --- highest concern (sync pair)
  CL3_apr13_burst: "#ff8800", // burst orange
  CL4_normal_users: "#5cf5b6", // Magi green --- normal
  CL_unassigned: "#888888",
};

/** Color tokens for edge kinds. */
export const EDGE_COLORS: Record<EdgeKind, string> = {
  posts_in: "#3a8fff", // blue --- structural membership
  comments_in: "#62b8ff", // light blue
  comments_on_post: "#ff6c2a", // orange --- direct human interaction
  temporal_proximity: "#ff2a3c", // red --- sync signal (most suspicious)
};

export const COMMUNITY_COLOR = "#c9c9c9";

/** Build adjacency: nodeId -> edges that touch it (either direction). */
export function adjacency(graph: InvestigationGraph): Map<string, Edge[]> {
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
 * Used by tests and (optionally) by the renderer to fail fast.
 */
export function validateGraph(graph: InvestigationGraph): void {
  if (!graph.id || !graph.title) {
    throw new Error("Graph missing id or title");
  }

  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (ids.has(node.id)) {
      throw new Error(`Duplicate node id: ${node.id}`);
    }
    ids.add(node.id);
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
    if (edge.kind === "temporal_proximity" && edge.deltaMinutes === null) {
      throw new Error(
        `temporal_proximity edge ${edge.from} -> ${edge.to} missing deltaMinutes`,
      );
    }
  }

  // Every node should be touched by at least one edge.
  const adj = adjacency(graph);
  for (const node of graph.nodes) {
    const edges = adj.get(node.id);
    if (!edges || edges.length === 0) {
      throw new Error(`Orphan node has no edges: ${node.id} (${node.kind})`);
    }
  }
}

/** Pick a node radius based on log-karma for accounts; fixed for communities. */
export function nodeRadius(node: GraphNode): number {
  if (node.kind === "community") {
    return 0.55;
  }
  // log10(karma+10) / 6 maps roughly: 100 -> 0.34, 1k -> 0.50, 10k -> 0.67, 100k -> 0.83, 500k -> ~0.95
  const lk = Math.log10(Math.max(10, node.karma) + 10);
  return Math.min(1.0, Math.max(0.25, lk / 6));
}

export function colorFor(node: GraphNode): string {
  if (node.kind === "community") {
    return COMMUNITY_COLOR;
  }
  return CLUSTER_COLORS[node.cluster];
}
