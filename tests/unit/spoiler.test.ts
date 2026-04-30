import { describe, expect, it } from "vitest";
import {
  SPOILER_PROGRESS_DEFAULT,
  SPOILER_PROGRESS_FULL,
  evangelion,
  gateLabel,
  isEdgeMasked,
  isNodeMasked,
  isVisible,
  maskLabel,
  nodeIndex,
  normalizeSpoilerProgress,
  parseSpoilerProgress,
} from "../../src/graph";
import type { Edge, GraphNode, SpoilerProgress } from "../../src/graph/types";

const node = (overrides: Partial<GraphNode> = {}): GraphNode =>
  ({
    id: "test_node",
    kind: "character",
    displayName: "Test",
    shortcodes: ["shinji"],
    role: "tester",
    notes: "",
    ...overrides,
  }) as GraphNode;

describe("isVisible", () => {
  it("treats undefined gate as open", () => {
    expect(isVisible(undefined, SPOILER_PROGRESS_DEFAULT)).toBe(true);
    expect(isVisible(undefined, SPOILER_PROGRESS_FULL)).toBe(true);
  });

  it("ep gate compares against episode threshold", () => {
    const gate = { kind: "ep" as const, episode: 8 };
    expect(isVisible(gate, { episode: 0, eoe: false, rebuild: false })).toBe(false);
    expect(isVisible(gate, { episode: 7, eoe: false, rebuild: false })).toBe(false);
    expect(isVisible(gate, { episode: 8, eoe: false, rebuild: false })).toBe(true);
    expect(isVisible(gate, { episode: 26, eoe: true, rebuild: true })).toBe(true);
  });

  it("eoe gate unlocks via EoE flag OR episode >= 25", () => {
    const gate = { kind: "eoe" as const };
    expect(isVisible(gate, { episode: 0, eoe: false, rebuild: false })).toBe(false);
    expect(isVisible(gate, { episode: 24, eoe: false, rebuild: false })).toBe(false);
    expect(isVisible(gate, { episode: 25, eoe: false, rebuild: false })).toBe(true);
    expect(isVisible(gate, { episode: 0, eoe: true, rebuild: false })).toBe(true);
  });

  it("rebuild gate requires the rebuild flag", () => {
    const gate = { kind: "rebuild" as const };
    expect(isVisible(gate, { episode: 26, eoe: true, rebuild: false })).toBe(false);
    expect(isVisible(gate, { episode: 0, eoe: false, rebuild: true })).toBe(true);
  });
});

describe("maskLabel", () => {
  it("masks alphanumerics with full-block, preserving spaces", () => {
    expect(maskLabel("Asuka Langley Soryu")).toBe("█████ ███████ █████");
  });

  it("preserves punctuation as block too (only whitespace passes)", () => {
    // All non-whitespace becomes block --- punctuation is treated as content.
    expect(maskLabel("Yui Ikari")).toBe("███ █████");
  });

  it("returns empty for empty input", () => {
    expect(maskLabel("")).toBe("");
  });
});

describe("gateLabel", () => {
  it("labels each gate kind for human readout", () => {
    expect(gateLabel(undefined)).toBe("open");
    expect(gateLabel({ kind: "ep", episode: 24 })).toBe("Ep. 24+");
    expect(gateLabel({ kind: "eoe" })).toBe("End of Evangelion");
    expect(gateLabel({ kind: "rebuild" })).toBe("Rebuild films");
  });
});

