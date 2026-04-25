import { describe, expect, it } from "vitest";
import { forceLayout3D } from "../../src/lib/forceLayout";
import { wordword4numbers } from "../../src/graph";
import type { Edge, GraphNode } from "../../src/graph/types";

describe("forceLayout3D", () => {
  it("places every node and produces finite coordinates", () => {
    const { positions } = forceLayout3D(
      wordword4numbers.nodes,
      wordword4numbers.edges,
      { iterations: 80 },
    );
    expect(positions.size).toBe(wordword4numbers.nodes.length);
    for (const [id, p] of positions) {
      expect(Number.isFinite(p.x), `${id}.x finite`).toBe(true);
      expect(Number.isFinite(p.y), `${id}.y finite`).toBe(true);
      expect(Number.isFinite(p.z), `${id}.z finite`).toBe(true);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = forceLayout3D(wordword4numbers.nodes, wordword4numbers.edges, {
      iterations: 60,
      seed: 42,
    });
    const b = forceLayout3D(wordword4numbers.nodes, wordword4numbers.edges, {
      iterations: 60,
      seed: 42,
    });
    for (const id of a.positions.keys()) {
      expect(a.positions.get(id)).toEqual(b.positions.get(id));
    }
  });

  it("differs for different seeds", () => {
    const a = forceLayout3D(wordword4numbers.nodes, wordword4numbers.edges, {
      iterations: 60,
      seed: 1,
    });
    const b = forceLayout3D(wordword4numbers.nodes, wordword4numbers.edges, {
      iterations: 60,
      seed: 2,
    });
    let totalDiff = 0;
    for (const id of a.positions.keys()) {
      const pa = a.positions.get(id)!;
      const pb = b.positions.get(id)!;
      totalDiff +=
        Math.abs(pa.x - pb.x) + Math.abs(pa.y - pb.y) + Math.abs(pa.z - pb.z);
    }
    expect(totalDiff).toBeGreaterThan(1);
  });

  it("centers on origin (centroid near zero)", () => {
    const { positions } = forceLayout3D(
      wordword4numbers.nodes,
      wordword4numbers.edges,
      { iterations: 200 },
    );
    let cx = 0,
      cy = 0,
      cz = 0;
    for (const p of positions.values()) {
      cx += p.x;
      cy += p.y;
      cz += p.z;
    }
    const n = positions.size;
    cx /= n;
    cy /= n;
    cz /= n;
    expect(Math.abs(cx)).toBeLessThan(0.01);
    expect(Math.abs(cy)).toBeLessThan(0.01);
    expect(Math.abs(cz)).toBeLessThan(0.01);
  });

  it("keeps connected nodes closer than disconnected ones (on average)", () => {
    const { positions } = forceLayout3D(
      wordword4numbers.nodes,
      wordword4numbers.edges,
      { iterations: 400 },
    );
    const dist = (a: string, b: string) => {
      const pa = positions.get(a)!;
      const pb = positions.get(b)!;
      return Math.sqrt(
        (pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2 + (pa.z - pb.z) ** 2,
      );
    };
    const edgePairs = new Set<string>();
    for (const e of wordword4numbers.edges) {
      const k = e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`;
      edgePairs.add(k);
    }
    const ids = wordword4numbers.nodes.map((n) => n.id);
    let connSum = 0,
      connN = 0;
    let discSum = 0,
      discN = 0;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i]!;
        const b = ids[j]!;
        const k = a < b ? `${a}|${b}` : `${b}|${a}`;
        const d = dist(a, b);
        if (edgePairs.has(k)) {
          connSum += d;
          connN += 1;
        } else {
          discSum += d;
          discN += 1;
        }
      }
    }
    expect(connN).toBeGreaterThan(0);
    expect(discN).toBeGreaterThan(0);
    const connectedAvg = connSum / connN;
    const disconnectedAvg = discSum / discN;
    expect(connectedAvg).toBeLessThan(disconnectedAvg);
  });

  it("does not collapse all nodes onto one point (repulsion is active)", () => {
    const { positions } = forceLayout3D(
      wordword4numbers.nodes,
      wordword4numbers.edges,
      { iterations: 300 },
    );
    const all = [...positions.values()];
    let minDist = Infinity;
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const d = Math.sqrt(
          (all[i]!.x - all[j]!.x) ** 2 +
            (all[i]!.y - all[j]!.y) ** 2 +
            (all[i]!.z - all[j]!.z) ** 2,
        );
        if (d < minDist) minDist = d;
      }
    }
    expect(minDist).toBeGreaterThan(0.4);
  });

  it("handles the empty edge case gracefully", () => {
    const nodes: GraphNode[] = wordword4numbers.nodes.slice(0, 3);
    const edges: Edge[] = [];
    const { positions } = forceLayout3D(nodes, edges, { iterations: 50 });
    expect(positions.size).toBe(3);
    for (const p of positions.values()) {
      expect(Number.isFinite(p.x)).toBe(true);
    }
  });
});
