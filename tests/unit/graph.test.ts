import { describe, expect, it } from "vitest";
import {
  ANGEL_UNIFORM_COLOR,
  CONCEPT_UNIFORM_COLOR,
  EDGE_COLORS,
  EDGE_SPRING_LENGTH,
  EDGE_WEIGHT,
  FAMILY_UNIFORM_COLOR,
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
  isFamily,
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
    expect(evangelion.nodes.filter(isCharacter)).toHaveLength(11);
    expect(evangelion.nodes.filter(isAngel)).toHaveLength(18);
    expect(evangelion.nodes.filter(isMagi)).toHaveLength(3);
    // Event kind is currently empty --- Third Impact moved into concepts to
    // match the genesis registry. The kind itself stays for future use.
    expect(evangelion.nodes.filter(isEvent).length).toBe(0);
    expect(evangelion.nodes.filter(isOrganization).length).toBeGreaterThanOrEqual(1);
    expect(evangelion.nodes.filter(isLocation).length).toBeGreaterThanOrEqual(1);
    expect(evangelion.nodes.filter(isConcept).length).toBeGreaterThanOrEqual(3);
    expect(evangelion.nodes.filter(isEva).length).toBeGreaterThanOrEqual(4);
    expect(evangelion.nodes.filter(isFamily)).toHaveLength(2);
    // Sum of all kinds covers every node in the graph (no leftover kinds).
    expect(evangelion.nodes).toHaveLength(
      evangelion.nodes.filter(isCharacter).length +
        evangelion.nodes.filter(isAngel).length +
        evangelion.nodes.filter(isMagi).length +
        evangelion.nodes.filter(isEvent).length +
        evangelion.nodes.filter(isOrganization).length +
        evangelion.nodes.filter(isLocation).length +
        evangelion.nodes.filter(isConcept).length +
        evangelion.nodes.filter(isEva).length +
        evangelion.nodes.filter(isFamily).length,
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

  it("concepts include AT Field, LCL, and Third Impact as first-class nodes", () => {
    const concepts = evangelion.nodes.filter(isConcept);
    const ids = new Set(concepts.map((c) => c.id));
    for (const expected of [
      "concept_at_field",
      "concept_lcl",
      "concept_third_impact",
    ]) {
      expect(ids.has(expected), `missing concept ${expected}`).toBe(true);
    }
  });

  it("Third Impact concept is gated to End of Evangelion", () => {
    const ti = evangelion.nodes
      .filter(isConcept)
      .find((c) => c.id === "concept_third_impact");
    expect(ti).toBeDefined();
    expect(ti!.revealedAt).toEqual({ kind: "eoe" });
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

  it("the eleven expected characters are present by id (10 main cast + Naoko Akagi)", () => {
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
        "char_naoko",
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

  it("every node declares EXACTLY ONE shortcode that resolves in genesis", () => {
    for (const n of evangelion.nodes) {
      expect(n.shortcodes.length, `${n.id} should have exactly one shortcode`).toBe(
        1,
      );
      const code = n.shortcodes[0]!;
      expect(
        isShortcode(code),
        `${n.id}: shortcode "${code}" not in genesis`,
      ).toBe(true);
    }
  });

  it("Shinji's node carries only the 'shinji' shortcode (Ikari is family, lives in registry only)", () => {
    const shinji = evangelion.nodes.find((n) => n.id === "char_shinji");
    expect(shinji).toBeDefined();
    expect(shinji!.shortcodes).toEqual(["shinji"]);
  });

  it("Gendo's node carries only the 'gendo' shortcode", () => {
    const gendo = evangelion.nodes.find((n) => n.id === "char_gendo");
    expect(gendo).toBeDefined();
    expect(gendo!.shortcodes).toEqual(["gendo"]);
  });

  it("Yui's node carries only the 'yui' shortcode", () => {
    const yui = evangelion.nodes.find((n) => n.id === "char_yui");
    expect(yui).toBeDefined();
    expect(yui!.shortcodes).toEqual(["yui"]);
  });

  it("'shinji' and 'ikari' shortcodes are both kind CHARACTERS in the registry", () => {
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

  it("EVA units paint with their per-unit primary color from genesis", () => {
    for (const e of evangelion.nodes.filter(isEva)) {
      const code = e.shortcodes[0]!;
      const expected = genesis[code as keyof typeof genesis].primary;
      expect(colorFor(e).toLowerCase()).toBe(expected.toLowerCase());
    }
  });

  it("EVA per-unit colors match the canon body palette (Unit-00 blue, -01 purple, -02 red)", () => {
    const byId = new Map(
      evangelion.nodes.filter(isEva).map((e) => [e.id, colorFor(e).toLowerCase()]),
    );
    expect(byId.get("eva_unit00")).toBe(genesis.unit00.primary.toLowerCase());
    expect(byId.get("eva_unit01")).toBe(genesis.unit01.primary.toLowerCase());
    expect(byId.get("eva_unit02")).toBe(genesis.unit02.primary.toLowerCase());
    // Different units must read as different colors --- the homepage swatches
    // are distinct, so the graph nodes must be too.
    expect(byId.get("eva_unit00")).not.toBe(byId.get("eva_unit01"));
    expect(byId.get("eva_unit01")).not.toBe(byId.get("eva_unit02"));
  });

  describe("families and member_of_family edges", () => {
    it("seeds the Ikari and Akagi family nodes", () => {
      const fams = evangelion.nodes.filter(isFamily);
      const byId = new Map(fams.map((f) => [f.id, f]));
      expect(byId.get("family_ikari")).toBeDefined();
      expect(byId.get("family_akagi")).toBeDefined();
      expect(byId.get("family_ikari")!.shortcodes).toEqual(["ikari"]);
      expect(byId.get("family_akagi")!.shortcodes).toEqual(["akagi"]);
    });

    // Per the kind-uniform color invariant: every family node paints with
    // FAMILY_UNIFORM_COLOR, regardless of which surname it represents.
    // This test is part of the "5 kind-uniform / display-suffix invariants"
    // contract and is also asserted in the dedicated describe block below.
    it("paints every family with the uniform family color (no per-shortcode inheritance)", () => {
      for (const f of evangelion.nodes.filter(isFamily)) {
        expect(colorFor(f).toLowerCase()).toBe(
          FAMILY_UNIFORM_COLOR.toLowerCase(),
        );
      }
    });

    const memberEdges = evangelion.edges.filter(
      (e) => e.kind === "member_of_family",
    );

    it("encodes Shinji/Gendo/Yui -> Ikari and Ritsuko/Naoko -> Akagi", () => {
      const has = (from: string, to: string) =>
        memberEdges.find((e) => e.from === from && e.to === to);
      expect(has("char_shinji", "family_ikari")).toBeDefined();
      expect(has("char_gendo", "family_ikari")).toBeDefined();
      expect(has("char_yui", "family_ikari")).toBeDefined();
      expect(has("char_ritsuko", "family_akagi")).toBeDefined();
      expect(has("char_naoko", "family_akagi")).toBeDefined();
    });

    it("each member_of_family edge resolves to a character on one side and a family on the other", () => {
      const idx = nodeIndex(evangelion);
      for (const e of memberEdges) {
        const from = idx.get(e.from)!;
        const to = idx.get(e.to)!;
        expect(from.kind).toBe("character");
        expect(to.kind).toBe("family");
      }
    });

    it("every member_of_family edge stamps the canonical weight", () => {
      for (const e of memberEdges) {
        expect(e.weight).toBe(EDGE_WEIGHT.member_of_family);
      }
    });
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

  describe("eliminated edges (EVA -> angel kills)", () => {
    const eliminated = evangelion.edges.filter((e) => e.kind === "eliminated");

    it("encodes 15 canon kills across the TV chain", () => {
      // Unit-01: Sachiel, Shamshel, Ramiel, Israfel (co), Matarael,
      //   Sahaquiel, Leliel, Bardiel, Zeruel, Tabris = 10
      // Unit-02: Gaghiel, Israfel (co), Sandalphon, Arael = 4
      // Unit-00: Armisael (self-destruct) = 1
      // Adam, Lilith, Iruel, Lilim have no canonical EVA killer -> excluded.
      expect(eliminated).toHaveLength(15);
    });

    it("Unit-01 takes the canonical first three kills (Sachiel, Shamshel, Ramiel)", () => {
      const has = (from: string, to: string) =>
        eliminated.find((e) => e.from === from && e.to === to);
      expect(has("eva_unit01", "angel_03_sachiel")).toBeDefined();
      expect(has("eva_unit01", "angel_04_shamshel")).toBeDefined();
      expect(has("eva_unit01", "angel_05_ramiel")).toBeDefined();
    });

    it("Unit-02 takes Gaghiel, Sandalphon, and Arael", () => {
      const has = (from: string, to: string) =>
        eliminated.find((e) => e.from === from && e.to === to);
      expect(has("eva_unit02", "angel_06_gaghiel")).toBeDefined();
      expect(has("eva_unit02", "angel_08_sandalphon")).toBeDefined();
      expect(has("eva_unit02", "angel_15_arael")).toBeDefined();
    });

    it("Israfel is a co-kill --- both Unit-01 and Unit-02 are credited (Ep. 9)", () => {
      const israfelKills = eliminated.filter(
        (e) => e.to === "angel_07_israfel",
      );
      const evaIds = israfelKills.map((e) => e.from).sort();
      expect(evaIds).toEqual(["eva_unit01", "eva_unit02"]);
      for (const e of israfelKills) {
        expect(e.revealedAt).toEqual({ kind: "ep", episode: 9 });
      }
    });

    it("Unit-00's only kill is Armisael (self-destruct, Ep. 23)", () => {
      const unit00Kills = eliminated.filter((e) => e.from === "eva_unit00");
      expect(unit00Kills).toHaveLength(1);
      expect(unit00Kills[0]!.to).toBe("angel_16_armisael");
      expect(unit00Kills[0]!.revealedAt).toEqual({
        kind: "ep",
        episode: 23,
      });
    });

    it("Unit-01 takes Tabris in Ep. 24", () => {
      const tabrisKill = eliminated.find(
        (e) => e.from === "eva_unit01" && e.to === "angel_17_tabris",
      );
      expect(tabrisKill).toBeDefined();
      expect(tabrisKill!.revealedAt).toEqual({ kind: "ep", episode: 24 });
    });

    it("every eliminated edge resolves to an EVA on the from side and an angel on the to side", () => {
      const idx = nodeIndex(evangelion);
      for (const e of eliminated) {
        const from = idx.get(e.from)!;
        const to = idx.get(e.to)!;
        expect(from.kind, `${e.from} -> ${e.to}: from must be eva`).toBe("eva");
        expect(to.kind, `${e.from} -> ${e.to}: to must be angel`).toBe("angel");
      }
    });

    it("every eliminated edge stamps the canonical weight", () => {
      for (const e of eliminated) {
        expect(e.weight).toBe(EDGE_WEIGHT.eliminated);
      }
    });

    it("every eliminated edge is gated to its kill episode (no ungated kills)", () => {
      for (const e of eliminated) {
        expect(
          e.revealedAt,
          `${e.from} -> ${e.to} has no revealedAt gate`,
        ).toBeDefined();
        expect(e.revealedAt!.kind).toBe("ep");
      }
    });

    it("none of the excluded angels (Adam, Lilith, Iruel, Lilim) have an eliminated edge", () => {
      const excluded = new Set([
        "angel_01_adam",
        "angel_02_lilith",
        "angel_11_iruel",
        "angel_18_lilim",
      ]);
      for (const e of eliminated) {
        expect(excluded.has(e.to), `${e.to} should have no killer`).toBe(false);
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

  it("rejects nodes with more than one shortcode (single-shortcode invariant)", () => {
    const broken = {
      ...evangelion.nodes[0]!,
      shortcodes: ["shinji", "ikari"],
    };
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: [broken, ...evangelion.nodes.slice(1)],
      }),
    ).toThrow(/exactly one genesis shortcode/);
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

/**
 * The five kind-invariants the user spec'd directly:
 *   1. Every FAMILY node paints with the same uniform family color.
 *   2. Every FAMILY node has at least 2 member_of_family edges.
 *   3. Every ANGEL node paints with the uniform AT-field color.
 *   4. Every MAGI node paints with the uniform terminal-green.
 *   5. Every LOCATION node paints with the uniform location color AND its
 *      displayName contains the literal text "(Location)".
 *
 * Each "happy path" assertion is paired with a "test the test" negative
 * case that hand-builds a graph violating the invariant and confirms
 * validateGraph (or colorFor) catches it. Without the negative cases the
 * positive assertions could quietly pass against a bug --- e.g. if every
 * family had the same color because there was only one family, the
 * uniform check would be vacuously true.
 */
describe("kind-uniform / display-suffix invariants (with negative tests)", () => {
  // ---------- 1. Family color is uniform ----------
  describe("1. every FAMILY node uses the same color", () => {
    it("happy path: all family nodes paint with FAMILY_UNIFORM_COLOR", () => {
      const fams = evangelion.nodes.filter(isFamily);
      // Sanity: there is more than one family, so "uniform" is non-trivial.
      expect(fams.length).toBeGreaterThanOrEqual(2);
      for (const f of fams) {
        expect(colorFor(f).toLowerCase()).toBe(
          FAMILY_UNIFORM_COLOR.toLowerCase(),
        );
      }
      // And: collapsing to a Set yields exactly one color.
      const colors = new Set(fams.map((f) => colorFor(f).toLowerCase()));
      expect(colors.size).toBe(1);
    });

    it("test-the-test: a synthetic family with a different color would be caught (colorFor is hard-coded)", () => {
      // colorFor is a pure function of node.kind, NOT node.shortcodes ---
      // changing the shortcode cannot drift the color away from uniform.
      // Build a synthetic family node referencing a non-ikari shortcode
      // (e.g. shinji's color is navy, very different from family lavender)
      // and assert it STILL paints uniform family color.
      const synthetic = {
        id: "family_test",
        kind: "family" as const,
        name: "Test",
        displayName: "Test (Family)",
        shortcodes: ["shinji"], // navy in registry; family must ignore this.
        notes: "Synthetic to prove uniform color does not leak shortcode.",
      };
      expect(colorFor(synthetic).toLowerCase()).toBe(
        FAMILY_UNIFORM_COLOR.toLowerCase(),
      );
      expect(colorFor(synthetic).toLowerCase()).not.toBe(
        genesis.shinji.primary.toLowerCase(),
      );
    });
  });

  // ---------- 2. Family >= 2 edges ----------
  describe("2. every FAMILY node has >= 2 member_of_family edges", () => {
    it("happy path: every family rolls up at least 2 members", () => {
      const fams = evangelion.nodes.filter(isFamily);
      expect(fams.length).toBeGreaterThan(0);
      const memberEdges = evangelion.edges.filter(
        (e) => e.kind === "member_of_family",
      );
      for (const f of fams) {
        const count = memberEdges.filter(
          (e) => e.from === f.id || e.to === f.id,
        ).length;
        expect(count, `family ${f.id} has only ${count} member edges`).toBeGreaterThanOrEqual(
          2,
        );
      }
    });

    it("test-the-test: validateGraph throws when a family has fewer than 2 members", () => {
      // Pick the Ikari family and strip all but one of its member edges.
      const ikariMembers = evangelion.edges.filter(
        (e) =>
          e.kind === "member_of_family" &&
          (e.from === "family_ikari" || e.to === "family_ikari"),
      );
      expect(ikariMembers.length).toBeGreaterThanOrEqual(2);
      // Drop every Ikari member edge except the first --- now Ikari has 1.
      const keep = new Set([ikariMembers[0]]);
      const broken = evangelion.edges.filter(
        (e) =>
          !(
            e.kind === "member_of_family" &&
            (e.from === "family_ikari" || e.to === "family_ikari")
          ) || keep.has(e),
      );
      expect(() =>
        validateGraph({ ...evangelion, edges: broken }),
      ).toThrow(/at least 2 member_of_family edges/);
    });

    it("test-the-test: validateGraph throws when a family has zero members", () => {
      // Strip ALL member edges that touch the Akagi family.
      const broken = evangelion.edges.filter(
        (e) =>
          !(
            e.kind === "member_of_family" &&
            (e.from === "family_akagi" || e.to === "family_akagi")
          ),
      );
      expect(() =>
        validateGraph({ ...evangelion, edges: broken }),
      ).toThrow(/family_akagi.*at least 2/);
    });
  });

  // ---------- 3. Angel color is uniform ----------
  describe("3. every ANGEL node uses the same color", () => {
    it("happy path: all 18 angels paint with ANGEL_UNIFORM_COLOR", () => {
      const angels = evangelion.nodes.filter(isAngel);
      expect(angels).toHaveLength(18);
      for (const a of angels) {
        expect(colorFor(a).toLowerCase()).toBe(
          ANGEL_UNIFORM_COLOR.toLowerCase(),
        );
      }
      const colors = new Set(angels.map((a) => colorFor(a).toLowerCase()));
      expect(colors.size).toBe(1);
    });

    it("test-the-test: shortcode does not leak into angel color (colorFor short-circuits on isAngel)", () => {
      // Sachiel's registry primary is identical to ANGEL_UNIFORM_COLOR;
      // pick an angel and prove that even if its registry primary diverged,
      // colorFor would still return the uniform.
      const sachiel = evangelion.nodes.find((n) => n.id === "angel_03_sachiel");
      expect(sachiel).toBeDefined();
      expect(colorFor(sachiel!).toLowerCase()).toBe(
        ANGEL_UNIFORM_COLOR.toLowerCase(),
      );
      // Build a synthetic angel that points at a non-angel shortcode and
      // confirm colorFor still hard-routes to ANGEL_UNIFORM_COLOR.
      const synthetic = {
        id: "angel_test",
        kind: "angel" as const,
        number: 99,
        name: "Test",
        displayName: "Test",
        shortcodes: ["shinji"], // would be navy if leaked.
        introducedEpisode: "Synthetic",
        notes: "Synthetic to prove uniform color is by-kind, not by-shortcode.",
      };
      expect(colorFor(synthetic).toLowerCase()).toBe(
        ANGEL_UNIFORM_COLOR.toLowerCase(),
      );
    });
  });

  // ---------- 4. Magi color is uniform ----------
  describe("4. every MAGI node uses the same color", () => {
    it("happy path: all 3 magi paint with MAGI_UNIFORM_COLOR", () => {
      const magi = evangelion.nodes.filter(isMagi);
      expect(magi).toHaveLength(3);
      for (const m of magi) {
        expect(colorFor(m).toLowerCase()).toBe(
          MAGI_UNIFORM_COLOR.toLowerCase(),
        );
      }
      const colors = new Set(magi.map((m) => colorFor(m).toLowerCase()));
      expect(colors.size).toBe(1);
    });

    it("test-the-test: shortcode does not leak into magi color (colorFor short-circuits on isMagi)", () => {
      const synthetic = {
        id: "magi_test",
        kind: "magi" as const,
        name: "Test",
        displayName: "Test",
        personality: "Test",
        shortcodes: ["shinji"], // navy if leaked.
        notes: "Synthetic to prove uniform magi color is by-kind.",
      };
      expect(colorFor(synthetic).toLowerCase()).toBe(
        MAGI_UNIFORM_COLOR.toLowerCase(),
      );
    });
  });

  // ---------- 5. Location color is uniform AND displayName contains "(Location)" ----------
  describe("5. every LOCATION node uses the same color AND its displayName contains '(Location)'", () => {
    it("happy path: every location paints uniform AND displayName contains '(Location)'", () => {
      const locs = evangelion.nodes.filter(isLocation);
      expect(locs.length).toBeGreaterThan(0);
      for (const l of locs) {
        expect(colorFor(l).toLowerCase()).toBe(
          LOCATION_UNIFORM_COLOR.toLowerCase(),
        );
        expect(
          l.displayName,
          `location ${l.id} displayName is "${l.displayName}", missing "(Location)"`,
        ).toMatch(/\(Location\)/);
      }
      const colors = new Set(locs.map((l) => colorFor(l).toLowerCase()));
      expect(colors.size).toBe(1);
    });

    it("test-the-test: validateGraph throws when a location's displayName lacks '(Location)'", () => {
      const idx = evangelion.nodes.findIndex(isLocation);
      expect(idx).toBeGreaterThanOrEqual(0);
      const target = evangelion.nodes[idx]!;
      const broken = { ...target, displayName: "NERV HQ" }; // strip suffix.
      expect(() =>
        validateGraph({
          ...evangelion,
          nodes: [
            ...evangelion.nodes.slice(0, idx),
            broken,
            ...evangelion.nodes.slice(idx + 1),
          ],
        }),
      ).toThrow(/Location node.*\(Location\)/);
    });

    it("test-the-test: validateGraph throws when a family's displayName lacks '(Family)'", () => {
      // Same shape as the location test, but for the family suffix
      // invariant --- both share the (Suffix) convention so we test both.
      const idx = evangelion.nodes.findIndex(isFamily);
      expect(idx).toBeGreaterThanOrEqual(0);
      const target = evangelion.nodes[idx]!;
      const broken = { ...target, displayName: "Ikari" }; // strip suffix.
      expect(() =>
        validateGraph({
          ...evangelion,
          nodes: [
            ...evangelion.nodes.slice(0, idx),
            broken,
            ...evangelion.nodes.slice(idx + 1),
          ],
        }),
      ).toThrow(/Family node.*\(Family\)/);
    });
  });
});
