import { describe, expect, it } from "vitest";
import {
  ANGEL_UNIFORM_COLOR,
  EDGE_COLORS,
  EDGE_SPRING_LENGTH,
  MAGI_UNIFORM_COLOR,
  adjacency,
  colorFor,
  evangelion,
  isAngel,
  isCharacter,
  isMagi,
  nodeIndex,
  nodeRadius,
  validateGraph,
} from "../../src/graph";
import { palette } from "../../src/theme/palette";

describe("evangelion graph", () => {
  it("validates without throwing", () => {
    expect(() => validateGraph(evangelion)).not.toThrow();
  });

  it("has the expected canon node mix", () => {
    expect(evangelion.id).toBe("evangelion");
    expect(evangelion.nodes.filter(isCharacter)).toHaveLength(8);
    expect(evangelion.nodes.filter(isAngel)).toHaveLength(18);
    expect(evangelion.nodes.filter(isMagi)).toHaveLength(3);
    expect(evangelion.nodes).toHaveLength(8 + 18 + 3);
  });

  it("uses unique node ids", () => {
    const ids = evangelion.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every edge resolves to known nodes", () => {
    const idx = nodeIndex(evangelion);
    for (const edge of evangelion.edges) {
      expect(idx.has(edge.from)).toBe(true);
      expect(idx.has(edge.to)).toBe(true);
    }
  });

  it("has no self-loops", () => {
    for (const edge of evangelion.edges) {
      expect(edge.from).not.toBe(edge.to);
    }
  });

  it("angels are numbered 1..18 in canonical order", () => {
    const numbers = evangelion.nodes
      .filter(isAngel)
      .map((a) => a.number)
      .sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
  });

  it("the canonical angel names are present at the right numbers", () => {
    const byNumber = new Map(
      evangelion.nodes.filter(isAngel).map((a) => [a.number, a.name]),
    );
    expect(byNumber.get(1)).toBe("Adam");
    expect(byNumber.get(2)).toBe("Lilith");
    expect(byNumber.get(3)).toBe("Sachiel");
    expect(byNumber.get(5)).toBe("Ramiel");
    expect(byNumber.get(13)).toBe("Bardiel");
    expect(byNumber.get(14)).toBe("Zeruel");
    expect(byNumber.get(17)).toBe("Tabris");
    expect(byNumber.get(18)).toBe("Lilim");
  });

  it("the eight expected characters are present by id", () => {
    const ids = new Set(evangelion.nodes.filter(isCharacter).map((c) => c.id));
    expect(ids).toEqual(
      new Set([
        "char_shinji",
        "char_asuka",
        "char_rei",
        "char_misato",
        "char_kaworu",
        "char_gendo",
        "char_ritsuko",
        "char_mari",
      ]),
    );
  });

  it("every character paletteKey resolves in the palette", () => {
    for (const c of evangelion.nodes.filter(isCharacter)) {
      expect(
        palette,
        `character ${c.id} paletteKey ${c.paletteKey} not in palette`,
      ).toHaveProperty(c.paletteKey);
    }
  });

  it("the three Magi are present and tightly linked (triangle)", () => {
    const magiIds = evangelion.nodes.filter(isMagi).map((m) => m.id);
    expect(magiIds.sort()).toEqual(
      ["magi_balthasar", "magi_casper", "magi_melchior"].sort(),
    );

    const magiLinks = evangelion.edges.filter((e) => e.kind === "magi_link");
    expect(magiLinks).toHaveLength(3);

    // Every magi node touches at least 2 magi_link edges (triangle invariant).
    for (const id of magiIds) {
      const touching = magiLinks.filter((e) => e.from === id || e.to === id);
      expect(
        touching.length,
        `${id} is not part of the magi triangle`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("magi_link rest length is the shortest of any edge kind (3-in-1)", () => {
    const others = Object.entries(EDGE_SPRING_LENGTH).filter(
      ([k]) => k !== "magi_link",
    );
    for (const [_, len] of others) {
      expect(EDGE_SPRING_LENGTH.magi_link).toBeLessThan(len);
    }
  });

  it("angel_sequence chains 17 sequential edges from #1 to #18", () => {
    const seq = evangelion.edges.filter((e) => e.kind === "angel_sequence");
    expect(seq).toHaveLength(17);
    const idx = nodeIndex(evangelion);
    for (const e of seq) {
      const from = idx.get(e.from);
      const to = idx.get(e.to);
      expect(from && from.kind).toBe("angel");
      expect(to && to.kind).toBe("angel");
      if (from && from.kind === "angel" && to && to.kind === "angel") {
        expect(to.number - from.number).toBe(1);
      }
    }
  });

  it("Tabris (#17) is spoiler-gated and Kaworu has no edge to it (basic seed)", () => {
    const tabris = evangelion.nodes.filter(isAngel).find((a) => a.number === 17);
    expect(tabris).toBeDefined();
    expect(tabris!.spoilerLevel).toBe("spoiler");

    // Verify the Kaworu/Tabris reveal is not encoded in the basic seed.
    const kaworuId = "char_kaworu";
    const tabrisId = tabris!.id;
    const reveal = evangelion.edges.find(
      (e) =>
        (e.from === kaworuId && e.to === tabrisId) ||
        (e.from === tabrisId && e.to === kaworuId),
    );
    expect(reveal).toBeUndefined();
  });

  it("clusters resolve to a defined render color for every node", () => {
    for (const node of evangelion.nodes) {
      expect(colorFor(node)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("magi nodes all paint with the uniform magi color (3-in-1 visual)", () => {
    for (const m of evangelion.nodes.filter(isMagi)) {
      expect(colorFor(m).toLowerCase()).toBe(MAGI_UNIFORM_COLOR.toLowerCase());
    }
  });

  it("angel nodes all paint with the uniform AT-field color", () => {
    for (const a of evangelion.nodes.filter(isAngel)) {
      expect(colorFor(a).toLowerCase()).toBe(ANGEL_UNIFORM_COLOR.toLowerCase());
    }
  });

  it("EDGE_COLORS cover every edge kind in use", () => {
    const kinds = new Set(evangelion.edges.map((e) => e.kind));
    for (const k of kinds) {
      expect(EDGE_COLORS[k]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("nodeRadius is bounded and characters >= angels >= magi", () => {
    const c = evangelion.nodes.find(isCharacter)!;
    const a = evangelion.nodes.find(isAngel)!;
    const m = evangelion.nodes.find(isMagi)!;
    for (const n of [c, a, m]) {
      const r = nodeRadius(n);
      expect(r).toBeGreaterThan(0);
      expect(r).toBeLessThanOrEqual(1);
    }
    expect(nodeRadius(c)).toBeGreaterThanOrEqual(nodeRadius(a));
    expect(nodeRadius(a)).toBeGreaterThan(nodeRadius(m));
  });

  it("magi nodes are connected via adjacency to at least 2 others", () => {
    const adj = adjacency(evangelion);
    for (const m of evangelion.nodes.filter(isMagi)) {
      expect(adj.get(m.id)?.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("validateGraph throws for invalid inputs", () => {
  it("rejects unknown edge endpoints", () => {
    expect(() =>
      validateGraph({
        ...evangelion,
        edges: [
          {
            from: "char_shinji",
            to: "ZZZ",
            kind: "magi_link",
            notes: "",
          },
        ],
      }),
    ).toThrow(/unknown 'to' node/);
  });

  it("rejects duplicate node ids", () => {
    const dup = evangelion.nodes[0]!;
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: [...evangelion.nodes, dup],
      }),
    ).toThrow(/Duplicate node id/);
  });

  it("rejects self-loops", () => {
    expect(() =>
      validateGraph({
        ...evangelion,
        edges: [
          ...evangelion.edges,
          {
            from: "magi_casper",
            to: "magi_casper",
            kind: "magi_link",
            notes: "",
          },
        ],
      }),
    ).toThrow(/Self-loop/);
  });

  it("rejects non-contiguous angel numbering", () => {
    const angels = evangelion.nodes.filter(isAngel);
    const drop = angels.find((a) => a.number === 5)!;
    const broken = angels.filter((a) => a.number !== 5);
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: [
          ...evangelion.nodes.filter((n) => !isAngel(n)),
          ...broken,
        ],
        // Strip edges that referenced the removed angel so the contiguous-numbering
        // rule fires before the dangling-edge rule.
        edges: evangelion.edges.filter(
          (e) => e.from !== drop.id && e.to !== drop.id,
        ),
      }),
    ).toThrow(/contiguous 1\.\.N/);
  });
});
