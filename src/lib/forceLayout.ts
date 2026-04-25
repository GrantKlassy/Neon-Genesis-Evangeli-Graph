import type { Edge, EdgeKind, GraphNode } from "../graph/types";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface LayoutResult {
  positions: Map<string, Vec3>;
  iterations: number;
}

export interface LayoutOptions {
  iterations?: number;
  /** Initial random spread radius. */
  initialSpread?: number;
  /** Repulsive coefficient (higher = nodes push apart harder). */
  repulsion?: number;
  /** Spring coefficient on edges (higher = edges contract harder). */
  springK?: number;
  /** Default rest length of edge springs (overridden per-kind via springLengthByKind). */
  springLength?: number;
  /** Optional per-edge-kind override of rest length. Lets the magi triad sit very tight. */
  springLengthByKind?: Partial<Record<EdgeKind, number>>;
  /** Multiplicative velocity damping per step. */
  damping?: number;
  /** Cap per-step displacement to keep things stable. */
  maxStep?: number;
  /**
   * Per-step force pulling every node toward origin, proportional to its
   * radius. Bounds the layout: without it, nodes that have only repulsion
   * (e.g. characters carrying no edges) drift indefinitely outward and
   * dominate the post-layout normalization, squashing the rest of the
   * graph into a tiny ball. Set to 0 to disable.
   */
  centerForce?: number;
  /** Deterministic seed for reproducible layouts. */
  seed?: number;
}

const DEFAULT_OPTS: Required<Omit<LayoutOptions, "springLengthByKind">> & {
  springLengthByKind: Partial<Record<EdgeKind, number>>;
} = {
  iterations: 500,
  initialSpread: 5,
  repulsion: 6.5,
  springK: 0.06,
  springLength: 2.6,
  springLengthByKind: {},
  damping: 0.85,
  maxStep: 0.4,
  centerForce: 0.02,
  seed: 0xc0ffee,
};

/** Mulberry32 PRNG for deterministic layouts. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 3D force-directed layout. Pure function: same nodes/edges + same seed = same output.
 *
 * Algorithm: Eades-style spring-electrical model. Repulsion between every pair,
 * attraction along every edge. Velocity-Verlet-ish with simple Euler step + damping.
 */
export function forceLayout3D(
  nodes: readonly GraphNode[],
  edges: readonly Edge[],
  options: LayoutOptions = {},
): LayoutResult {
  const opts = { ...DEFAULT_OPTS, ...options };
  const rand = mulberry32(opts.seed);

  // Initial random sphere placement.
  const positions = new Map<string, Vec3>();
  const velocities = new Map<string, Vec3>();
  for (const n of nodes) {
    const r = opts.initialSpread * Math.cbrt(rand());
    const theta = rand() * 2 * Math.PI;
    const phi = Math.acos(2 * rand() - 1);
    positions.set(n.id, {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
    });
    velocities.set(n.id, { x: 0, y: 0, z: 0 });
  }

  // De-duplicate edges for layout (we don't want multi-edges to over-attract).
  // When duplicates exist with different kinds, keep the SHORTEST rest length
  // so a tight kind (e.g. magi_link) wins over a loose one. Weight is taken
  // from the surviving edge (defaults to 1 when unset).
  const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const layoutEdgeByKey = new Map<
    string,
    { a: string; b: string; restLength: number; weight: number }
  >();
  for (const e of edges) {
    if (e.from === e.to) continue;
    const key = edgeKey(e.from, e.to);
    const restLength =
      opts.springLengthByKind[e.kind] ?? opts.springLength;
    const weight = e.weight ?? 1;
    const existing = layoutEdgeByKey.get(key);
    if (!existing || restLength < existing.restLength) {
      layoutEdgeByKey.set(key, { a: e.from, b: e.to, restLength, weight });
    }
  }
  const layoutEdges = [...layoutEdgeByKey.values()];

  for (let step = 0; step < opts.iterations; step++) {
    const forces = new Map<string, Vec3>();
    for (const n of nodes) forces.set(n.id, { x: 0, y: 0, z: 0 });

    // Repulsion: O(n^2) but n is tiny.
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const pa = positions.get(a.id)!;
        const pb = positions.get(b.id)!;
        const dx = pa.x - pb.x;
        const dy = pa.y - pb.y;
        const dz = pa.z - pb.z;
        const dist2 = Math.max(0.001, dx * dx + dy * dy + dz * dz);
        const dist = Math.sqrt(dist2);
        const force = opts.repulsion / dist2;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;
        const fa = forces.get(a.id)!;
        const fb = forces.get(b.id)!;
        fa.x += fx;
        fa.y += fy;
        fa.z += fz;
        fb.x -= fx;
        fb.y -= fy;
        fb.z -= fz;
      }
    }

    // Soft pull toward origin so disconnected components (characters in the
    // basic seed) don't drift to infinity under pure repulsion and dominate
    // the post-layout normalization.
    if (opts.centerForce > 0) {
      for (const n of nodes) {
        const p = positions.get(n.id)!;
        const f = forces.get(n.id)!;
        f.x -= opts.centerForce * p.x;
        f.y -= opts.centerForce * p.y;
        f.z -= opts.centerForce * p.z;
      }
    }

    // Spring attraction along edges. Per-edge weight scales the spring
    // constant: weight > 1 pulls the endpoints toward rest length harder
    // (tight cluster); weight < 1 lets repulsion dominate longer.
    for (const e of layoutEdges) {
      const pa = positions.get(e.a)!;
      const pb = positions.get(e.b)!;
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const dz = pb.z - pa.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
      const stretch = dist - e.restLength;
      const force = opts.springK * e.weight * stretch;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;
      const fa = forces.get(e.a)!;
      const fb = forces.get(e.b)!;
      fa.x += fx;
      fa.y += fy;
      fa.z += fz;
      fb.x -= fx;
      fb.y -= fy;
      fb.z -= fz;
    }

    // Integrate.
    for (const n of nodes) {
      const v = velocities.get(n.id)!;
      const f = forces.get(n.id)!;
      v.x = (v.x + f.x) * opts.damping;
      v.y = (v.y + f.y) * opts.damping;
      v.z = (v.z + f.z) * opts.damping;
      const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
      if (speed > opts.maxStep) {
        const scale = opts.maxStep / speed;
        v.x *= scale;
        v.y *= scale;
        v.z *= scale;
      }
      const p = positions.get(n.id)!;
      p.x += v.x;
      p.y += v.y;
      p.z += v.z;
    }

    // Re-center on centroid each step so it doesn't drift.
    let cx = 0,
      cy = 0,
      cz = 0;
    for (const p of positions.values()) {
      cx += p.x;
      cy += p.y;
      cz += p.z;
    }
    cx /= nodes.length;
    cy /= nodes.length;
    cz /= nodes.length;
    for (const p of positions.values()) {
      p.x -= cx;
      p.y -= cy;
      p.z -= cz;
    }
  }

  return { positions, iterations: opts.iterations };
}
