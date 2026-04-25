/**
 * Graph schema. Source of truth for types used across data, rendering, and tests.
 */

export type NodeKind = "account" | "community";

export type Cluster =
  | "CL1_hidden_profiles"
  | "CL1b_activity_compression"
  | "CL2_late_night_pair"
  | "CL3_apr13_burst"
  | "CL4_normal_users"
  | "CL_unassigned";

export type EdgeKind =
  | "posts_in"
  | "comments_in"
  | "comments_on_post"
  | "temporal_proximity";

export type UsernamePattern =
  | "Word_Word_NNNN"
  | "WordWordNNNN"
  | "Word-Word-NNNN"
  | "Word-Word-NN";

export interface AccountNode {
  id: string;
  kind: "account";
  username: string;
  pattern: UsernamePattern;
  created: string;
  karma: number;
  linkKarma: number;
  commentKarma: number;
  isMod: boolean;
  language: "English" | "Spanish";
  peakUtc: string;
  removalRatePct: number | null;
  cluster: Cluster;
  notes: string;
}

export interface CommunityNode {
  id: string;
  kind: "community";
  name: string;
  subscribers: number | null;
  notes: string;
}

export type GraphNode = AccountNode | CommunityNode;

export interface Edge {
  from: string;
  to: string;
  kind: EdgeKind;
  /** For temporal_proximity: minute delta between two events. Otherwise null. */
  deltaMinutes: number | null;
  /** ISO date or freeform timestamp string. */
  timestamp: string | null;
  notes: string;
}

export interface InvestigationGraph {
  id: string;
  title: string;
  source: string;
  nodes: GraphNode[];
  edges: Edge[];
}
