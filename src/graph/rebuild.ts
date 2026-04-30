import type { CharacterNode, Edge, OrganizationNode } from "./types";
import { EDGE_WEIGHT } from "./layoutTuning";

/**
 * Rebuild-of-Evangelion content. The Rebuild films are a parallel timeline
 * to the TV+EoE canon; everything here is gated to { kind: "rebuild" } and
 * only renders when the user explicitly checks the Rebuild box in the
 * spoiler gate. This module is the single landing pad for new Rebuild
 * additions --- evangelion.ts spreads these arrays in unchanged.
 *
 * Tooling invariant (enforced by tests/unit/invariants.test.ts):
 *   every node here has revealedAt: { kind: "rebuild" }, and
 *   every edge here has revealedAt: { kind: "rebuild" }.
 *
 * To add Rebuild content later: append to the appropriate array below,
 * cite the EvaWiki source on `revealedAtSource`, and the invariant test
 * + the existing renderer will pick it up without any other wiring.
 */

export const rebuildCharacters: CharacterNode[] = [
  {
    id: "char_mari",
    kind: "character",
    displayName: "Mari Makinami Illustrious",
    shortcodes: ["mari"],
    role: "Pilot (Rebuild)",
    revealedAt: { kind: "rebuild" },
    revealedAtSource:
      "https://wiki.evageeks.org/Mari_Makinami_Illustrious --- Rebuild-only pilot, no TV-canon presence",
    notes:
      "Rebuild-only pilot, no TV-canon presence. Magenta plug suit, twin braids, round glasses. Excitable, opportunistic, hums and sings inside the entry plug. Slips into Unit-02 (and later other units) as casually as borrowing a coat --- the first cast member who seems to actually enjoy being inside a giant robot.",
  },
];

export const rebuildOrganizations: OrganizationNode[] = [
  {
    id: "org_wille",
    kind: "organization",
    name: "WILLE",
    displayName: "WILLE",
    shortcodes: ["wille"],
    revealedAt: { kind: "rebuild" },
    revealedAtSource:
      "https://wiki.evageeks.org/Wille --- WILLE is a Rebuild-only organization (Evangelion 3.0 onwards)",
    notes:
      "Anti-NERV organization formed in the Rebuild timeline. Operates the AAA Wunder under Misato.",
  },
];

/**
 * Rebuild-only edges. Stamped with explicit { kind: "rebuild" } gates even
 * when both endpoints are rebuild-gated --- the invariant test reads each
 * edge's own gate, not its endpoints.
 */
export const rebuildEdges: Edge[] = [
  {
    from: "org_wille",
    to: "org_nerv",
    kind: "generic",
    weight: EDGE_WEIGHT.generic,
    revealedAt: { kind: "rebuild" },
    revealedAtSource: "Inherits WILLE's Rebuild-only gate",
    shortcodes: ["wille", "nerv"],
    notes: "WILLE breaks from NERV in the Rebuild timeline.",
  },
];
