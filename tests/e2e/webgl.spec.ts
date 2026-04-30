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
    // 19 chars + 18 angels + 3 magi + 7 orgs (NERV/SEELE/WILLE/GEHIRN/
    // JSSDF/Marduk/JapanGov) + 6 locations + 15 concepts + 2 families
    // + 6 evas + 2 events + 1 audience (YOU=Lilim) = 79.
    expect(handle!.nodeCount).toBe(79);
    // 3 magi-link + 17 angel-sequence + 8 identity-reveal (Toji-Bardiel,
    // Rei-Yui, Kaworu-Tabris, Yui-Unit01, 3x Magi-Naoko, You-Lilim)
    // + 4 pilots + 5 member_of_family + 15 member_of_org + 7 located_in
    // + 5 caused + 30 generic (10 EVA mesh + 20 supporting) + 17 eliminated
    // = 111.
    expect(handle!.edgeCount).toBe(111);
    const root = rootEl(page);
    await expect(root).toHaveAttribute("data-node-count", "79");
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