describe("parseSpoilerProgress", () => {
  it("returns default on null / missing", () => {
    expect(parseSpoilerProgress(null)).toEqual(SPOILER_PROGRESS_DEFAULT);
  });

  it("returns default on invalid JSON", () => {
    expect(parseSpoilerProgress("{not json")).toEqual(SPOILER_PROGRESS_DEFAULT);
  });

  it("clamps episode into [0, 26]", () => {
    expect(parseSpoilerProgress(JSON.stringify({ episode: -5 }))).toEqual({
      episode: 0,
      eoe: false,
      rebuild: false,
    });
    expect(parseSpoilerProgress(JSON.stringify({ episode: 999 }))).toEqual({
      episode: 26,
      eoe: false,
      rebuild: false,
    });
  });

  it("coerces missing booleans to false", () => {
    expect(parseSpoilerProgress(JSON.stringify({ episode: 5 }))).toEqual({
      episode: 5,
      eoe: false,
      rebuild: false,
    });
  });

  it("preserves a fully-formed payload", () => {
    expect(
      parseSpoilerProgress(
        JSON.stringify({ episode: 26, eoe: true, rebuild: false }),
      ),
    ).toEqual({ episode: 26, eoe: true, rebuild: false });
  });

  it("forces episode to 26 when EoE is set with a lower episode", () => {
    // EoE picks up after the TV finale, so eoe=true with episode<26 is an
    // impossible state. We force episode to 26 rather than dropping the EoE
    // flag --- safer to assume the user really has been spoiled.
    expect(
      parseSpoilerProgress(
        JSON.stringify({ episode: 7, eoe: true, rebuild: false }),
      ),
    ).toEqual({ episode: 26, eoe: true, rebuild: false });
    expect(
      parseSpoilerProgress(
        JSON.stringify({ episode: 0, eoe: true, rebuild: true }),
      ),
    ).toEqual({ episode: 26, eoe: true, rebuild: true });
  });
});

describe("normalizeSpoilerProgress (EoE/Rebuild invariants)", () => {
  it("is a no-op for any valid state", () => {
    expect(
      normalizeSpoilerProgress({ episode: 0, eoe: false, rebuild: false }),
    ).toEqual({ episode: 0, eoe: false, rebuild: false });
    expect(
      normalizeSpoilerProgress({ episode: 26, eoe: true, rebuild: true }),
    ).toEqual({ episode: 26, eoe: true, rebuild: true });
    expect(
      normalizeSpoilerProgress({ episode: 26, eoe: true, rebuild: false }),
    ).toEqual({ episode: 26, eoe: true, rebuild: false });
  });

  it("rejects the impossible EoE+ep<26 state by raising episode to 26", () => {
    expect(
      normalizeSpoilerProgress({ episode: 7, eoe: true, rebuild: false }),
    ).toEqual({ episode: 26, eoe: true, rebuild: false });
    expect(
      normalizeSpoilerProgress({ episode: 25, eoe: true, rebuild: false }),
    ).toEqual({ episode: 26, eoe: true, rebuild: false });
  });

  it("rejects the impossible Rebuild-without-EoE state by lifting EoE/episode", () => {
    // Rebuilds remix the TV run + EoE; rebuild=true with eoe=false (or
    // episode<26) is an impossible state. Lift the prerequisites rather
    // than dropping the rebuild flag.
    expect(
      normalizeSpoilerProgress({ episode: 13, eoe: false, rebuild: true }),
    ).toEqual({ episode: 26, eoe: true, rebuild: true });
    expect(
      normalizeSpoilerProgress({ episode: 26, eoe: false, rebuild: true }),
    ).toEqual({ episode: 26, eoe: true, rebuild: true });
  });

  it("clamps episode into [0, 26] in addition to EoE check", () => {
    expect(
      normalizeSpoilerProgress({ episode: -3, eoe: false, rebuild: false }),
    ).toEqual({ episode: 0, eoe: false, rebuild: false });
    expect(
      normalizeSpoilerProgress({ episode: 999, eoe: false, rebuild: false }),
    ).toEqual({ episode: 26, eoe: false, rebuild: false });
  });

  it("the default and full preset states are both valid", () => {
    expect(normalizeSpoilerProgress(SPOILER_PROGRESS_DEFAULT)).toEqual(
      SPOILER_PROGRESS_DEFAULT,
    );
    expect(normalizeSpoilerProgress(SPOILER_PROGRESS_FULL)).toEqual(
      SPOILER_PROGRESS_FULL,
    );
  });
});

describe("isNodeMasked", () => {
  it("open nodes are never masked", () => {
    const n = node({ revealedAt: undefined });
    expect(isNodeMasked(n, SPOILER_PROGRESS_DEFAULT)).toBe(false);
    expect(isNodeMasked(n, SPOILER_PROGRESS_FULL)).toBe(false);
  });

  it("ep-gated node masks below threshold, reveals at and above", () => {
    const n = node({ revealedAt: { kind: "ep", episode: 24 } });
    expect(isNodeMasked(n, { episode: 23, eoe: false, rebuild: false })).toBe(true);
    expect(isNodeMasked(n, { episode: 24, eoe: false, rebuild: false })).toBe(false);
  });
});

