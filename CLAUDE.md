# Neon-Genesis-Evangeli-Graph

3D WebGL visualization of OSINT investigation graphs from `funny3`. Currently visualizes the `wordword4numbers` Reddit account-cluster investigation (8 accounts, 6 communities, ~30 edges).

Tech: Astro 5 + Tailwind CSS 4 + TypeScript strict + three.js. Vitest for unit, Playwright for e2e across 5 viewports.

## Source of truth

The data lives in `src/graph/wordword4numbers.ts`, hand-encoded from `~/git/grantklassy/funny3/investigations/wordword4numbers/GRAPH.md`. **The investigation `GRAPH.md` is the source of truth**, this repo is downstream. When the investigation updates, mirror the change here, do not invent new findings.

The schema is in `src/graph/types.ts`. Helpers (validation, adjacency, color tokens, node radius scaling) live in `src/graph/index.ts` and are re-exported from `src/scripts/graph3d.ts` for the renderer.

## Visual language

NERV / Magi / SEELE inspired, layered on top of the same OLED-black aesthetic as `The-General-Welfare-Project`. Tokens live in `src/styles/global.css`:

- NERV red `#ff2a3c` --- alerts, late-night sync pair, headers, brackets
- Magi green `#5cf5b6` --- normal users, terminal text, success
- EVA orange `#ffae00` --- activity-compression cluster, anomalies
- SEELE purple `#8a2be2` --- privacy-conscious / hidden cluster
- Edge blue `#3a8fff` / `#62b8ff` --- structural community membership

Mobile-first, desktop-good. The graph scales to viewport, overlays adapt to screen size.

## Tests

Unit tests (`tests/unit/`) assert graph invariants: every edge endpoint resolves, no orphan nodes, cluster membership is correct, force layout is deterministic and keeps connected nodes closer than disconnected ones. They run in node, no jsdom needed.

E2E tests (`tests/e2e/`) cover smoke (page renders, no console errors), WebGL launch (context acquired, frames tick, canvas paints), DOM structure (clusters, anomalies, legend), interaction (clicking a node populates the readout), and the no-WebGL fallback (monkey-patches `getContext` before bootstrap).

`waitForGraphState()` in `tests/e2e/_helpers.ts` is the standard way to wait for the renderer to reach `ready` / `no-webgl` / `error`. The renderer exposes `window.__nggGraph` with `state`, `frames`, `nodeCount`, etc., for test assertions.

## Previewing the graph (visual ground-truth)

Code-level checks (unit invariants, e2e selectors, type safety) confirm the data and DOM are correct, but they don't tell you whether the visualization actually looks right. Before reporting any visual change as done --- color tweaks, layout, gate behavior, new node types, edge styling, mobile fit --- snap a screenshot:

```
task local:peek
```

This boots `astro dev`, opens headless Chromium with the spoiler gate pre-revealed via a seeded `localStorage["ngg-spoiler-progress"]` entry (so the gate never paints), waits a random 2.5---9.5s so the auto-rotation lands in a different framing each run, and writes a 4K PNG to `/tmp/ngg-peek.png`.

The script lives at `scripts/peek-graph.mjs`. Env overrides: `OUT`, `PORT`, `DEVICE_SCALE_FACTOR` (default 2 for retina-sharp WebGL), `VIEWPORT_W`, `VIEWPORT_H`, `MIN_WAIT_MS`, `MAX_WAIT_MS`. The localStorage-seed bypass is asserted by `preseeded localStorage bypasses the gate` in `tests/e2e/spoiler.spec.ts` so this workflow can't silently bit-rot --- if the storage key or schema changes, that test fails before peek does.

## Adding an investigation

1. Encode the GRAPH.md tables as a new module in `src/graph/<id>.ts` matching the `InvestigationGraph` shape.
2. Update `src/graph/index.ts` to export it.
3. Update `src/scripts/graph3d.ts` and `src/components/Graph3D.astro` to take the investigation as a prop (currently hard-coded to `wordword4numbers`).
4. Add unit tests asserting the new graph validates and has the expected node/edge counts.
5. Update the README and the page composition.

## Repo standards

Inherits the standard `~/git/grantklassy/` rules: no `Co-Authored-By` trailers, identity managed by `~/.gitconfig` includeIf, push via `github.com-gk` SSH alias, lefthook enforces all of this on commit and push. No em-dashes in tracked files (use `---`).

## Hosting

Not yet deployed. Static output to `dist/` is Cloudflare-Pages-ready (single-page Astro static site). Bundle is ~125 KB gzipped (mostly three.js).
