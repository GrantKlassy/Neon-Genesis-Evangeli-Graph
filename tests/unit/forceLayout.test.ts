import { describe, expect, it } from "vitest";
import { forceLayout3D } from "../../src/lib/forceLayout";
import { EDGE_SPRING_LENGTH, evangelion } from "../../src/graph";
import type { Edge, GraphNode } from "../../src/graph/types";

describe("forceLayout3D", () => {
  it("places every node and produces finite coordinates", () => {
    const { positions } = forceLayout3D(
      evangelion.nodes,
      evangelion.edges,
      { iterations: 80 },
    );
    expect(positions.size).toBe(evangelion.nodes.length);
    for (const [id, p] of positions) {
      expect(Number.isFinite(p.x), `${id}.x finite`).toBe(true);
      expect(Number.isFinite(p.y), `${id}.y finite`).toBe(true);
      expect(Number.isFinite(p.z), `${id}.z finite`).toBe(true);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = forceLayout3D(evangelion.nodes, evangelion.edges, {
      iterations: 60,
      seed: 42,
    });
    const b = forceLayout3D(evangelion.nodes, evangelion.edges, {
      iterations: 60,
      seed: 42,
    });
    for (const id of a.positions.keys()) {
      expect(a.positions.get(id)).toEqual(b.positions.get(id));
    }
  });

  it("differs for different seeds", () => {
    const a = forceLayout3D(evangelion.nodes, evangelion.edges, {
      iterations: 60,
      seed: 1,
    });
    const b = forceLayout3D(evangelion.nodes, evangelion.edges, {
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
      evangelion.nodes,
      evangelion.edges,
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
      evangelion.nodes,
      evangelion.edges,
      { iterations: 400, springLengthByKind: EDGE_SPRING_LENGTH },
    );
    const dist = (a: string, b: string) => {
      const pa = positions.get(a)!;
      const pb = positions.get(b)!;
      return Math.sqrt(
        (pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2 + (pa.z - pb.z) ** 2,
      );
    };
    const edgePairs = new Set<string>();
    for (const e of evangelion.edges) {
      const k = e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`;
      edgePairs.add(k);
    }
    const ids = evangelion.nodes.map((n) => n.id);
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

  it("places the three Magi much closer to each other than to non-magi nodes", () => {
    const { positions } = forceLayout3D(
      evangelion.nodes,
      evangelion.edges,
      { iterations: 600, springLengthByKind: EDGE_SPRING_LENGTH },
    );
    const dist = (a: string, b: string) => {
      const pa = positions.get(a)!;
      const pb = positions.get(b)!;
      return Math.sqrt(
        (pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2 + (pa.z - pb.z) ** 2,
      );
    };
    const magiIds = ["magi_casper", "magi_melchior", "magi_balthasar"];
    let magiSum = 0,
      magiN = 0;
    for (let i = 0; i < magiIds.length; i++) {
      for (let j = i + 1; j < magiIds.length; j++) {
        magiSum += dist(magiIds[i]!, magiIds[j]!);
        magiN += 1;
      }
    }
    const magiAvg = magiSum / magiN;

    const otherIds = evangelion.nodes
      .filter((n) => n.kind !== "magi")
      .map((n) => n.id);
    let mixSum = 0,
      mixN = 0;
    for (const m of magiIds) {
      for (const o of otherIds) {
        mixSum += dist(m, o);
        mixN += 1;
      }
    }
    const mixAvg = mixSum / mixN;

    // Magi triad should be dramatically tighter than magi-to-others.
    expect(magiAvg).toBeLessThan(mixAvg / 2);
  });

  it("does not collapse all nodes onto one point (repulsion is active)", () => {
    const { positions } = forceLayout3D(
      evangelion.nodes,
      evangelion.edges,
      { iterations: 300 },
    );
    const all = [...positions.values()];
    let maxDist = 0;
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const d = Math.sqrt(
          (all[i]!.x - all[j]!.x) ** 2 +
            (all[i]!.y - all[j]!.y) ** 2 +
            (all[i]!.z - all[j]!.z) ** 2,
        );
        if (d > maxDist) maxDist = d;
      }
    }
    // Without per-pair separation, layout would be a point. With repulsion
    // the graph spans well over a unit, even with tightly-bound magi.
    expect(maxDist).toBeGreaterThan(2);
  });

  it("handles the empty edge case gracefully", () => {
    const nodes: GraphNode[] = evangelion.nodes.slice(0, 3);
    const edges: Edge[] = [];
    const { positions } = forceLayout3D(nodes, edges, { iterations: 50 });
    expect(positions.size).toBe(3);
    for (const p of positions.values()) {
      expect(Number.isFinite(p.x)).toBe(true);
    }
  });

  it("higher edge weight pulls endpoints closer to rest length", () => {
    // Two nodes from the seed, one edge. Run twice: once with weight 1,
    // once with weight 8. Higher weight beats repulsion harder, so the
    // settled distance drops toward the rest length.
    const nodes = evangelion.nodes.slice(0, 2);
    const restLength = 1.5;
    const mkEdge = (weight: number): Edge => ({
      from: nodes[0]!.id,
      to: nodes[1]!.id,
      kind: "magi_link",
      weight,
      notes: "synthetic",
    });
    const dist = (positions: Map<string, { x: number; y: number; z: number }>) => {
      const a = positions.get(nodes[0]!.id)!;
      const b = positions.get(nodes[1]!.id)!;
      return Math.sqrt(
        (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2,
      );
    };
    const lightOpts = {
      iterations: 600,
      springLengthByKind: { magi_link: restLength },
      seed: 7,
    };
    const lightRun = forceLayout3D(nodes, [mkEdge(1)], lightOpts);
    const heavyRun = forceLayout3D(nodes, [mkEdge(8)], lightOpts);
    const lightDist = dist(lightRun.positions);
    const heavyDist = dist(heavyRun.positions);
    // Heavy spring should equilibrate closer to rest length than the light
    // one --- repulsion still pushes them apart, but the spring wins more.
    expect(heavyDist).toBeLessThan(lightDist);
    expect(heavyDist).toBeGreaterThan(restLength);
  });
});
