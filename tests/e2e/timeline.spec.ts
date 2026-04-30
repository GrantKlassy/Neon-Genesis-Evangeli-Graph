import { expect, test } from "@playwright/test";

/**
 * View Show timeline. The button walks the spoiler gate ep 0 -> ep 26
 * -> +EoE while the orb keeps rotating. Tests cover the UI state
 * transitions, not the full ~50-second playthrough --- we sample early
 * to avoid burning a minute per test.
 */

test.describe("view show timeline", () => {
  test("starts idle with 'view show' label", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("ngg-spoiler-reveal").click();
    const btn = page.getByTestId("ngg-play-timeline");
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("data-state", "idle");
    await expect(btn).toContainText(/view show/i);
  });

  test("clicking play flips state to playing and steps the gate", async ({
    page,
  }) => {
    await page.goto("/");
    // Reveal at full so we can OBSERVE the timeline winding the gate
    // BACK from full down through the early episodes.
    await page.getByTestId("ngg-spoiler-preset-all").click();
    await page.getByTestId("ngg-spoiler-eoe").check();
    await page.getByTestId("ngg-spoiler-reveal").click();

    const btn = page.getByTestId("ngg-play-timeline");
    await btn.click();
    await expect(btn).toHaveAttribute("data-state", "playing");
    // Within a couple of steps the label should report an early ep.
    await expect(btn).toContainText(/ep \d+\/26/i, { timeout: 5000 });

    // The graph root's progress dataset reflects the timeline step ---
    // ep<=2 within the first ~5 seconds of play.
    const root = page.getByTestId("ngg-graph-root");
    const ep = Number(await root.getAttribute("data-spoiler-episode"));
    expect(ep).toBeGreaterThanOrEqual(0);
    expect(ep).toBeLessThanOrEqual(5);
  });

  test("clicking play during playback aborts and restores persisted tier", async ({
    page,
  }) => {
    await page.goto("/");
    // Persist ep=20 so abort has a non-default tier to restore.
    await page.getByTestId("ngg-spoiler-ep-slider").fill("20");
    await page.getByTestId("ngg-spoiler-reveal").click();

    const btn = page.getByTestId("ngg-play-timeline");
    await btn.click(); // start
    await expect(btn).toHaveAttribute("data-state", "playing");
    await page.waitForTimeout(2200); // let it advance a step or two
    await btn.click(); // abort
    await expect(btn).toHaveAttribute("data-state", "idle");
    await expect(btn).toContainText(/view show/i);

    // The renderer should snap back to the persisted tier (ep 20).
    const root = page.getByTestId("ngg-graph-root");
    await expect(root).toHaveAttribute("data-spoiler-episode", "20");
  });

  test("revealing via the gate during playback aborts the timeline", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("ngg-spoiler-reveal").click();

    const btn = page.getByTestId("ngg-play-timeline");
    await btn.click();
    await expect(btn).toHaveAttribute("data-state", "playing");

    // Reopen the gate and reveal at a different tier --- the gate's
    // broadcast should win and the timeline should drop back to idle.
    await page.getByTestId("ngg-spoiler-reopen").click();
    await page.getByTestId("ngg-spoiler-ep-slider").fill("11");
    await page.getByTestId("ngg-spoiler-reveal").click();

    await expect(btn).toHaveAttribute("data-state", "idle");
    const root = page.getByTestId("ngg-graph-root");
    await expect(root).toHaveAttribute("data-spoiler-episode", "11");
  });
});
