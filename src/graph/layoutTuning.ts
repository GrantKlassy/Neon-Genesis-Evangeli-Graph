import type { EdgeKind } from "./types";

/**
 * Force-layout tuning constants kept in their own module so both the seed
 * data (src/graph/evangelion.ts) and the index re-exports can read them
 * without creating a circular import.
 *
 * EDGE_SPRING_LENGTH is the rest length of the spring along each edge kind.
 * The magi triangle is the tightest cluster in the graph, the angel chain
 * needs room to unfurl across the 17 canonical links.
 *
 * EDGE_WEIGHT scales the spring constant so the layout equilibrates at a
 * predictable distance. weight > 1 pulls connected nodes toward rest length
 * harder, beating the all-pairs repulsion that would otherwise dominate.
 * The 3-in-1 magi cluster carries the highest weight; angel-sequence is
 * moderate so the canon chain stays grouped without pinning each node to
 * its neighbor; identity_reveal is moderate too --- the late-show "X is
 * really Y" reveals should pull characters toward their identities without
 * collapsing the layout.
 */
export const EDGE_SPRING_LENGTH: Record<EdgeKind, number> = {
  magi_link: 2.5,
  angel_sequence: 3.4,
  identity_reveal: 4.0,
  // Pilots sit close to their EVA --- short rest so Shinji equilibrates
  // visibly adjacent to Unit-01 once the user has unlocked the link.
  pilots: 2.8,
};

export const EDGE_WEIGHT: Record<EdgeKind, number> = {
  magi_link: 3,
  angel_sequence: 2,
  identity_reveal: 2.2,
  // Pilots edges pull tightly so the pilot/unit pair reads as a coupled
  // glyph in the layout once revealed.
  pilots: 2.5,
};
