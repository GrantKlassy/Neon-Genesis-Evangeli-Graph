import { expect, test } from "@playwright/test";
import {
  SPOILER_FULL,
  canvasHasNonBlackPixels,
  getGraphHandle,
  rootEl,
  seedSpoilerProgress,
  waitForGraphState,
} from "./_helpers";

test.describe("WebGL launches", () => {
  test.beforeEach(async ({ page }) => {
    await seedSpoilerProgress(page, SPOILER_FULL);
  });

  test("canvas exists with non-zero dimensions", async ({ page }) => {
    await page.goto("/");
    await waitForGraphState(page);
    const canvas = page.locator('[data-testid="ngg-canvas"]');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(50);
    expect(box!.height).toBeGreaterThan(50);
  });

  test("WebGL context is acquired", async ({ page }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}, skipping WebGL`);
    const handle = await getGraphHandle(page);
    expect(handle).not.toBeNull();
    expect(handle!.state).toBe("ready");
    expect([1, 2]).toContain(handle!.webglVersion!);
  });

  test("renderer ticks --- frame count grows", async ({ page }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);
    const before = (await getGraphHandle(page))!.frames;
    await page.waitForTimeout(350);
    const after = (await getGraphHandle(page))!.frames;
    expect(after).toBeGreaterThan(before);
    expect(after).toBeGreaterThan(0);
  });

  test("scene contains the expected node + edge counts", async ({ page }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);
    const handle = await getGraphHandle(page);
    // 10 characters + 18 angels + 3 magi + 1 event = 32
    expect(handle!.nodeCount).toBe(32);
    // 3 magi triangle + 17 angel sequence + 3 identity reveals = 23
    expect(handle!.edgeCount).toBe(23);
    const root = rootEl(page);
    await expect(root).toHaveAttribute("data-node-count", "32");
  });

  test("canvas shows non-background pixels (something is drawn)", async ({
    page,
  }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);
    // Wait a few frames after readiness for the first paint.
    await page.waitForTimeout(450);
    const has = await canvasHasNonBlackPixels(page);
    expect(has).toBe(true);
  });

  test("fallback message is hidden when WebGL is available", async ({
    page,
  }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);
    const fallback = page.locator('[data-testid="ngg-fallback"]');
    await expect(fallback).toBeHidden();
  });
});
