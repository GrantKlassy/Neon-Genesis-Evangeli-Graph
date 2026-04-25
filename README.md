[![Sponsor GrantKlassy](https://img.shields.io/badge/Sponsor-GrantKlassy-ea4aaa?logo=github-sponsors&logoColor=white&style=for-the-badge)](https://github.com/sponsors/GrantKlassy)

# Neon-Genesis-Evangeli-Graph

Code last updated @ [2026-04-25](https://github.com/GrantKlassy/Neon-Genesis-Evangeli-Graph/commits/main)

3D WebGL visualization of Neon Genesis Evangelion canon. Three top-level concepts in the basic seed: eight cast characters, the eighteen canonical angels (Adam = 1 through Lilim = 18), and the three Magi nodes bound as a tight triangle (the "3-in-1" joke). Force-directed layout, slow auto-rotation, NERV/Magi-inspired chrome.

Drag to rotate, scroll/pinch to zoom, tap a node for the readout. Hovering or selecting a node highlights the edges that touch it and dims the rest. Pause/resume rotation with the toolbar control. Spoiler-flagged angels and characters keep their cross-connections gated --- the basic seed simply omits any edge that would reveal a late-show identity.

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

The Playwright matrix covers `360x800` (budget Android), `390x844`, `414x896`, `768x1024` (iPad), and `1920x1080`. Unit tests assert that every edge resolves to known nodes, the eight expected characters and three Magi are present, the angels are numbered 1..18 contiguously, the Magi triangle is the shortest spring in the layout, and the force layout keeps connected nodes (especially the Magi triad) much closer than disconnected ones.

E2E tests assert that the WebGL context is acquired, the render loop ticks, the canvas paints non-background pixels, the legend / character / angel / Magi sections render, clicking a node populates the readout panel, the pause/clear controls work, programmatic selection via `window.__nggGraph` updates highlight state, and (separately) that disabling WebGL surfaces a clean fallback so the page stays useful.

## Layout

```
src/
  graph/                  --- typed schema + the canon NGE seed + helpers
    types.ts              --- character / angel / magi node kinds
    evangelion.ts         --- 8 characters, 18 angels, 3 magi, edges
    index.ts              --- color tokens, validation, helpers
  lib/forceLayout.ts      --- pure 3D force-directed layout (deterministic, per-kind spring length)
  scripts/graph3d.ts      --- three.js scene setup, interaction, lifecycle
  components/
    Header.astro          --- title bar + stat counters
    Graph3D.astro         --- canvas host + legend + selected-node panel
    Readout.astro         --- characters / angels / magi cards, footer
    PaletteShowcase.astro --- visual reference for the canon palette
  layouts/Base.astro      --- shell, fonts, meta
  pages/index.astro       --- composition
  styles/global.css       --- Tailwind + NERV/Magi tokens
  theme/palette.ts        --- canon entity color palette (single source of truth)
tests/
  unit/                   --- vitest
  e2e/                    --- playwright
```

## Source

Neon Genesis Evangelion (TV series, 26 episodes) plus End of Evangelion. Angel numbering follows the canonical TV order (Adam = 1, Lilim = 18).
