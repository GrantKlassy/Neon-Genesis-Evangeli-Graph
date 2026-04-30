[![Sponsor GrantKlassy](https://img.shields.io/badge/Sponsor-GrantKlassy-ea4aaa?logo=github-sponsors&logoColor=white&style=for-the-badge)](https://github.com/sponsors/GrantKlassy)

# [Neon Genesis Evangeli-Graph](https://neongenesisevangeligraph.com/)

Code last updated @ [2026-04-29](https://github.com/GrantKlassy/Neon-Genesis-Evangeli-Graph/commits/main)

A 3D WebGL visualization of *Neon Genesis Evangelion* canon, rendered as an interactive force-directed graph in the browser. The basic seed contains the eight main cast members, the eighteen canonical Angels (Adam through Lilim, numbered 1 through 18), and the three Magi nodes drawn together as a tight triangle --- the show's "three-in-one" design made literal in the layout.

Drag to rotate. Scroll or pinch to zoom. Tap a node to open the readout panel.

## What it shows

- **Characters** --- eight cast nodes, each painted in its canon palette primary.
- **Angels** --- the eighteen canonical Angels chained in TV-series order, all sharing the same AT-field crimson. A `spoilerLevel` flag on each Angel lets future revisions gate the late-show identity reveals.
- **Magi system** --- Casper-3, Melchior-1, and Balthasar-2 share a single color and an unusually short spring length, so the trio always renders as a single tight cluster.

## Spoiler gate

Some Angel and character identities are major late-show reveals. The basic seed deliberately omits any edge that would surface those connections, and a `spoilerLevel` metadata flag on each node lets future renderers hide flagged content behind an explicit unlock.

## Stack

- **[Astro 5](https://astro.build)** static output, **[Tailwind CSS 4](https://tailwindcss.com)**, TypeScript (strict)
- **[three.js](https://threejs.org)** for the WebGL scene
- A custom 3D force-directed layout: pure function, deterministic seed, per-edge-kind spring length, normalized to a fixed bounding sphere so the camera frame stays consistent regardless of node count
- **[Vitest](https://vitest.dev)** for graph and layout invariants
- **[Playwright](https://playwright.dev)** end-to-end coverage across five mobile and desktop viewports

## Getting started

```bash
pnpm install
pnpm run dev          # http://localhost:4321
pnpm run build        # static output to dist/
pnpm run preview      # serve dist/ locally
```

## Tests

```bash
pnpm run test:unit    # graph + force-layout invariants
pnpm run test:e2e     # playwright across 5 viewports
pnpm run test         # both
pnpm run check        # astro / TypeScript type-check
```

The Playwright matrix covers `360x800` (budget Android), `390x844`, `414x896`, `768x1024` (iPad), and `1920x1080`. Unit tests assert canon invariants: eight characters present, eighteen Angels numbered `1..18` contiguously, and three Magi connected by the shortest spring in the layout. End-to-end tests assert that the WebGL context is acquired, the render loop ticks, the canvas paints, the legend and section cards render, clicking a node populates the readout, the pause and clear controls work, programmatic selection via `window.__nggGraph` updates highlight state, and disabling WebGL surfaces a clean readable fallback.

## Project layout

```
src/
  graph/
    types.ts            character / angel / magi node kinds
    evangelion.ts       canon seed: 8 characters, 18 angels, 3 magi
    index.ts            color tokens, validation, helpers
  lib/forceLayout.ts    pure 3D force-directed layout
  scripts/graph3d.ts    three.js scene, interaction, lifecycle
  components/           Astro UI components
  layouts/Base.astro    shell, fonts, palette CSS variables
  pages/index.astro     page composition
  styles/global.css     Tailwind + NERV / Magi color tokens
  theme/palette.ts      canon entity color palette
tests/
  unit/                 vitest
  e2e/                  playwright
```

## License

See [LICENSE.txt](./LICENSE.txt).
