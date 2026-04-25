import { describe, expect, it } from "vitest";
import {
  CLUSTER_COLORS,
  EDGE_COLORS,
  adjacency,
  colorFor,
  isAccount,
  isCommunity,
  nodeIndex,
  nodeRadius,
  validateGraph,
  wordword4numbers,
} from "../../src/graph";
import type { Edge } from "../../src/graph/types";

describe("wordword4numbers graph", () => {
  it("validates without throwing", () => {
    expect(() => validateGraph(wordword4numbers)).not.toThrow();
  });

  it("has the expected node and edge counts from GRAPH.md", () => {
    expect(wordword4numbers.id).toBe("wordword4numbers");
    expect(wordword4numbers.nodes.filter(isAccount)).toHaveLength(8);
    expect(wordword4numbers.nodes.filter(isCommunity)).toHaveLength(6);
    expect(wordword4numbers.nodes).toHaveLength(14);
    // ~30 edges across the three relation types --- be defensive about
    // exact count but require a sensible minimum so deletions are caught.
    expect(wordword4numbers.edges.length).toBeGreaterThanOrEqual(30);
  });

  it("uses unique node ids", () => {
    const ids = wordword4numbers.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every edge resolves to known nodes", () => {
    const idx = nodeIndex(wordword4numbers);
    for (const edge of wordword4numbers.edges) {
      expect(idx.has(edge.from)).toBe(true);
      expect(idx.has(edge.to)).toBe(true);
    }
  });

  it("has no self-loops", () => {
    for (const edge of wordword4numbers.edges) {
      expect(edge.from).not.toBe(edge.to);
    }
  });

  it("temporal_proximity edges carry deltaMinutes", () => {
    const proximity: Edge[] = wordword4numbers.edges.filter(
      (e) => e.kind === "temporal_proximity",
    );
    expect(proximity.length).toBeGreaterThan(0);
    for (const e of proximity) {
      expect(typeof e.deltaMinutes).toBe("number");
      // Per GRAPH.md only sub-3-min sync events are flagged.
      expect(e.deltaMinutes).toBeGreaterThanOrEqual(0);
      expect(e.deltaMinutes).toBeLessThanOrEqual(3);
    }
  });

  it("posts_in / comments_in edges always go account -> community", () => {
    const idx = nodeIndex(wordword4numbers);
    for (const e of wordword4numbers.edges) {
      if (e.kind === "posts_in" || e.kind === "comments_in") {
        expect(idx.get(e.from)?.kind).toBe("account");
        expect(idx.get(e.to)?.kind).toBe("community");
      }
    }
  });

  it("comments_on_post edges always go account -> account", () => {
    const idx = nodeIndex(wordword4numbers);
    for (const e of wordword4numbers.edges) {
      if (e.kind === "comments_on_post") {
        expect(idx.get(e.from)?.kind).toBe("account");
        expect(idx.get(e.to)?.kind).toBe("account");
      }
    }
  });

  it("every account is in C1 (NeonGenesisEvangelion)", () => {
    const accounts = wordword4numbers.nodes.filter(isAccount);
    const inC1 = new Set(
      wordword4numbers.edges.filter((e) => e.to === "C1").map((e) => e.from),
    );
    for (const a of accounts) {
      expect(inC1.has(a.id)).toBe(true);
    }
  });

  it("no orphan nodes (adjacency)", () => {
    const adj = adjacency(wordword4numbers);
    for (const node of wordword4numbers.nodes) {
      const edges = adj.get(node.id);
      expect(
        edges,
        `node ${node.id} should have adjacency entry`,
      ).toBeDefined();
      expect(
        edges!.length,
        `node ${node.id} (${node.kind}) is orphaned`,
      ).toBeGreaterThan(0);
    }
  });

  it("clusters resolve to a defined color", () => {
    for (const node of wordword4numbers.nodes) {
      if (!isAccount(node)) continue;
      const c = CLUSTER_COLORS[node.cluster];
      expect(c, `cluster ${node.cluster} is missing a color`).toMatch(
        /^#[0-9a-fA-F]{6}$/,
      );
    }
  });

  it("colorFor returns hex for every node", () => {
    for (const node of wordword4numbers.nodes) {
      expect(colorFor(node)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("EDGE_COLORS cover every edge kind in use", () => {
    const kinds = new Set(wordword4numbers.edges.map((e) => e.kind));
    for (const k of kinds) {
      expect(EDGE_COLORS[k]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("nodeRadius is bounded and grows with karma", () => {
    const accounts = wordword4numbers.nodes.filter(isAccount);
    for (const a of accounts) {
      const r = nodeRadius(a);
      expect(r).toBeGreaterThanOrEqual(0.25);
      expect(r).toBeLessThanOrEqual(1.0);
    }
    // A6 (468K karma) should be larger than A5 (418 karma).
    const a5 = accounts.find((a) => a.id === "A5")!;
    const a6 = accounts.find((a) => a.id === "A6")!;
    expect(nodeRadius(a6)).toBeGreaterThan(nodeRadius(a5));
  });

  it("CL2_late_night_pair contains exactly A7 and A8", () => {
    const accounts = wordword4numbers.nodes.filter(isAccount);
    const cl2 = accounts.filter((a) => a.cluster === "CL2_late_night_pair");
    expect(cl2.map((a) => a.id).sort()).toEqual(["A7", "A8"]);
  });

  it("CL1_hidden_profiles contains exactly A3 and A4", () => {
    const accounts = wordword4numbers.nodes.filter(isAccount);
    const cl1 = accounts.filter((a) => a.cluster === "CL1_hidden_profiles");
    expect(cl1.map((a) => a.id).sort()).toEqual(["A3", "A4"]);
  });
});

describe("validateGraph throws for invalid inputs", () => {
  it("rejects unknown edge endpoints", () => {
    expect(() =>
      validateGraph({
        ...wordword4numbers,
        edges: [
          {
            from: "A1",
            to: "ZZZ",
            kind: "posts_in",
            deltaMinutes: null,
            timestamp: null,
            notes: "",
          },
        ],
      }),
    ).toThrow(/unknown 'to' node/);
  });

  it("rejects duplicate node ids", () => {
    const dup = wordword4numbers.nodes[0]!;
    expect(() =>
      validateGraph({
        ...wordword4numbers,
        nodes: [...wordword4numbers.nodes, dup],
      }),
    ).toThrow(/Duplicate node id/);
  });

  it("rejects orphan nodes", () => {
    expect(() =>
      validateGraph({
        ...wordword4numbers,
        nodes: [
          ...wordword4numbers.nodes,
          {
            id: "C99",
            kind: "community",
            name: "r/orphan",
            subscribers: 0,
            notes: "no edges",
          },
        ],
      }),
    ).toThrow(/Orphan node/);
  });

  it("rejects temporal_proximity without deltaMinutes", () => {
    expect(() =>
      validateGraph({
        ...wordword4numbers,
        edges: [
          ...wordword4numbers.edges,
          {
            from: "A1",
            to: "A2",
            kind: "temporal_proximity",
            deltaMinutes: null,
            timestamp: null,
            notes: "",
          },
        ],
      }),
    ).toThrow(/missing deltaMinutes/);
  });
});
