[![Sponsor GrantKlassy](https://img.shields.io/badge/Sponsor-GrantKlassy-ea4aaa?logo=github-sponsors&logoColor=white&style=for-the-badge)](https://github.com/sponsors/GrantKlassy)

# [Neon Genesis Evangeli-Graph](https://neongenesisevangeligraph.com/)

## Stack

- **[Astro 5](https://astro.build)** static output, **[Tailwind CSS 4](https://tailwindcss.com)**, TypeScript (strict)
- **[three.js](https://threejs.org)** for the WebGL scene
- A custom 3D force-directed layout: pure function, deterministic seed, per-edge-kind spring length, normalized to a fixed bounding sphere so the camera frame stays consistent regardless of node count
- **[Vitest](https://vitest.dev)** for graph and layout invariants (230 tests)
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

The Playwright matrix covers `360x800` (budget Android), `390x844`, `414x896`, `768x1024` (iPad), and `1920x1080`. Unit tests assert canon invariants: nineteen characters present, eighteen Angels numbered `1..18` contiguously, three Magi connected by the shortest spring in the layout, every node's shortcode resolves in the genesis registry, every gated entity cites its source, no Rebuild content has leaked back in. End-to-end tests assert that the WebGL context is acquired, the render loop ticks, the canvas paints, the legend and section cards render, clicking a node populates the readout, the pause and clear controls work, programmatic selection via `window.__nggGraph` updates highlight state, the spoiler gate prompts on first visit and respects persistence, and disabling WebGL surfaces a clean readable fallback.

## Project layout

```
src/
  graph/
    types.ts            node kinds, edge kinds, spoiler-progress shape
    evangelion.ts       canon graph: 88 nodes, 123 edges
    tags.ts             closed-set tag registry (child / dies-by-end-of-series)
    layoutTuning.ts     per-edge-kind spring length and weight
    index.ts            color tokens, validation, spoiler helpers
  genesis/
    types.ts            shortcode entry shape
    registry.ts         the canonical shortcode -> identity table
    highlight.ts        case-insensitive longest-match highlighter
    index.ts            color resolution, alias lookup, CSS-var emission
  lib/forceLayout.ts    pure 3D force-directed layout
  scripts/graph3d.ts    three.js scene, interaction, lifecycle
  components/           Astro UI (Header / Graph3D / Readout / SpoilerGate / G)
  layouts/Base.astro    shell, fonts, palette CSS variables
  pages/index.astro     page composition
  styles/global.css     Tailwind + NERV / Magi color tokens
tests/
  unit/                 vitest (graph, genesis, spoiler, highlight, force layout, invariants)
  e2e/                  playwright (smoke, structure, webgl, interaction, spoiler, no-webgl, controls, timeline, genesis)
```

## License

See [LICENSE](./LICENSE).
