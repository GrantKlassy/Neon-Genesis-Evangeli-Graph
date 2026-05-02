#!/usr/bin/env node
// scripts/peek-graph.mjs
//
// One-off tool to "give Claude eyes" on the live graph. Boots the Astro dev
// server, opens the page in a headless Chromium with the spoiler gate
// pre-revealed via a seeded localStorage entry (so the gate never paints),
// waits a random number of seconds so the force layout / camera lands in a
// different orientation each run, then writes a single PNG screenshot.
//
// Usage:
//   node scripts/peek-graph.mjs
//   OUT=/tmp/foo.png node scripts/peek-graph.mjs
//   PORT=4321 MIN_WAIT_MS=4000 MAX_WAIT_MS=12000 node scripts/peek-graph.mjs
//
// Output (default): /tmp/ngg-peek.png

import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import process from "node:process";

const PORT = Number(process.env.PORT ?? 4321);
const URL = `http://localhost:${PORT}/`;
const OUT = process.env.OUT ?? "/tmp/ngg-peek.png";
const MIN_WAIT_MS = Number(process.env.MIN_WAIT_MS ?? 2_500);
const MAX_WAIT_MS = Number(process.env.MAX_WAIT_MS ?? 9_500);
const VIEWPORT_W = Number(process.env.VIEWPORT_W ?? 1920);
const VIEWPORT_H = Number(process.env.VIEWPORT_H ?? 1080);
// Pixel density. dsf=2 doubles every screenshot dimension --- a 1920x1080
// layout becomes a 3840x2160 PNG. Crucial for the graph: the WebGL canvas
// renders to the device-pixel buffer, so dsf=2 produces actual retina-sharp
// node glyphs and edges instead of blurry CSS upscaling.
const DEVICE_SCALE_FACTOR = Number(process.env.DEVICE_SCALE_FACTOR ?? 2);

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

async function waitForServer(url, timeoutMs = 90_000) {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.status < 500) return;
    } catch (err) {
      lastErr = err;
    }
    await sleep(400);
  }
  throw new Error(
    `dev server did not respond at ${url} in ${timeoutMs}ms${
      lastErr ? ` (last error: ${lastErr.message})` : ""
    }`,
  );
}

async function main() {
  console.log(`[peek] starting astro dev on port ${PORT}...`);
  const dev = spawn(
    "pnpm",
    ["exec", "astro", "dev", "--port", String(PORT), "--host", "127.0.0.1"],
    {
      stdio: ["ignore", "ignore", "inherit"],
      detached: false,
    },
  );

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    try {
      dev.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });

  try {
    await waitForServer(URL);
    console.log(`[peek] server up; launching headless chromium...`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: VIEWPORT_W, height: VIEWPORT_H },
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
    });

    // Seed localStorage BEFORE any page script runs so the spoiler gate sees
    // a persisted full-reveal tier on bootstrap and never opens. Shape is
    // the raw SpoilerProgress JSON the gate writes itself --- see
    // src/components/SpoilerGate.astro saveProgress().
    await context.addInitScript(() => {
      try {
        const full = { episode: 26, eoe: true, rebuild: true };
        localStorage.setItem("ngg-spoiler-progress", JSON.stringify(full));
      } catch {
        /* localStorage unavailable; gate will simply prompt --- non-fatal */
      }
    });

    const page = await context.newPage();
    page.on("pageerror", (err) => {
      console.warn(`[peek] page error: ${err.message}`);
    });

    await page.goto(URL, { waitUntil: "domcontentloaded" });

    // Wait for the renderer to reach a terminal state. Mirrors
    // tests/e2e/_helpers.ts waitForGraphState.
    const state = await page
      .waitForFunction(
        () => {
          const el = document.querySelector('[data-testid="ngg-graph-root"]');
          if (!el) return null;
          const s = el.getAttribute("data-state");
          return s === "ready" || s === "no-webgl" || s === "error" ? s : null;
        },
        null,
        { timeout: 20_000 },
      )
      .then((h) => h.jsonValue());

    if (state !== "ready") {
      throw new Error(`graph never reached ready state (got: ${state})`);
    }

    // Confirm the gate did not paint --- if our seed worked it should be
    // hidden / removed from the visible flow.
    const gateVisible = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="ngg-spoiler-gate"]');
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return (
        cs.visibility !== "hidden" &&
        cs.display !== "none" &&
        r.width > 0 &&
        r.height > 0
      );
    });
    console.log(`[peek] gate visible after seed? ${gateVisible}`);

    // Center the graph element in the viewport before we snap.
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="ngg-graph-root"]');
      el?.scrollIntoView({ block: "center", inline: "center" });
    });

    const waitMs = randInt(MIN_WAIT_MS, MAX_WAIT_MS);
    console.log(
      `[peek] graph ready --- waiting ${waitMs}ms for rotation drift...`,
    );
    await sleep(waitMs);

    await page.screenshot({ path: OUT, fullPage: false, type: "png" });
    const dim = `${VIEWPORT_W * DEVICE_SCALE_FACTOR}x${VIEWPORT_H * DEVICE_SCALE_FACTOR}`;
    console.log(`[peek] wrote ${OUT} (${dim} @ dsf=${DEVICE_SCALE_FACTOR})`);

    // Quick stats so the script's stdout proves it actually rendered.
    const stats = await page.evaluate(() => {
      const h = window.__nggGraph;
      if (!h) return null;
      return {
        state: h.state,
        nodeCount: h.nodeCount,
        edgeCount: h.edgeCount,
        frames: h.frames,
      };
    });
    console.log(`[peek] graph stats: ${JSON.stringify(stats)}`);

    await browser.close();
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
