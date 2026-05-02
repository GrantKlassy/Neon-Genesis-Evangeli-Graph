import type { Page, Locator } from "@playwright/test";

/**
 * Spoiler-progress shape used by both the renderer and tests. Mirrors
 * src/graph/types.ts SpoilerProgress; duplicated here to avoid pulling
 * the source-of-truth type through Playwright's transformer.
 */
export type TestSpoilerProgress = {
  episode: number;
  eoe: boolean;
};

export const SPOILER_FULL: TestSpoilerProgress = {
  episode: 26,
  eoe: true,
};

export const SPOILER_NONE: TestSpoilerProgress = {
  episode: 0,
  eoe: false,
};

/**
 * Drive the spoiler gate to the requested progress and reveal. The gate is
 * shown on every page load (no persistence), so tests that want a specific
 * mask state walk through the same UI a real user would: set the slider,
 * tick the EoE box if needed, click reveal.
 *
 * EoE has a prerequisite in the UI (EoE needs ep>=26). We skip the check()
 * if the box is disabled --- that way callers can pass an impossible state
 * and still get a clean "no, that's not allowed" pass-through rather than
 * a hard failure.
 */
export async function revealWithProgress(
  page: Page,
  progress: TestSpoilerProgress,
) {
  const gate = page.getByTestId("ngg-spoiler-gate");
  await gate.waitFor({ state: "visible" });
  await page
    .getByTestId("ngg-spoiler-ep-slider")
    .fill(String(progress.episode));
  if (progress.eoe) {
    const eoe = page.getByTestId("ngg-spoiler-eoe");
    if (await eoe.isEnabled()) {
      await eoe.check();
    }
  }
  await page.getByTestId("ngg-spoiler-reveal").click();
  await gate.waitFor({ state: "hidden" });
}

/**
 * Wait for the graph component to finish initializing.
 * Resolves once data-state on the root reaches "ready" (or "no-webgl" / "error").
 */
export async function waitForGraphState(page: Page, timeoutMs = 8000) {
  const root = page.locator('[data-testid="ngg-graph-root"]');
  await root.waitFor({ state: "visible", timeout: timeoutMs });
  await page.waitForFunction(
    () => {
      const el = document.querySelector(
        '[data-testid="ngg-graph-root"]',
      ) as HTMLElement | null;
      if (!el) return false;
      const s = el.dataset.state;
      return s === "ready" || s === "no-webgl" || s === "error";
    },
    null,
    { timeout: timeoutMs },
  );
  const state = await root.getAttribute("data-state");
  return state ?? "unknown";
}

export async function getGraphHandle(page: Page) {
  return page.evaluate(() => {
    const h = (window as unknown as { __nggGraph?: unknown }).__nggGraph as
      | {
          state: string;
          nodeCount: number;
          edgeCount: number;
          webglVersion: number | null;
          frames: number;
          selectedNodeId: string | null;
        }
      | undefined;
    if (!h) return null;
    return {
      state: h.state,
      nodeCount: h.nodeCount,
      edgeCount: h.edgeCount,
      webglVersion: h.webglVersion,
      frames: h.frames,
      selectedNodeId: h.selectedNodeId,
    };
  });
}

/**
 * Read pixels from the WebGL canvas to confirm it's drawing more than the
 * background color. Drawing onto a 2D canvas avoids issues with the WebGL
 * back-buffer being cleared after present(), and exercises what the user
 * actually sees on screen.
 */
export async function canvasHasNonBlackPixels(page: Page) {
  return page.evaluate(() => {
    const canvas = document.getElementById(
      "ngg-graph-canvas",
    ) as HTMLCanvasElement | null;
    if (!canvas) return false;
    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return false;
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(canvas, 0, 0);
    const sampleCount = 64;
    let nonBackground = 0;
    for (let i = 0; i < sampleCount; i++) {
      const x = Math.floor((Math.random() * 0.7 + 0.15) * w);
      const y = Math.floor((Math.random() * 0.7 + 0.15) * h);
      const data = ctx.getImageData(x, y, 1, 1).data;
      const r = data[0]!;
      const g = data[1]!;
      const b = data[2]!;
      // Background is approximately #050507 (5,5,7) with a center radial that
      // brightens to #0a0a12 (10,10,18). Anything notably above that counts.
      if (r > 25 || g > 25 || b > 30) nonBackground++;
    }
    return nonBackground > 0;
  });
}

export function rootEl(page: Page): Locator {
  return page.locator('[data-testid="ngg-graph-root"]');
}
