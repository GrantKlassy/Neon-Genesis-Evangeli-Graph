import { describe, expect, it } from "vitest";
import {
  ANGEL_UNIFORM_COLOR,
  CONCEPT_UNIFORM_COLOR,
  EDGE_COLORS,
  EDGE_SPRING_LENGTH,
  EDGE_WEIGHT,
  EVA_UNIFORM_COLOR,
  LOCATION_UNIFORM_COLOR,
  MAGI_UNIFORM_COLOR,
  ORGANIZATION_UNIFORM_COLOR,
  adjacency,
  colorFor,
  evangelion,
  isAngel,
  isCharacter,
  isConcept,
  isEva,
  isEvent,
  isLocation,
  isMagi,
  isOrganization,
  nodeIndex,
  nodeRadius,
  validateGraph,
} from "../../src/graph";
import { genesis, isShortcode } from "../../src/genesis";

describe("evangelion graph", () => {
  it("validates without throwing", () => {
    expect(() => validateGraph(evangelion)).not.toThrow();
  });

  it("has the expected canon node mix", () => {
    expect(evangelion.id).toBe("evangelion");
    expect(evangelion.nodes.filter(isCharacter)).toHaveLength(10);
    expect(evangelion.nodes.filter(isAngel)).toHaveLength(18);
    expect(evangelion.nodes.filter(isMagi)).toHaveLength(3);
    expect(evangelion.nodes.filter(isEvent).length).toBeGreaterThanOrEqual(1);
    expect(evangelion.nodes.filter(isOrganization).length).toBeGreaterThanOrEqual(1);
    expect(evangelion.nodes.filter(isLocation).length).toBeGreaterThanOrEqual(1);
    expect(evangelion.nodes.filter(isConcept).length).toBeGreaterThanOrEqual(1);
    expect(evangelion.nodes.filter(isEva).length).toBeGreaterThanOrEqual(4);
    // Sum of all kinds covers every node in the graph (no leftover kinds).
    expect(evangelion.nodes).toHaveLength(
      evangelion.nodes.filter(isCharacter).length +
        evangelion.nodes.filter(isAngel).length +
        evangelion.nodes.filter(isMagi).length +
        evangelion.nodes.filter(isEvent).length +
        evangelion.nodes.filter(isOrganization).length +
        evangelion.nodes.filter(isLocation).length +
        evangelion.nodes.filter(isConcept).length +
        evangelion.nodes.filter(isEva).length,
    );
  });

  it("organizations include NERV", () => {
    const orgs = evangelion.nodes.filter(isOrganization);
    expect(orgs.find((o) => o.id === "org_nerv")).toBeDefined();
  });

  it("locations include NERV HQ as the genesis location", () => {
    const locs = evangelion.nodes.filter(isLocation);
    const hq = locs.find((l) => l.id === "loc_nerv_hq");
    expect(hq).toBeDefined();
    expect(hq!.shortcodes).toContain("nervHq");
  });

  it("concepts contain the placeholder TEST NODE seed", () => {
    const concepts = evangelion.nodes.filter(isConcept);
    const seed = concepts.find((c) => c.id === "concept_test_node");
    expect(seed).toBeDefined();
    expect(seed!.displayName).toBe("TEST NODE");
  });

  it("EVA units cover Unit-00 through Unit-04 plus Mass Production", () => {
    const evas = evangelion.nodes.filter(isEva);
    const ids = new Set(evas.map((e) => e.id));
    for (const expected of [
      "eva_unit00",
      "eva_unit01",
      "eva_unit02",
      "eva_unit03",
      "eva_unit04",
      "eva_mass_production",
    ]) {
      expect(ids.has(expected), `missing ${expected}`).toBe(true);
    }
  });

  it("Mass Production EVA is gated to End of Evangelion", () => {
    const mp = evangelion.nodes.filter(isEva).find((e) => e.id === "eva_mass_production");
    expect(mp).toBeDefined();
    expect(mp!.revealedAt).toEqual({ kind: "eoe" });
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

  it("the ten expected characters are present by id", () => {
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
        "char_toji",
        "char_yui",
      ]),
    );
  });

  it("every node declares a non-empty displayName for the 3D label", () => {
    for (const n of evangelion.nodes) {
      expect(typeof n.displayName, `${n.id} displayName not a string`).toBe(
        "string",
      );
      expect(
        n.displayName.trim().length,
        `${n.id} displayName is empty`,
      ).toBeGreaterThan(0);
    }
  });

  it("angel and magi displayNames mirror their canonical names", () => {
    for (const a of evangelion.nodes.filter(isAngel)) {
      expect(a.displayName).toBe(a.name);
    }
    for (const m of evangelion.nodes.filter(isMagi)) {
      expect(m.displayName).toBe(m.name);
    }
  });

  it("every node declares at least one shortcode that resolves in genesis", () => {
    for (const n of evangelion.nodes) {
      expect(n.shortcodes.length, `${n.id} has no shortcodes`).toBeGreaterThan(
        0,
      );
      for (const code of n.shortcodes) {
        expect(
          isShortcode(code),
          `${n.id}: shortcode "${code}" not in genesis`,
        ).toBe(true);
      }
    }
  });

  it("Shinji Ikari node is connected to BOTH 'shinji' and 'ikari' shortcodes", () => {
    const shinji = evangelion.nodes.find((n) => n.id === "char_shinji");
    expect(shinji).toBeDefined();
    expect(shinji!.shortcodes).toContain("shinji");
    expect(shinji!.shortcodes).toContain("ikari");
  });

  it("Gendo Ikari node ALSO references the 'ikari' family shortcode", () => {
    const gendo = evangelion.nodes.find((n) => n.id === "char_gendo");
    expect(gendo).toBeDefined();
    expect(gendo!.shortcodes).toContain("gendo");
    expect(gendo!.shortcodes).toContain("ikari");
  });

  it("'shinji' and 'ikari' shortcodes are both kind CHARACTERS", () => {
    expect(genesis.shinji.kind).toBe("CHARACTERS");
    expect(genesis.ikari.kind).toBe("CHARACTERS");
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

  it("EDGE_WEIGHT covers every edge kind in use and stays > 1", () => {
    const kinds = new Set(evangelion.edges.map((e) => e.kind));
    for (const k of kinds) {
      expect(EDGE_WEIGHT[k]).toBeGreaterThan(1);
    }
  });

  it("magi_link carries the highest spring weight (3-in-1 invariant)", () => {
    const others = Object.entries(EDGE_WEIGHT).filter(
      ([k]) => k !== "magi_link",
    );
    for (const [_, w] of others) {
      expect(EDGE_WEIGHT.magi_link).toBeGreaterThan(w);
    }
  });

  it("every edge stamps weight matching EDGE_WEIGHT for its kind", () => {
    for (const e of evangelion.edges) {
      expect(e.weight, `edge ${e.from}->${e.to} has no weight`).toBe(
        EDGE_WEIGHT[e.kind],
      );
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

  it("Tabris (#17) is gated to Ep 24 and the Kaworu->Tabris edge is encoded but gated", () => {
    const tabris = evangelion.nodes.filter(isAngel).find((a) => a.number === 17);
    expect(tabris).toBeDefined();
    expect(tabris!.revealedAt).toEqual({ kind: "ep", episode: 24 });

    // The reveal IS encoded now --- the renderer masks it until the user
    // declares ep 24+ progress. Edge has its own gate independent of endpoints.
    const kaworuId = "char_kaworu";
    const tabrisId = tabris!.id;
    const reveal = evangelion.edges.find(
      (e) =>
        (e.from === kaworuId && e.to === tabrisId) ||
        (e.from === tabrisId && e.to === kaworuId),
    );
    expect(reveal).toBeDefined();
    expect(reveal!.kind).toBe("identity_reveal");
    expect(reveal!.revealedAt).toEqual({ kind: "ep", episode: 24 });
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

  it("organizations paint with the uniform organization color", () => {
    for (const o of evangelion.nodes.filter(isOrganization)) {
      expect(colorFor(o).toLowerCase()).toBe(
        ORGANIZATION_UNIFORM_COLOR.toLowerCase(),
      );
    }
  });

  it("locations paint with the uniform location color", () => {
    for (const l of evangelion.nodes.filter(isLocation)) {
      expect(colorFor(l).toLowerCase()).toBe(
        LOCATION_UNIFORM_COLOR.toLowerCase(),
      );
    }
  });

  it("concepts paint with the uniform concept color", () => {
    for (const c of evangelion.nodes.filter(isConcept)) {
      expect(colorFor(c).toLowerCase()).toBe(
        CONCEPT_UNIFORM_COLOR.toLowerCase(),
      );
    }
  });

  it("EVA units paint with the uniform EVA color", () => {
    for (const e of evangelion.nodes.filter(isEva)) {
      expect(colorFor(e).toLowerCase()).toBe(EVA_UNIFORM_COLOR.toLowerCase());
    }
  });

  describe("pilots edges (character -> EVA unit)", () => {
    const pilots = evangelion.edges.filter((e) => e.kind === "pilots");

    it("at least four pilot pairings are encoded", () => {
      expect(pilots.length).toBeGreaterThanOrEqual(4);
    });

    it("Shinji pilots Unit-01, Rei pilots Unit-00, Asuka pilots Unit-02, Toji pilots Unit-03", () => {
      const has = (from: string, to: string) =>
        pilots.find((e) => e.from === from && e.to === to);
      expect(has("char_shinji", "eva_unit01")).toBeDefined();
      expect(has("char_rei", "eva_unit00")).toBeDefined();
      expect(has("char_asuka", "eva_unit02")).toBeDefined();
      expect(has("char_toji", "eva_unit03")).toBeDefined();
    });

    it("the Toji <-> Unit-03 edge is gated to the Fourth Child reveal (Ep. 17)", () => {
      const e = pilots.find(
        (e) => e.from === "char_toji" && e.to === "eva_unit03",
      );
      expect(e).toBeDefined();
      expect(e!.revealedAt).toEqual({ kind: "ep", episode: 17 });
    });

    it("each pilot edge resolves to a character on one side and an EVA on the other", () => {
      const idx = nodeIndex(evangelion);
      for (const e of pilots) {
        const from = idx.get(e.from)!;
        const to = idx.get(e.to)!;
        expect(from.kind === "character" || to.kind === "character").toBe(true);
        expect(from.kind === "eva" || to.kind === "eva").toBe(true);
      }
    });
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

  it("rejects nodes with an empty displayName", () => {
    const broken = {
      ...evangelion.nodes[0]!,
      displayName: "   ",
    };
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: [broken, ...evangelion.nodes.slice(1)],
      }),
    ).toThrow(/non-empty displayName/);
  });

  it("rejects nodes with an empty shortcodes array", () => {
    const broken = {
      ...evangelion.nodes[0]!,
      shortcodes: [] as string[],
    };
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: [broken, ...evangelion.nodes.slice(1)],
      }),
    ).toThrow(/at least one genesis shortcode/);
  });

  it("rejects nodes referencing unknown shortcodes", () => {
    const broken = {
      ...evangelion.nodes[0]!,
      shortcodes: ["not_a_real_shortcode"],
    };
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: [broken, ...evangelion.nodes.slice(1)],
      }),
    ).toThrow(/unknown shortcode/);
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
