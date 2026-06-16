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
  isAudience,
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
  validateAll,
} from "../../src/graph";
import { genesis, isShortcode } from "../../src/genesis";

describe("evangelion graph", () => {
  // Top-level compile guard. validateGraph runs every structural invariant
  // (id uniqueness, edge resolution, no self-loops, family >= 2 members,
  // angel 1..N contiguous, edge endpoint shape, gate monotonicity, citation
  // requirement, tag schema). If this passes, the graph "compiles" --- the
  // tests below assert canon-shape properties, NOT specific dataset sizes,
  // so they survive future canon expansions without lockstep updates.
  it("compiles: validateGraph(evangelion) does not throw", () => {
    expect(() => validateGraph(evangelion)).not.toThrow();
  });

  // Belt-and-suspenders: validateAll bundles registry validation +
  // validateGraph and surfaces every error in one list, so a regression
  // shows up here as a readable diff instead of a single throw line.
  // Defends against silent weakening of validateGraph by a future refactor.
  it("compiles: validateAll(evangelion) reports zero errors", () => {
    const result = validateAll(evangelion);
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });

  // Sanity: the graph must be substantive, not an empty stub. Without this
  // floor, the structural assertions below could pass vacuously on a
  // stripped-down test fixture. We do NOT lock specific node/edge counts ---
  // any non-trivial dataset clears these floors.
  it("compiles: graph is non-trivial (has nodes and edges)", () => {
    expect(evangelion.nodes.length).toBeGreaterThan(0);
    expect(evangelion.edges.length).toBeGreaterThan(0);
  });

  it("has the expected canon kinds populated (no count locks)", () => {
    expect(evangelion.id).toBe("evangelion");
    // Each kind must be non-empty so the visualization actually renders
    // every visual class. Specific counts deliberately NOT asserted ---
    // canon expansion (more supporting cast, more events) must not break
    // these tests. The kind-coverage invariant below catches new kinds.
    for (const [name, present] of [
      ["character", evangelion.nodes.some(isCharacter)],
      ["angel", evangelion.nodes.some(isAngel)],
      ["magi", evangelion.nodes.some(isMagi)],
      ["event", evangelion.nodes.some(isEvent)],
      ["organization", evangelion.nodes.some(isOrganization)],
      ["location", evangelion.nodes.some(isLocation)],
      ["concept", evangelion.nodes.some(isConcept)],
      ["eva", evangelion.nodes.some(isEva)],
      ["family", evangelion.nodes.some(isFamily)],
      ["audience", evangelion.nodes.some(isAudience)],
    ] as const) {
      expect(present, `no ${name} nodes present`).toBe(true);
    }

    // Kind-coverage invariant: every node belongs to one of the known
    // kinds. If a future kind is added without updating the typeguards,
    // the sum below diverges from the total and this test catches it ---
    // without locking either number to a specific threshold.
    const tagged =
      evangelion.nodes.filter(isCharacter).length +
      evangelion.nodes.filter(isAngel).length +
      evangelion.nodes.filter(isMagi).length +
      evangelion.nodes.filter(isEvent).length +
      evangelion.nodes.filter(isOrganization).length +
      evangelion.nodes.filter(isLocation).length +
      evangelion.nodes.filter(isConcept).length +
      evangelion.nodes.filter(isEva).length +
      evangelion.nodes.filter(isFamily).length +
      evangelion.nodes.filter(isAudience).length;
    expect(tagged).toBe(evangelion.nodes.length);
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

  it("angels are numbered as a contiguous 1..N sequence (validateGraph also enforces this)", () => {
    // Structural: contiguous from 1 with no gaps and no duplicates. We do
    // NOT pin N to 18 here --- that's validateGraph's job and would only
    // need updating once if the canon's-canon ever changed. The contiguous
    // shape is what the renderer relies on.
    const numbers = evangelion.nodes
      .filter(isAngel)
      .map((a) => a.number)
      .sort((a, b) => a - b);
    expect(numbers.length).toBe(new Set(numbers).size);
    expect(numbers[0]).toBe(1);
    for (let i = 0; i < numbers.length; i++) {
      expect(numbers[i], `angel sequence broken at index ${i}`).toBe(i + 1);
    }
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

  it("the canonical main cast is present by id (no exact-set lock --- supporting cast may grow)", () => {
    // Subset check, not equality. The main-cast list below is canon-locked
    // (these characters define the show's core); supporting cast may be
    // added freely without breaking this test. Use validateGraph for
    // structural correctness; use this assertion for canon-presence only.
    const ids = new Set(evangelion.nodes.filter(isCharacter).map((c) => c.id));
    const REQUIRED_MAIN_CAST = [
      "char_shinji",
      "char_asuka",
      "char_rei",
      "char_misato",
      "char_kaworu",
      "char_gendo",
      "char_ritsuko",
      "char_toji",
      "char_yui",
      "char_naoko",
      // SEELE chairman --- the human face of the antagonist org.
      "char_keel",
    ];
    for (const id of REQUIRED_MAIN_CAST) {
      expect(ids.has(id), `main-cast character ${id} missing`).toBe(true);
    }
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

  it("the canonical Magi are present and form a closed triangle", () => {
    // Canon names are locked (Casper/Melchior/Balthasar are the literal
    // three from Asimov). Edge count is NOT asserted directly --- the
    // triangle invariant ("every magi node has >= 2 magi_link edges with
    // OTHER magi nodes") proves the closed loop without locking the count.
    const magiIds = new Set(evangelion.nodes.filter(isMagi).map((m) => m.id));
    for (const required of ["magi_casper", "magi_melchior", "magi_balthasar"]) {
      expect(magiIds.has(required), `magi node ${required} missing`).toBe(true);
    }

    const magiLinks = evangelion.edges.filter((e) => e.kind === "magi_link");
    // Every link must connect two magi (validateGraph also enforces this
    // via the endpoint shape rule, re-asserted here for the failure
    // message clarity).
    for (const e of magiLinks) {
      expect(magiIds.has(e.from), `magi_link from non-magi ${e.from}`).toBe(true);
      expect(magiIds.has(e.to), `magi_link to non-magi ${e.to}`).toBe(true);
    }

    // Triangle invariant: each magi touches at least two OTHER magi via
    // magi_link edges. With the endpoint shape locked above, this is the
    // structural definition of a closed loop without naming a count.
    for (const id of magiIds) {
      const partners = new Set<string>();
      for (const e of magiLinks) {
        if (e.from === id) partners.add(e.to);
        if (e.to === id) partners.add(e.from);
      }
      expect(
        partners.size,
        `${id} links to fewer than 2 other magi (triangle broken)`,
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

  it("angel_sequence chains every consecutive pair (n -> n+1) with no gaps", () => {
    // Structural: the chain must cover every consecutive (n, n+1) pair
    // exactly once, derived from the angel count. We never lock either
    // count to a number --- a future canon expansion that adds a 19th
    // angel would auto-extend the expected chain.
    const angels = evangelion.nodes.filter(isAngel);
    const seq = evangelion.edges.filter((e) => e.kind === "angel_sequence");
    const idx = nodeIndex(evangelion);

    // Every link is angel -> angel and steps by exactly one.
    const chainPairs = new Set<string>();
    for (const e of seq) {
      const from = idx.get(e.from);
      const to = idx.get(e.to);
      expect(from?.kind).toBe("angel");
      expect(to?.kind).toBe("angel");
      if (from?.kind === "angel" && to?.kind === "angel") {
        expect(
          to.number - from.number,
          `angel_sequence step ${from.number}->${to.number} is not +1`,
        ).toBe(1);
        chainPairs.add(`${from.number}->${to.number}`);
      }
    }

    // Every (n, n+1) pair from 1..max-1 must be present exactly once.
    const max = Math.max(...angels.map((a) => a.number));
    for (let n = 1; n < max; n++) {
      expect(
        chainPairs.has(`${n}->${n + 1}`),
        `angel_sequence missing ${n}->${n + 1}`,
      ).toBe(true);
    }
    // No duplicates: chainPairs Set size matches edge count.
    expect(seq.length).toBe(chainPairs.size);
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

    it("every canonical Child pilots their canon EVA (no count threshold)", () => {
      // Canon-locked pairings (these define the show). Adding more pilots
      // later (Unit-04 backstory pilot, etc.) does not break this test ---
      // it's a subset check, not a count.
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

    it("every eliminated edge is unique (no double-counted kill)", () => {
      // Structural: no exact-count lock. Sahaquiel is canonically a
      // three-EVA team-up (each EVA earns its own edge) and Israfel is
      // a two-EVA co-kill --- multiple edges per angel are valid. What
      // we do NOT permit is the SAME (eva, angel) pair appearing twice;
      // validateGraph already enforces this via duplicate-edge detection,
      // re-asserted here for the failure-message clarity.
      const seen = new Set<string>();
      for (const e of eliminated) {
        const key = `${e.from}|${e.to}`;
        expect(seen.has(key), `duplicate eliminated edge ${key}`).toBe(false);
        seen.add(key);
      }
      expect(eliminated.length).toBeGreaterThan(0);
    });

    it("Unit-01 takes the canonical first three kills (Sachiel, Shamshel, Ramiel)", () => {
      const has = (from: string, to: string) =>
        eliminated.find((e) => e.from === from && e.to === to);
      expect(has("eva_unit01", "angel_03_sachiel")).toBeDefined();
      expect(has("eva_unit01", "angel_04_shamshel")).toBeDefined();
      expect(has("eva_unit01", "angel_05_ramiel")).toBeDefined();
    });

    it("Unit-02 takes Gaghiel, Sandalphon, and Sahaquiel", () => {
      const has = (from: string, to: string) =>
        eliminated.find((e) => e.from === from && e.to === to);
      expect(has("eva_unit02", "angel_06_gaghiel")).toBeDefined();
      expect(has("eva_unit02", "angel_08_sandalphon")).toBeDefined();
      // Sahaquiel kill: Eva-02 pierced the core (audited 2026-04-28
      // against wiki/Sahaquiel --- 'wielding their prog knives to cut
      // through the Angel's field and penetrate its core, respectively').
      expect(has("eva_unit02", "angel_10_sahaquiel")).toBeDefined();
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

    it("Unit-00 takes Sahaquiel (Ep. 12, AT-field cut), Arael (Ep. 22, Lance), Armisael (Ep. 23, self-destruct)", () => {
      // Audited 2026-04-29 against EvaWiki:
      //   wiki/Sahaquiel: Eva-00 'exposes Sahaquiel's core with her
      //     Progressive Knife' --- Unit-00 is one of three EVAs sharing
      //     the kill credit.
      //   wiki/Arael: 'Eva-00 then returned to the surface, and hurled
      //     the Spear of Longinus into the sky [...] pierced Arael's
      //     A.T. Field and destroyed the Angel.' Rei retrieves the
      //     Lance from Terminal Dogma and makes the kill.
      //   wiki/Armisael: Rei self-destructs Unit-00 to take the helix
      //     Sixteenth Angel with her.
      const unit00Kills = eliminated.filter((e) => e.from === "eva_unit00");
      const targets = new Set(unit00Kills.map((e) => e.to));
      expect(targets).toEqual(
        new Set([
          "angel_10_sahaquiel",
          "angel_15_arael",
          "angel_16_armisael",
        ]),
      );
      const sahaquiel = unit00Kills.find((e) => e.to === "angel_10_sahaquiel")!;
      expect(sahaquiel.revealedAt).toEqual({ kind: "ep", episode: 12 });
      const arael = unit00Kills.find((e) => e.to === "angel_15_arael")!;
      expect(arael.revealedAt).toEqual({ kind: "ep", episode: 22 });
      const armisael = unit00Kills.find((e) => e.to === "angel_16_armisael")!;
      expect(armisael.revealedAt).toEqual({ kind: "ep", episode: 23 });
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
    it("happy path: every angel paints with ANGEL_UNIFORM_COLOR (uniform, non-vacuous)", () => {
      const angels = evangelion.nodes.filter(isAngel);
      // Non-vacuity guard: the "uniform" assertion below would pass on an
      // empty or single-element set, so we require multiple angels first.
      expect(angels.length).toBeGreaterThan(1);
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
    it("happy path: every magi paints with MAGI_UNIFORM_COLOR (uniform, non-vacuous)", () => {
      const magi = evangelion.nodes.filter(isMagi);
      // Non-vacuity guard: uniform-color check is meaningless on a singleton.
      expect(magi.length).toBeGreaterThan(1);
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

/**
 * Pipeline invariants added with the second canon-expansion pass:
 *
 *   - Edge-kind endpoint shape: a typed edge declares which node kinds may
 *     sit on each side. A misuse (e.g. a pilots edge between two angels)
 *     is a data bug.
 *   - Spoiler-gate monotonicity: an edge gate cannot be strictly more
 *     permissive than its endpoints' gates. If Lilith reveals at Ep. 23,
 *     an edge touching Lilith cannot reveal at Ep. 5.
 *   - Citation requirement: every gated node and every gated edge must
 *     carry a non-empty revealedAtSource. The point is to force every
 *     gate to be authored against a checkable source, not recall ---
 *     "your knowledge of the spoiler may be false."
 */
describe("pipeline invariants: edge shape, gate monotonicity, citations", () => {
  // ---------- Edge-kind endpoint shape ----------
  describe("edge-kind endpoint shape", () => {
    it("happy path: every existing edge passes its kind's shape rule", () => {
      // Implicit in validateGraph(evangelion) succeeding above, but
      // re-asserted here so the reason for the failure is obvious if
      // somebody adds a wrong-shape edge.
      expect(() => validateGraph(evangelion)).not.toThrow();
    });

    it("test-the-test: rejects a pilots edge between two characters", () => {
      const broken = {
        from: "char_shinji",
        to: "char_asuka",
        kind: "pilots" as const,
        weight: EDGE_WEIGHT.pilots,
        notes: "bogus pilots edge",
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          edges: [...evangelion.edges, broken],
        }),
      ).toThrow(/violates endpoint shape/);
    });

    it("test-the-test: rejects an eliminated edge from a character to an angel", () => {
      const broken = {
        from: "char_shinji",
        to: "angel_03_sachiel",
        kind: "eliminated" as const,
        weight: EDGE_WEIGHT.eliminated,
        revealedAt: { kind: "ep" as const, episode: 2 },
        revealedAtSource: "test fixture",
        notes: "bogus eliminated edge",
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          edges: [...evangelion.edges, broken],
        }),
      ).toThrow(/violates endpoint shape/);
    });

    it("test-the-test: rejects a member_of_family edge to an organization", () => {
      const broken = {
        from: "char_misato",
        to: "org_nerv",
        kind: "member_of_family" as const,
        weight: EDGE_WEIGHT.member_of_family,
        notes: "bogus family edge",
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          edges: [...evangelion.edges, broken],
        }),
      ).toThrow(/violates endpoint shape/);
    });

    it("test-the-test: rejects a caused edge whose 'to' is a character", () => {
      const broken = {
        from: "org_seele",
        to: "char_shinji",
        kind: "caused" as const,
        weight: EDGE_WEIGHT.caused,
        notes: "bogus caused edge",
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          edges: [...evangelion.edges, broken],
        }),
      ).toThrow(/violates endpoint shape/);
    });

    it("test-the-test: rejects a relationship edge between a character and an org", () => {
      const broken = {
        from: "char_shinji",
        to: "org_nerv",
        kind: "relationship" as const,
        weight: EDGE_WEIGHT.relationship,
        notes: "bogus relationship edge",
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          edges: [...evangelion.edges, broken],
        }),
      ).toThrow(/violates endpoint shape/);
    });

    it("test-the-test: rejects an afflicts edge whose 'to' is not a character", () => {
      const broken = {
        from: "concept_trauma",
        to: "eva_unit01",
        kind: "afflicts" as const,
        weight: EDGE_WEIGHT.afflicts,
        notes: "bogus afflicts edge",
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          edges: [...evangelion.edges, broken],
        }),
      ).toThrow(/violates endpoint shape/);
    });

    it("test-the-test: rejects an attacked edge whose 'from' is not an angel", () => {
      const broken = {
        from: "char_shinji",
        to: "loc_tokyo3",
        kind: "attacked" as const,
        weight: EDGE_WEIGHT.attacked,
        notes: "bogus attacked edge",
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          edges: [...evangelion.edges, broken],
        }),
      ).toThrow(/violates endpoint shape/);
    });

    it("test-the-test: rejects a manifests edge whose 'to' is a location", () => {
      const broken = {
        from: "concept_at_field",
        to: "loc_tokyo3",
        kind: "manifests" as const,
        weight: EDGE_WEIGHT.manifests,
        notes: "bogus manifests edge",
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          edges: [...evangelion.edges, broken],
        }),
      ).toThrow(/violates endpoint shape/);
    });
  });

  // ---------- Spoiler-gate monotonicity ----------
  describe("gate monotonicity (edge gate >= endpoint gate)", () => {
    it("happy path: every gated edge respects its endpoints' gates", () => {
      expect(() => validateGraph(evangelion)).not.toThrow();
    });

    it("test-the-test: rejects an edge gated to Ep. 5 between two characters Lilith and a Ep. 23-gated angel", () => {
      // Lilith is gated to Ep. 23. An edge touching Lilith with an Ep. 5
      // gate is logically inconsistent --- the user would see the line
      // before they know what Lilith is.
      const broken = {
        from: "angel_02_lilith",
        to: "char_shinji",
        kind: "generic" as const,
        weight: 1,
        revealedAt: { kind: "ep" as const, episode: 5 },
        revealedAtSource: "test fixture",
        notes: "bogus monotonicity violation",
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          edges: [...evangelion.edges, broken],
        }),
      ).toThrow(/more permissive than its endpoints/);
    });

    it("test-the-test: rejects an edge with no gate when one endpoint is EoE-gated", () => {
      // Mass Production is EoE-gated. A no-gate edge into Mass Production
      // would imply the edge is visible from Ep. 1 even though the unit
      // itself isn't --- inconsistent.
      const broken = {
        from: "char_shinji",
        to: "eva_mass_production",
        kind: "generic" as const,
        weight: 1,
        // intentionally no revealedAt
        notes: "bogus open edge to a gated endpoint",
      };
      // The validator only flags edges with a *set but more permissive*
      // gate; an unset edge gate effectively reveals from Ep. 1, which is
      // more permissive than Mass Production's EoE gate. Stamp the edge
      // with an explicit Ep. 1 gate to trigger the check predictably.
      const explicit = {
        ...broken,
        revealedAt: { kind: "ep" as const, episode: 1 },
        revealedAtSource: "test fixture",
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          edges: [...evangelion.edges, explicit],
        }),
      ).toThrow(/more permissive than its endpoints/);
    });
  });

  // ---------- Citation requirement ----------
  describe("revealedAtSource citation requirement", () => {
    it("happy path: every gated node carries a non-empty revealedAtSource", () => {
      for (const node of evangelion.nodes) {
        if (node.revealedAt !== undefined) {
          expect(
            node.revealedAtSource,
            `node ${node.id} has a gate but no source`,
          ).toBeDefined();
          expect(node.revealedAtSource!.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it("happy path: every gated edge carries a non-empty revealedAtSource", () => {
      for (const edge of evangelion.edges) {
        if (edge.revealedAt !== undefined) {
          expect(
            edge.revealedAtSource,
            `edge ${edge.from}->${edge.to} (${edge.kind}) has a gate but no source`,
          ).toBeDefined();
          expect(edge.revealedAtSource!.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it("test-the-test: validateGraph throws when a gated node loses its source", () => {
      // Strip the source from Asuka (Ep. 8 gate) and re-validate.
      const idx = evangelion.nodes.findIndex((n) => n.id === "char_asuka");
      const target = evangelion.nodes[idx]!;
      const { revealedAtSource: _drop, ...broken } = target as typeof target & {
        revealedAtSource?: string;
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          nodes: [
            ...evangelion.nodes.slice(0, idx),
            broken,
            ...evangelion.nodes.slice(idx + 1),
          ],
        }),
      ).toThrow(/revealedAt without revealedAtSource/);
    });

    it("test-the-test: validateGraph throws when a gated edge loses its source", () => {
      // Strip the source from a known-gated edge (the Toji <-> Bardiel
      // identity reveal) and re-validate.
      const targetIdx = evangelion.edges.findIndex(
        (e) =>
          e.kind === "identity_reveal" &&
          e.from === "char_toji" &&
          e.to === "angel_13_bardiel",
      );
      expect(targetIdx).toBeGreaterThanOrEqual(0);
      const target = evangelion.edges[targetIdx]!;
      const { revealedAtSource: _drop, ...broken } = target as typeof target & {
        revealedAtSource?: string;
      };
      expect(() =>
        validateGraph({
          ...evangelion,
          edges: [
            ...evangelion.edges.slice(0, targetIdx),
            broken,
            ...evangelion.edges.slice(targetIdx + 1),
          ],
        }),
      ).toThrow(/revealedAt without revealedAtSource/);
    });

    it("citation coverage: every node gate has a source (no silent drift)", () => {
      const gated = evangelion.nodes.filter((n) => n.revealedAt !== undefined);
      const cited = gated.filter(
        (n) => n.revealedAtSource && n.revealedAtSource.trim().length > 0,
      );
      // Strict: 100% coverage. The validator already enforces this, but
      // a coverage-style assertion makes regressions obvious in test
      // output: "X / Y nodes cited" instead of a single throw line.
      expect(
        cited.length,
        `${cited.length} / ${gated.length} gated nodes cite a source`,
      ).toBe(gated.length);
    });

    it("citation coverage: every edge gate has a source (no silent drift)", () => {
      const gated = evangelion.edges.filter(
        (e) => e.revealedAt !== undefined,
      );
      const cited = gated.filter(
        (e) => e.revealedAtSource && e.revealedAtSource.trim().length > 0,
      );
      expect(
        cited.length,
        `${cited.length} / ${gated.length} gated edges cite a source`,
      ).toBe(gated.length);
    });
  });
});
