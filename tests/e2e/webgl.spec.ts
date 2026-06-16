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
    // 20 chars (10 main + Keel + Kyoko + 8 supporting) + 18 angels + 3 magi
    // + 6 orgs (NERV/SEELE/GEHIRN/JSSDF/Marduk/JapanGov) + 10 locations
    // (NERV HQ/Tokyo-3/Geofront/Terminal/Central/Antarctica/Mt. Asama/
    // Matsushiro/Pribnow/NERV-2) + 21 concepts (incl. Depression)
    // + 2 families + 6 evas + 3 events + 1 audience = 90.
    expect(handle!.nodeCount).toBe(90);
    // 3 magi_link + 17 angel_sequence + 17 identity_reveal + 4 pilots
    // + 5 member_of_family + 18 member_of_org + 19 located_in + 11 caused
    // + 30 relationship + 20 afflicts + 18 attacked + 8 manifests
    // + 105 generic + 17 eliminated = 292. (2026-06-15 categorization pass
    // carved four typed classes out of the generic bucket --- character<->
    // character relationships, the psych-wound `afflicts` hubs, Angel
    // `attacked` target sites/units/pilots, and the A.T. Field `manifests`
    // ties --- dropping generic from 181 to 105 without changing the total.)
    expect(handle!.edgeCount).toBe(292);
    const root = rootEl(page);
    await expect(root).toHaveAttribute("data-node-count", "90");
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