describe("isEdgeMasked", () => {
  it("masks an edge whose own gate fails", () => {
    const a = node({ id: "a" });
    const b = node({ id: "b" });
    const nodes = new Map([
      ["a", a],
      ["b", b],
    ]);
    const edge: Edge = {
      from: "a",
      to: "b",
      kind: "identity_reveal",
      revealedAt: { kind: "ep", episode: 18 },
      notes: "",
    };
    expect(isEdgeMasked(edge, { episode: 17, eoe: false, rebuild: false }, nodes)).toBe(true);
    expect(isEdgeMasked(edge, { episode: 18, eoe: false, rebuild: false }, nodes)).toBe(false);
  });

  it("masks an edge whose endpoint is masked even if the edge gate passes", () => {
    const a = node({ id: "a" });
    const b = node({ id: "b", revealedAt: { kind: "ep", episode: 24 } });
    const nodes = new Map([
      ["a", a],
      ["b", b],
    ]);
    const edge: Edge = {
      from: "a",
      to: "b",
      kind: "identity_reveal",
      // Edge gate is open, but endpoint b is gated.
      notes: "",
    };
    expect(isEdgeMasked(edge, { episode: 23, eoe: false, rebuild: false }, nodes)).toBe(true);
    expect(isEdgeMasked(edge, { episode: 24, eoe: false, rebuild: false }, nodes)).toBe(false);
  });
});

