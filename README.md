[![Sponsor GrantKlassy](https://img.shields.io/badge/Sponsor-GrantKlassy-ea4aaa?logo=github-sponsors&logoColor=white&style=for-the-badge)](https://github.com/sponsors/GrantKlassy)

# Neon-Genesis-Evangeli-Graph

Code last updated @ [2026-04-25](https://github.com/GrantKlassy/Neon-Genesis-Evangeli-Graph/commits/main)

3D WebGL visualization of the `wordword4numbers` Reddit account-cluster investigation from `funny3`. Eight accounts, six communities, edges colored by relation strength, force-directed layout, slow auto-rotation, NERV/Magi-inspired chrome.

Drag to rotate, scroll/pinch to zoom, tap a node for the readout. Hovering or selecting a node highlights the edges that touch it and dims the rest. Pause/resume rotation with the toolbar control. The graph is read-only journalism: every node, edge, and cluster comes from the structured `GRAPH.md` in the source investigation. No exploitation, no contact with targets, public data only.

## Stack

- **Astro 5** (static) + **Tailwind CSS 4** + TypeScript (strict)
- **three.js** for the WebGL scene
- Custom force-directed 3D layout (deterministic seed, pure function, fully unit-tested)
- **Vitest** for graph + layout invariants
- **Playwright** across five viewports for end-to-end + WebGL launch coverage

## Run it

```bash
pnpm install
pnpm run dev          # http://localhost:4321
pnpm run build        # static output to dist/
pnpm run preview
```

## Tests

```bash
pnpm run test:unit    # vitest --- graph data + force layout invariants
pnpm run test:e2e     # playwright --- 5 viewports x ~22 specs
pnpm run test         # both
pnpm run test:e2e:ui  # playwright UI mode
pnpm run check        # astro check (TS)
pnpm run perf         # lighthouse CI mobile budgets
```

The Playwright matrix covers `360x800` (budget Android), `390x844`, `414x896`, `768x1024` (iPad), and `1920x1080`. Unit tests assert that every edge resolves to known nodes, no orphans, the late-night-pair cluster contains exactly A7 and A8, and the force layout keeps connected nodes closer than disconnected ones.

E2E tests assert that the WebGL context is acquired, the render loop ticks, the canvas paints non-background pixels, the legend / cluster cards / anomalies render, clicking a node populates the readout panel, the pause/clear controls work, programmatic selection via `window.__nggGraph` updates highlight state, and (separately) that disabling WebGL surfaces a clean fallback so the page stays useful.

## Layout

```
src/
  graph/                  --- typed schema + the wordword4numbers data + helpers
  lib/forceLayout.ts      --- pure 3D force-directed layout (deterministic)
  scripts/graph3d.ts      --- three.js scene setup, interaction, lifecycle
  components/
    Header.astro          --- title bar + stat counters
    Graph3D.astro         --- canvas host + legend + selected-node panel
    Readout.astro         --- cluster cards, anomalies, open threads, footer
  layouts/Base.astro      --- shell, fonts, meta
  pages/index.astro       --- composition
  styles/global.css       --- Tailwind + NERV/Magi tokens
tests/
  unit/                   --- vitest
  e2e/                    --- playwright
```

## Source

Investigation graph: `funny3/investigations/wordword4numbers/GRAPH.md`.
