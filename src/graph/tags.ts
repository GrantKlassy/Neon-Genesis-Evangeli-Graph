import type { NodeTag, RevealedAt, SpoilerProgress, TagId } from "./types";

/**
 * Closed-set registry of every tag id a node may carry. Display metadata
 * lives here so the renderer / readout panel render consistent labels and
 * a UI can list every available tag without scanning the graph.
 *
 * Spoiler gating is per-INSTANCE, not per-tag-type: a NodeTag carries its
 * own optional revealedAt that overrides any default. Some tags ("child")
 * are gated differently per node (Shinji from Ep 1, Toji from Ep 17). Some
 * ("dies-by-end-of-series") are always gated to End of Evangelion --- the
 * data file stamps the same revealedAt on every instance for clarity.
 *
 * To add a new tag:
 *   1. Add the id to the TagId union in src/graph/types.ts.
 *   2. Add a TagDef entry below.
 *   3. (Optional) Add a tag-specific canon invariant in
 *      tests/unit/invariants.test.ts.
 */
export interface TagDef {
  id: TagId;
  /** Human-readable label for UI surfaces (readout panel, legend). */
  displayName: string;
  /** One-line description of what this tag means. */
  description: string;
  /**
   * If every instance of this tag should share a single gate (so test
   * invariants can lock it in), name the canonical gate here. Per-instance
   * revealedAt on a NodeTag still wins, but mismatches can be flagged in
   * tests against this canonical value.
   */
  canonicalGate?: RevealedAt;
}

export const TAGS: Record<TagId, TagDef> = {
  child: {
    id: "child",
    displayName: "Child",
    description:
      "One of the designated Children / Eva pilots. Per-instance gates: " +
      "Shinji/Rei open from Ep 1, Asuka from Ep 8, Toji from Ep 17 " +
      "(Fourth-Child reveal), Kaworu from Ep 24 (Fifth-Child reveal).",
  },
  "dies-by-end-of-series": {
    id: "dies-by-end-of-series",
    displayName: "Dies by end of series",
    description:
      "Character is dead by the close of TV Ep 26 + End of Evangelion. " +
      "Always gated to End of Evangelion --- the fact of the death is " +
      "itself a finale-level spoiler.",
    canonicalGate: { kind: "eoe" },
  },
};

/**
 * The full closed list of tag ids, derived from the registry. Convenience
 * for tests and UI iteration.
 */
export const TAG_IDS: readonly TagId[] = Object.keys(TAGS) as TagId[];

/**
 * Type guard: is this string a known tag id?
 */
export function isTagId(value: string): value is TagId {
  return value in TAGS;
}

/**
 * Filter a node's tags to those visible at the given progress. Each tag's
 * own revealedAt is checked; an undefined gate is open from Ep 1 (the same
 * convention as node / edge gates). The caller is responsible for
 * additionally hiding ALL tags when the host node is masked --- a tag
 * leaking through a masked node would defeat the spoiler wall.
 */
export function visibleTags(
  tags: NodeTag[] | undefined,
  progress: SpoilerProgress,
): NodeTag[] {
  if (!tags || tags.length === 0) return [];
  return tags.filter((t) => isTagVisible(t, progress));
}

function isTagVisible(tag: NodeTag, progress: SpoilerProgress): boolean {
  const gate = tag.revealedAt;
  if (!gate) return true;
  switch (gate.kind) {
    case "ep":
      return progress.episode >= gate.episode;
    case "eoe":
      return progress.eoe || progress.episode >= 25;
    case "rebuild":
      return progress.rebuild;
  }
}
