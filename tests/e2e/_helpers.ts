import type { Page, Locator } from "@playwright/test";

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
