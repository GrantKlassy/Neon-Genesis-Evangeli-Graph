[![Sponsor GrantKlassy](https://img.shields.io/badge/Sponsor-GrantKlassy-ea4aaa?logo=github-sponsors&logoColor=white&style=for-the-badge)](https://github.com/sponsors/GrantKlassy)

# [Neon Genesis Evangeli-Graph](https://neongenesisevangeligraph.com/)

Code last updated @ [2026-05-02](https://github.com/GrantKlassy/Neon-Genesis-Evangeli-Graph/commits/main)

A 3D WebGL visualization of *Neon Genesis Evangelion* canon, rendered as an interactive force-directed graph in the browser. Eighty-eight nodes, one hundred twenty-three edges --- characters, the eighteen canonical Angels (Adam through Lilim, numbered 1 through 18), the three Magi drawn together as a tight triangle, the EVA units in their canon body colors, NERV / SEELE / GEHIRN / JSSDF, all the canon locations (Tokyo-3 to Mt. Asama to the Pribnow Box), the abstract concepts the show keeps gnawing on (AT Field, LCL, Hedgehog's Dilemma, Yebisu), and the singular YOU=Lilim audience node that snaps into existence after End of Evangelion.

Drag to rotate. Ctrl/cmd+scroll to zoom. Tap a node to open the readout panel.

## Canon scope

**1995 TV series + End of Evangelion only.** The Rebuild tetralogy is a parallel timeline and is intentionally not part of this graph. The schema has no rebuild gate kind, the genesis registry has no Mari, no WILLE, and a unit-test invariant guards against any of those slipping back in.

When in doubt, the graph cites:

- the [EvaGeeks Wiki](https://wiki.evageeks.org/) (every gated entity carries a `revealedAtSource` URL pointing here)
- the [Evangelion Fandom Wiki](https://evangelion.fandom.com/wiki/Neon_Genesis_Evangelion_Wiki)

## What it shows

- **Characters** --- Shinji, Asuka, Rei, Misato, Kaworu, Gendo, Ritsuko, Toji, Yui, Naoko, plus Keel Lorenz at the head of SEELE and the eight-person supporting cast (Kaji, Fuyutsuki, Maya / Hyuga / Aoba on the bridge, Pen Pen, Hikari, Kensuke). Each character renders in its own canon palette primary.
- **Angels** --- the eighteen canonical Angels chained in TV-series order, all sharing the same AT-field crimson. EVA <-> angel "eliminated" edges record every kill credit (seventeen of them) with the killing unit and the episode it landed on screen.
- **Magi system** --- Casper-3, Melchior-1, and Balthasar-2 share a single color and an unusually short spring length, so the trio always renders as a single tight cluster. Each carries one of Naoko Akagi's three personality fragments (Woman, Scientist, Mother).
- **EVA units** --- Unit-00 through Unit-04 plus the Mass Production line, each painted in its canon body color (Unit-01 violet, Unit-02 red, etc.).
- **Organizations / locations / concepts / events** --- NERV, SEELE, GEHIRN, JSSDF, Marduk, the Japanese Government; Tokyo-3, the Geofront, Terminal Dogma, Mt. Asama, Matsushiro, the Pribnow Box, NERV-2 in Nevada, Antarctica; AT Field, LCL, Lance of Longinus, Dummy Plug, S² Engine, Dead Sea Scrolls, Sound Only, Berserk Mode, Yebisu, Watermelons; First Impact, Second Impact, Operation Yashima.
- **Audience** --- the singular YOU=Lilim node, gated to End of Evangelion. Tabris speaks the line and the show flinches; humanity is the Eighteenth Angel.

## Spoiler gate

A modal opens on first visit and asks the user where they are in the show. Anything past their tier renders as full-block masked silhouettes; the renderer also filters masked edges out of the force layout so a hidden relationship contributes zero pull. The user's tier is persisted to `localStorage["ngg-spoiler-progress"]`. A "spoilers" pill in the corner reopens the gate; a force-eject button purges the saved tier.

Two gate kinds:

- `{ kind: "ep", episode: N }` --- visible at episode N or later
- `{ kind: "eoe" }` --- visible after End of Evangelion (or TV episode 25+, which covers the same Instrumentality material)

Every gated entity cites its source on the EvaGeeks wiki, and the validator throws if a gate is added without a citation.

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

See [LICENSE.txt](./LICENSE.txt).
