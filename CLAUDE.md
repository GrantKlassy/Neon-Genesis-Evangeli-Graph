# Neon-Genesis-Evangeli-Graph

3D WebGL visualization of *Neon Genesis Evangelion* canon, rendered as a force-directed graph in the browser. The current dataset spans 90 nodes / 292 edges across characters, the eighteen canonical Angels, the three Magi (now wired to NERV and Tokyo-3 as the majority-vote rulers of both), EVA units, organizations, locations, concepts (including the psych-trait hubs --- trauma, rejection, abandonment, hedgehog's dilemma, depression --- wired to the characters who carry them, and the A.T. Field wired in as a cross-cutting hub), events, and the singular YOU=Lilim audience node.

Tech: Astro 5 + Tailwind CSS 4 + TypeScript strict + three.js. Vitest for unit, Playwright for e2e across 5 viewports.

## Canon scope

**The 1995 TV series + End of Evangelion only.** The Rebuild tetralogy is a parallel timeline and is INTENTIONALLY out of scope --- this graph is the "true" canon view. There is no `mari`, no `wille`, no `rebuild` gate kind anywhere in the schema, and the unit-test suite has a guard invariant that fails if any of those three slip back in.

When canon needs sourcing, lean on:

- **EvaGeeks Wiki** --- `https://wiki.evageeks.org/<slug>` (every gated entity carries a `revealedAtSource` URL pointing here)
- **Evangelion Fandom Wiki** --- `https://evangelion.fandom.com/wiki/<slug>`

Both are TV+EoE-aware. Per the citation invariant in `validateGraph`, every gated node and every gated edge MUST declare a non-empty `revealedAtSource` --- the validator throws when a gate appears without one. The point is that "your knowledge of a spoiler may be false" --- gates must be authored against a checkable source, not from recall.

## Source of truth

Graph data lives in `src/graph/evangelion.ts`. Schema in `src/graph/types.ts`. Helpers (validation, adjacency, color tokens, node radius scaling, spoiler-gate logic) live in `src/graph/index.ts` and are re-exported from `src/scripts/graph3d.ts` for the renderer.

The genesis registry (`src/genesis/registry.ts`) is the parallel source of truth for entity *identity* --- every node carries exactly one shortcode (`shinji`, `unit01`, `nerv`, `keel`, ...) that resolves to a registry entry with display name, primary/secondary colors, aliases for the body-text highlighter, and an optional `evageeksSlug`.

## Visual language

NERV / Magi / SEELE inspired, layered on OLED-black. Tokens in `src/styles/global.css`:

- NERV red `#ff2a3c` --- alerts, identity reveals, kill chain, headers
- Magi green `#5cf5b6` --- magi triangle, terminal text, success
- EVA orange `#ffae00` --- EVA chrome, anomalies
- SEELE purple `#8a2be2` --- events, late-show flashpoints
- Edge blue `#3a8fff` / `#62b8ff` --- structural family / location lines

Each EVA unit pulls its own canon body color from genesis (Unit-00 blue, Unit-01 purple, Unit-02 red, Unit-03 black, Unit-04 silver, MP white). Every other kind paints with a kind-uniform color --- the visual punchline of "all magi are one node," "all angels are one threat class," and so on.

Mobile-first, desktop-good. The graph scales to viewport, overlays adapt to screen size.

## Spoiler gate

A modal opens on first visit, lets the user say where they are in the show, and persists the tier to `localStorage["ngg-spoiler-progress"]`. Schema: `{ episode: 0..26, eoe: boolean }`. Anything past the user's tier renders as full-block masked silhouettes; the renderer also filters masked edges out of the force layout so a hidden relationship contributes zero pull.

Gate kinds:

- `{ kind: "ep", episode: N }` --- visible iff `progress.episode >= N`
- `{ kind: "eoe" }` --- visible iff `progress.eoe || progress.episode >= 25` (the TV finale covers the same Instrumentality material EoE re-renders)

Node and edge gates are independent. Rei's node opens at Ep. 1; the Rei <-> Yui identity edge stays gated to Ep. 23 even when both endpoints have already rendered.

## Tests

Unit tests (`tests/unit/`) assert canon invariants: angel numbering 1..18, the three Magi tightly linked, every node carries exactly one valid genesis shortcode, every gated entity cites a source, kind-uniform colors hold, family roll-ups have at least 2 members, edge endpoint shapes match their kind, no Rebuild leak. They run in node, no jsdom needed.

E2E tests (`tests/e2e/`) cover smoke (page renders, no console errors), WebGL launch (context acquired, frames tick, canvas paints), DOM structure (sections, cards, legend), interaction (clicking a node populates the readout, programmatic selection via `window.__nggGraph`), the spoiler-gate flow (first-visit prompt, persistence, force-eject, re-mask on tier change, dies-by-end-of-series badge gating), and the no-WebGL fallback (monkey-patches `getContext` before bootstrap).

`waitForGraphState()` in `tests/e2e/_helpers.ts` is the standard way to wait for the renderer to reach `ready` / `no-webgl` / `error`. The renderer exposes `window.__nggGraph` with `state`, `frames`, `nodeCount`, `isNodeMasked(id)`, etc., for test assertions.

## Previewing the graph (visual ground-truth)

Code-level checks (unit invariants, e2e selectors, type safety) confirm the data and DOM are correct, but they don't tell you whether the visualization actually looks right. Before reporting any visual change as done --- color tweaks, layout, gate behavior, new node types, edge styling, mobile fit --- snap a screenshot:

```
task local:peek
```

This boots `astro dev`, opens headless Chromium with the spoiler gate pre-revealed via a seeded `localStorage["ngg-spoiler-progress"]` entry (so the gate never paints), waits a random 2.5---9.5s so the auto-rotation lands in a different framing each run, and writes a 4K PNG to `/tmp/ngg-peek.png`.

The script lives at `scripts/peek-graph.mjs`. Env overrides: `OUT`, `PORT`, `DEVICE_SCALE_FACTOR` (default 2 for retina-sharp WebGL), `VIEWPORT_W`, `VIEWPORT_H`, `MIN_WAIT_MS`, `MAX_WAIT_MS`. The localStorage-seed bypass is asserted by `preseeded localStorage bypasses the gate` in `tests/e2e/spoiler.spec.ts` so this workflow can't silently bit-rot --- if the storage key or schema changes, that test fails before peek does.

## Adding a new canon entity

1. Add a genesis registry entry to `src/genesis/registry.ts` (shortcode, kind, display name, hex colors, aliases, optional EvaWiki slug).
2. Add a graph node to the appropriate array in `src/graph/evangelion.ts` (characters / angels / magi / organizations / locations / concepts / events / evas / families / audience).
3. If the entity introduces canon-spoilery information, gate it: set `revealedAt` on the node AND cite the source in `revealedAtSource`. The validator throws on a gate without a source.
4. Add edges connecting it to the rest of the graph. For typed edges (pilots / member_of_family / member_of_org / located_in / caused / eliminated / identity_reveal / relationship / afflicts / attacked / manifests) the validator enforces an endpoint-kind shape --- a `pilots` edge MUST be character <-> eva, an `eliminated` edge MUST be eva -> angel, an `attacked` edge MUST be angel -> location/eva/character, a `relationship` edge MUST be character <-> character, etc. Only `generic` carries no shape constraint --- it is the catch-all for ties that fit no typed class (the EVA<->EVA mesh, equipment mechanics, the SEELE/Instrumentality scheming web).
5. Bump the unit-test counts in `tests/unit/graph.test.ts` and the e2e counts in `tests/e2e/webgl.spec.ts`.
6. Run `pnpm run test:unit && pnpm run check && pnpm run build`. If the visual result matters, also run `task local:peek` and check the screenshot.

## Repo standards

No `Co-Authored-By` trailers. No em-dashes in tracked files (use `---`). Lefthook enforces both on commit and push.

## Hosting

Not yet deployed. Static output to `dist/` is Cloudflare-Pages-ready (single-page Astro static site). Bundle is ~125 KB gzipped (mostly three.js).
