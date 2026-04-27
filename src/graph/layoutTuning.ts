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
  // Family members orbit their family node at moderate distance --- tight
  // enough that Shinji/Gendo/Yui visibly cluster around Ikari, loose enough
  // that they don't pile on top of each other.
  member_of_family: 3.0,
  // Generic links sit at neutral rest length --- long enough that a dense
  // mesh (e.g. all 5 piloted EVAs fully connected) doesn't collapse into
  // a knot.
  generic: 4.0,
  // EVA <-> defeated-target rest length. Tighter than generic so an EVA
  // visibly settles next to the things it eliminated (Unit-01 by Sachiel,
  // etc.) without overpowering pilots-pulls toward the unit's own pilot.
  eliminated: 3.2,
};

export const EDGE_WEIGHT: Record<EdgeKind, number> = {
  magi_link: 3,
  angel_sequence: 2,
  identity_reveal: 2.2,
  // Pilots edges pull tightly so the pilot/unit pair reads as a coupled
  // glyph in the layout once revealed.
  pilots: 2.5,
  // Family edges pull moderately --- members cluster around the family
  // anchor without overpowering the pilots / identity-reveal pulls that
  // dominate each character's layout neighborhood.
  member_of_family: 2.0,
  // Generic links pull lightly --- they're the lowest-priority connection
  // class, so they tug toward rest without outranking the meaningful
  // structural pulls (magi triangle, family roll-ups, pilot pairs).
  generic: 1.2,
  // Eliminated edges pull moderately --- the EVA reads as visibly tied to
  // the angel/concept it took down, but not as tightly coupled as a pilot
  // <-> unit pair (which is a continuous identity, not a single event).
  eliminated: 2.0,
};
