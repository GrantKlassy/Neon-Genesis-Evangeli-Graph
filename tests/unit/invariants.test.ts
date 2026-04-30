import { describe, expect, it } from "vitest";
import {
  SPOILER_PROGRESS_DEFAULT,
  SPOILER_PROGRESS_FULL,
  TAGS,
  TAG_IDS,
  evangelion,
  isCharacter,
  isTagId,
  validateGraph,
  visibleTags,
} from "../../src/graph";
import type { CharacterNode, NodeTag } from "../../src/graph";

/**
 * Locked invariants (April 2026). Each invariant has a "happy path"
 * assertion against the live evangelion seed AND a "test the test"
 * negative case that hand-builds a violating input and confirms
 * validateGraph (or the helper under test) catches it. Without the
 * negative cases the positive assertions could quietly pass against
 * a bug --- e.g. a tag check could vacuously pass on a graph with
 * no tags at all.
 *
 * Scope: NEW invariants introduced alongside the tag system. Pre-existing
 * invariants (unique node ids, edge endpoints resolve, no self-loops,
 * angel numbering 1..18, kind-uniform colors, family >= 2 members,
 * displayName suffix rules) live in tests/unit/graph.test.ts and are
 * not duplicated here.
 */

describe("Invariant: no duplicate edges", () => {
  it("happy path: the seed has no duplicate edges (same endpoints + kind)", () => {
    const seen = new Set<string>();
    for (const e of evangelion.edges) {
      const [lo, hi] = e.from < e.to ? [e.from, e.to] : [e.to, e.from];
      const key = `${lo}|${hi}|${e.kind}`;
      expect(seen.has(key), `duplicate edge ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("test-the-test: validateGraph throws on a duplicate edge in the SAME direction", () => {
    const dup = evangelion.edges[0]!;
    expect(() =>
      validateGraph({
        ...evangelion,
        edges: [...evangelion.edges, { ...dup }],
      }),
    ).toThrow(/Duplicate edge/);
  });

  it("test-the-test: validateGraph throws on a duplicate edge in the REVERSED direction (undirected)", () => {
    const orig = evangelion.edges[0]!;
    const reversed = { ...orig, from: orig.to, to: orig.from };
    expect(() =>
      validateGraph({
        ...evangelion,
        edges: [...evangelion.edges, reversed],
      }),
    ).toThrow(/Duplicate edge/);
  });
});

describe("Invariant: tag schema", () => {
  it("happy path: every tag id on every node resolves in the TAGS registry", () => {
    let totalTags = 0;
    for (const node of evangelion.nodes) {
      if (!node.tags) continue;
      for (const tag of node.tags) {
        totalTags++;
        expect(
          isTagId(tag.id),
          `node ${node.id} has unknown tag "${tag.id}"`,
        ).toBe(true);
        expect(TAGS[tag.id]).toBeDefined();
      }
    }
    // Sanity: at least SOME nodes carry tags --- otherwise this test is
    // vacuously true on an empty data set.
    expect(totalTags).toBeGreaterThan(0);
  });

  it("happy path: TAG_IDS matches the keys of the TAGS registry", () => {
    expect(new Set(TAG_IDS)).toEqual(new Set(Object.keys(TAGS)));
    for (const id of TAG_IDS) {
      expect(TAGS[id].id).toBe(id);
    }
  });

  it("test-the-test: validateGraph throws on an unknown tag id", () => {
    const target = evangelion.nodes.find(isCharacter)!;
    const broken: CharacterNode = {
      ...target,
      tags: [{ id: "not-a-real-tag" as never }],
    };
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: evangelion.nodes.map((n) => (n.id === target.id ? broken : n)),
      }),
    ).toThrow(/unknown tag id/);
  });

  it("test-the-test: validateGraph throws on a duplicate tag on the same node", () => {
    const target = evangelion.nodes.find(isCharacter)!;
    const broken: CharacterNode = {
      ...target,
      tags: [{ id: "child" }, { id: "child" }],
    };
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: evangelion.nodes.map((n) => (n.id === target.id ? broken : n)),
      }),
    ).toThrow(/duplicate tag/);
  });

  it("test-the-test: validateGraph throws on a malformed tag entry (missing id)", () => {
    const target = evangelion.nodes.find(isCharacter)!;
    const broken: CharacterNode = {
      ...target,
      tags: [{} as NodeTag],
    };
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: evangelion.nodes.map((n) => (n.id === target.id ? broken : n)),
      }),
    ).toThrow(/malformed tag/);
  });

  it("test-the-test: validateGraph throws on a tag with an invalid revealedAt episode", () => {
    const target = evangelion.nodes.find(isCharacter)!;
    const broken: CharacterNode = {
      ...target,
      tags: [{ id: "child", revealedAt: { kind: "ep", episode: 0 } }],
    };
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: evangelion.nodes.map((n) => (n.id === target.id ? broken : n)),
      }),
    ).toThrow(/episode must be 1\.\.26/);
  });
});

describe("Invariant: dies-by-end-of-series tag is always gated to End of Evangelion", () => {
  it("happy path: every dies-by-end-of-series instance carries revealedAt = { kind: 'eoe' }", () => {
    let count = 0;
    for (const node of evangelion.nodes) {
      if (!node.tags) continue;
      for (const tag of node.tags) {
        if (tag.id !== "dies-by-end-of-series") continue;
        count++;
        expect(
          tag.revealedAt,
          `node ${node.id} dies-by-end-of-series gate`,
        ).toEqual({ kind: "eoe" });
      }
    }
    expect(count).toBeGreaterThan(0);
  });

  it("happy path: TAGS registry pins the canonical gate for dies-by-end-of-series", () => {
    expect(TAGS["dies-by-end-of-series"].canonicalGate).toEqual({
      kind: "eoe",
    });
  });

  it("test-the-test: validateGraph throws when a dies-by-end-of-series tag uses a non-eoe gate", () => {
    const target = evangelion.nodes.find(
      (n) => n.id === "char_misato",
    ) as CharacterNode;
    const broken: CharacterNode = {
      ...target,
      tags: [
        { id: "dies-by-end-of-series", revealedAt: { kind: "ep", episode: 25 } },
      ],
    };
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: evangelion.nodes.map((n) => (n.id === target.id ? broken : n)),
      }),
    ).toThrow(/canonical gate/);
  });

  it("test-the-test: validateGraph throws when a dies-by-end-of-series tag is missing its gate", () => {
    const target = evangelion.nodes.find(
      (n) => n.id === "char_misato",
    ) as CharacterNode;
    const broken: CharacterNode = {
      ...target,
      tags: [{ id: "dies-by-end-of-series" }],
    };
    expect(() =>
      validateGraph({
        ...evangelion,
        nodes: evangelion.nodes.map((n) => (n.id === target.id ? broken : n)),
      }),
    ).toThrow(/canonical gate/);
  });
});

describe("Invariant: 'child' tag is restricted to characters who pilot an EVA", () => {
  // Canonical TV/EoE Children: Shinji (3rd), Asuka (2nd), Rei (1st),
  // Toji (4th), Kaworu (5th). Mari is Rebuild-only and intentionally
  // not tagged --- the "Eighth" designation is Rebuild canon, not TV.
  const EXPECTED_CHILDREN: ReadonlyArray<string> = [
    "char_shinji",
    "char_rei",
    "char_asuka",
    "char_toji",
    "char_kaworu",
  ];

  it("happy path: exactly the expected character ids carry the 'child' tag", () => {
    const tagged = evangelion.nodes
      .filter(isCharacter)
      .filter((c) => c.tags?.some((t) => t.id === "child"))
      .map((c) => c.id);
    expect(new Set(tagged)).toEqual(new Set(EXPECTED_CHILDREN));
  });

  it("happy path: 'child' tag only ever appears on character nodes", () => {
    for (const node of evangelion.nodes) {
      if (!node.tags) continue;
      const hasChild = node.tags.some((t) => t.id === "child");
      if (hasChild) {
        expect(
          node.kind,
          `non-character ${node.id} cannot carry 'child' tag`,
        ).toBe("character");
      }
    }
  });

  it("happy path: every 'child' character EXCEPT Kaworu has a pilots edge to an EVA", () => {
    // Kaworu is canonically a Child (the Fifth) but his graph-defining
    // edge is the Tabris identity_reveal, not a pilots edge --- his
    // brief commandeering of Unit-02 in Ep 24 is not material enough to
    // warrant a permanent pilots line in the visualization. The other
    // four Children (Shinji, Rei, Asuka, Toji) each anchor to a unit.
    const pilots = evangelion.edges.filter((e) => e.kind === "pilots");
    const requirePilots = EXPECTED_CHILDREN.filter((id) => id !== "char_kaworu");
    for (const id of requirePilots) {
      const piloted = pilots.find((e) => e.from === id || e.to === id);
      expect(piloted, `${id} has no pilots edge`).toBeDefined();
    }
  });

  it("happy path: Toji's 'child' tag is gated to Ep 17 (Fourth-Child reveal)", () => {
    const toji = evangelion.nodes.find(
      (n) => n.id === "char_toji",
    ) as CharacterNode;
    expect(toji).toBeDefined();
    const childTag = toji.tags?.find((t) => t.id === "child");
    expect(childTag).toBeDefined();
    expect(childTag!.revealedAt).toEqual({ kind: "ep", episode: 17 });
  });

  it("happy path: Kaworu's 'child' tag inherits visibility from his node gate (no per-instance override)", () => {
    // Kaworu's node is gated to Ep 24 already, so the "child" tag does
    // not need its own gate --- a masked node hides its tags.
    const kaworu = evangelion.nodes.find(
      (n) => n.id === "char_kaworu",
    ) as CharacterNode;
    expect(kaworu.revealedAt).toEqual({ kind: "ep", episode: 24 });
    const childTag = kaworu.tags?.find((t) => t.id === "child");
    expect(childTag).toBeDefined();
    expect(childTag!.revealedAt).toBeUndefined();
  });
});

describe("Invariant: visibleTags spoiler logic", () => {
  it("a default-progress viewer sees Toji's 'child' tag as hidden but Shinji's as visible", () => {
    const shinji = evangelion.nodes.find(
      (n) => n.id === "char_shinji",
    ) as CharacterNode;
    const toji = evangelion.nodes.find(
      (n) => n.id === "char_toji",
    ) as CharacterNode;

    // Shinji: open-from-Ep-1 child tag, even at episode 0.
    expect(visibleTags(shinji.tags, SPOILER_PROGRESS_DEFAULT)).toEqual([
      { id: "child" },
    ]);

    // Toji: child tag gated to Ep 17, hidden at episode 0.
    expect(visibleTags(toji.tags, SPOILER_PROGRESS_DEFAULT)).toEqual([]);
  });

  it("a viewer at Ep 17 sees Toji's 'child' tag", () => {
    const toji = evangelion.nodes.find(
      (n) => n.id === "char_toji",
    ) as CharacterNode;
    const progress = { episode: 17, eoe: false, rebuild: false };
    const visible = visibleTags(toji.tags, progress);
    expect(visible.map((t) => t.id)).toEqual(["child"]);
  });

  it("a fully-spoiled viewer sees every dies-by-end-of-series tag", () => {
    let visibleDeaths = 0;
    for (const node of evangelion.nodes) {
      if (!node.tags) continue;
      const visible = visibleTags(node.tags, SPOILER_PROGRESS_FULL);
      for (const t of visible) {
        if (t.id === "dies-by-end-of-series") visibleDeaths++;
      }
    }
    // Tagged: Asuka, Rei, Misato, Kaworu, Gendo, Ritsuko, Kaji, Fuyutsuki
    // --- 8 deaths.
    expect(visibleDeaths).toBe(8);
  });

  it("a viewer at Ep 25+ unlocks dies-by-end-of-series tags WITHOUT eoe flag (TV finale covers Instrumentality)", () => {
    // Mirrors the existing isVisible logic: ep 25+ counts as eoe coverage.
    const asuka = evangelion.nodes.find(
      (n) => n.id === "char_asuka",
    ) as CharacterNode;
    const progress = { episode: 25, eoe: false, rebuild: false };
    const visible = visibleTags(asuka.tags, progress);
    expect(visible.map((t) => t.id).sort()).toEqual(
      ["child", "dies-by-end-of-series"].sort(),
    );
  });

  it("an empty / undefined tags array returns an empty visible list", () => {
    expect(visibleTags(undefined, SPOILER_PROGRESS_FULL)).toEqual([]);
    expect(visibleTags([], SPOILER_PROGRESS_FULL)).toEqual([]);
  });
});

/**
 * Rebuild content lives in src/graph/rebuild.ts and is spread into
 * evangelion.ts at the bottom. The module is the single landing pad for
 * Rebuild-only nodes/edges --- this invariant keeps the contract honest:
 * if anything in rebuild.ts forgets its rebuild gate, future Rebuild
 * additions risk leaking into the TV+EoE canon view.
 */
describe("Invariant: Rebuild module entries all carry a rebuild gate", () => {
  it("every node in rebuild.ts has revealedAt={kind:'rebuild'}", async () => {
    const { rebuildCharacters, rebuildOrganizations } = await import(
      "../../src/graph/rebuild"
    );
    const all = [...rebuildCharacters, ...rebuildOrganizations];
    expect(all.length).toBeGreaterThan(0);
    for (const n of all) {
      expect(n.revealedAt).toEqual({ kind: "rebuild" });
      expect(n.revealedAtSource).toBeTruthy();
    }
  });

  it("every edge in rebuild.ts has revealedAt={kind:'rebuild'}", async () => {
    const { rebuildEdges } = await import("../../src/graph/rebuild");
    expect(rebuildEdges.length).toBeGreaterThan(0);
    for (const e of rebuildEdges) {
      expect(e.revealedAt).toEqual({ kind: "rebuild" });
      expect(e.revealedAtSource).toBeTruthy();
    }
  });

  it("the merged evangelion seed includes Mari and WILLE", () => {
    const ids = new Set(evangelion.nodes.map((n) => n.id));
    expect(ids.has("char_mari")).toBe(true);
    expect(ids.has("org_wille")).toBe(true);
  });
});