describe("evangelion graph spoiler invariants", () => {
  const nodes = nodeIndex(evangelion);

  it("Rei is open from Ep 1 (the node, not the late-show reveal)", () => {
    const rei = nodes.get("char_rei")!;
    expect(rei.revealedAt).toBeUndefined();
  });

  it("Toji is open from Ep 3 as a node", () => {
    const toji = nodes.get("char_toji")!;
    expect(toji.revealedAt).toEqual({ kind: "ep", episode: 3 });
  });

  it("Yui is gated on the late-show flashback episodes", () => {
    const yui = nodes.get("char_yui")!;
    expect(yui.revealedAt?.kind).toBe("ep");
    if (yui.revealedAt?.kind === "ep") {
      expect(yui.revealedAt.episode).toBeGreaterThanOrEqual(20);
    }
  });

  it("Kaworu is gated to Ep 24", () => {
    const kaworu = nodes.get("char_kaworu")!;
    expect(kaworu.revealedAt).toEqual({ kind: "ep", episode: 24 });
  });

  it("Mari is gated to the Rebuild films", () => {
    const mari = nodes.get("char_mari")!;
    expect(mari.revealedAt).toEqual({ kind: "rebuild" });
  });

  it("the Lilim angel is gated to End of Evangelion", () => {
    const lilim = evangelion.nodes.find(
      (n) => n.kind === "angel" && n.id === "angel_18_lilim",
    )!;
    expect(lilim.revealedAt).toEqual({ kind: "eoe" });
  });

  it("Third Impact concept exists and is gated to End of Evangelion", () => {
    // Third Impact moved from the event kind into the concept kind to match
    // its genesis-registry classification (CONCEPTS).
    const ti = evangelion.nodes.find((n) => n.id === "concept_third_impact");
    expect(ti).toBeDefined();
    expect(ti!.kind).toBe("concept");
    expect(ti!.revealedAt).toEqual({ kind: "eoe" });
  });

  it("Toji <-> Bardiel identity edge exists, gated to Ep 18", () => {
    const reveal = evangelion.edges.find(
      (e) =>
        (e.from === "char_toji" && e.to === "angel_13_bardiel") ||
        (e.from === "angel_13_bardiel" && e.to === "char_toji"),
    );
    expect(reveal).toBeDefined();
    expect(reveal!.kind).toBe("identity_reveal");
    expect(reveal!.revealedAt).toEqual({ kind: "ep", episode: 18 });
  });

  it("Kaworu <-> Tabris identity edge exists, gated to Ep 24", () => {
    const reveal = evangelion.edges.find(
      (e) =>
        (e.from === "char_kaworu" && e.to === "angel_17_tabris") ||
        (e.from === "angel_17_tabris" && e.to === "char_kaworu"),
    );
    expect(reveal).toBeDefined();
    expect(reveal!.kind).toBe("identity_reveal");
    expect(reveal!.revealedAt).toEqual({ kind: "ep", episode: 24 });
  });

  it("Rei <-> Yui identity edge exists with an episode gate", () => {
    const reveal = evangelion.edges.find(
      (e) =>
        (e.from === "char_rei" && e.to === "char_yui") ||
        (e.from === "char_yui" && e.to === "char_rei"),
    );
    expect(reveal).toBeDefined();
    expect(reveal!.kind).toBe("identity_reveal");
    expect(reveal!.revealedAt?.kind).toBe("ep");
  });

  it("at progress=default (ep0), Kaworu is masked", () => {
    const kaworu = nodes.get("char_kaworu")!;
    expect(isNodeMasked(kaworu, SPOILER_PROGRESS_DEFAULT)).toBe(true);
  });

  it("at progress=ep17, the Toji-Bardiel edge is masked", () => {
    const edge = evangelion.edges.find(
      (e) =>
        e.from === "char_toji" && e.to === "angel_13_bardiel",
    )!;
    const p: SpoilerProgress = { episode: 17, eoe: false, rebuild: false };
    expect(isEdgeMasked(edge, p, nodes)).toBe(true);
  });

  it("at progress=ep18, Toji and Bardiel are visible AND the identity edge unlocks", () => {
    const toji = nodes.get("char_toji")!;
    const bardiel = nodes.get("angel_13_bardiel")!;
    const edge = evangelion.edges.find(
      (e) => e.from === "char_toji" && e.to === "angel_13_bardiel",
    )!;
    const p: SpoilerProgress = { episode: 18, eoe: false, rebuild: false };
    expect(isNodeMasked(toji, p)).toBe(false);
    expect(isNodeMasked(bardiel, p)).toBe(false);
    expect(isEdgeMasked(edge, p, nodes)).toBe(false);
  });

  it("at progress=full, no node and no edge is masked", () => {
    for (const n of evangelion.nodes) {
      expect(
        isNodeMasked(n, SPOILER_PROGRESS_FULL),
        `node ${n.id} should be visible at full progress`,
      ).toBe(false);
    }
    for (const e of evangelion.edges) {
      expect(
        isEdgeMasked(e, SPOILER_PROGRESS_FULL, nodes),
        `edge ${e.from}->${e.to} should be visible at full progress`,
      ).toBe(false);
    }
  });

  it("at progress=default (ep0), only ep1-introduced nodes are visible", () => {
    const visible = evangelion.nodes.filter(
      (n) => !isNodeMasked(n, SPOILER_PROGRESS_DEFAULT),
    );
    // Ep1-open nodes: Shinji, Rei, Misato, Gendo, Ritsuko (5 chars),
    // Sachiel (1 angel intro'd ep 1). Magi triangle is gated to Ep. 13
    // (Ritsuko's personality-fragment exposition during the Iruel
    // attack), so the three Magi nodes do NOT appear at progress=ep0.
    const visibleIds = new Set(visible.map((n) => n.id));
    expect(visibleIds.has("char_shinji")).toBe(true);
    expect(visibleIds.has("char_rei")).toBe(true);
    expect(visibleIds.has("char_misato")).toBe(true);
    expect(visibleIds.has("char_gendo")).toBe(true);
    expect(visibleIds.has("char_ritsuko")).toBe(true);
    expect(visibleIds.has("angel_03_sachiel")).toBe(true);

    expect(visibleIds.has("magi_casper")).toBe(false);
    expect(visibleIds.has("magi_melchior")).toBe(false);
    expect(visibleIds.has("magi_balthasar")).toBe(false);
    expect(visibleIds.has("char_kaworu")).toBe(false);
    expect(visibleIds.has("char_yui")).toBe(false);
    expect(visibleIds.has("char_naoko")).toBe(false);
    expect(visibleIds.has("char_toji")).toBe(false);
    expect(visibleIds.has("char_asuka")).toBe(false);
    expect(visibleIds.has("char_mari")).toBe(false);
    expect(visibleIds.has("angel_17_tabris")).toBe(false);
    expect(visibleIds.has("angel_18_lilim")).toBe(false);
    expect(visibleIds.has("event_third_impact")).toBe(false);
    expect(visibleIds.has("org_japan_gov")).toBe(false);
  });
});
