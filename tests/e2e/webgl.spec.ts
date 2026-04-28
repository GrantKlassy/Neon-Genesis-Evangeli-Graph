import { expect, test } from "@playwright/test";
import {
  canvasHasNonBlackPixels,
  getGraphHandle,
  rootEl,
  waitForGraphState,
} from "./_helpers";

test.describe("WebGL launches", () => {
  // The WebGL tests inspect the canvas + handle directly --- both work behind
  // the gate overlay, so no need to dismiss it. Node count / pixel checks
  // assert renderer-level facts that don't depend on user spoiler choice.

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
    // 11 chars + 18 angels + 3 magi + 1 org + 1 loc + 7 concepts + 2 families + 6 evas = 49
    expect(handle!.nodeCount).toBe(49);
    // 3 magi + 17 angel-sequence + 3 identity-reveal + 4 pilots + 5 member_of_family
    //   + 10 generic (K5 mesh between Unit-00..Unit-04) + 15 eliminated = 57
    // Eliminated breakdown: Unit-01 takes 10 kills (Sachiel, Shamshel, Ramiel,
    //   Israfel-co, Matarael, Sahaquiel, Leliel, Bardiel, Zeruel, Tabris),
    //   Unit-02 takes 4 (Gaghiel, Israfel-co, Sandalphon, Arael), Unit-00
    //   takes 1 (Armisael self-destruct).
    expect(handle!.edgeCount).toBe(57);
    const root = rootEl(page);
    await expect(root).toHaveAttribute("data-node-count", "49");
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
