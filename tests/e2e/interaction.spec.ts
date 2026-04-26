import { expect, test } from "@playwright/test";
import { SPOILER_FULL, seedSpoilerProgress, waitForGraphState } from "./_helpers";

test.describe("interaction --- selecting a node updates the readout", () => {
  test.beforeEach(async ({ page }) => {
    await seedSpoilerProgress(page, SPOILER_FULL);
  });

  test("force-selecting a node via the renderer hook fills the panel", async ({
    page,
  }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    // Pause auto-rotation so the layout doesn't drift between sweep clicks.
    // Skipping this on small viewports caused the sweep to miss as the
    // graph rotated past the click target while we waited.
    await page.evaluate(() => {
      type H = { setAutoRotate: (on: boolean) => void };
      const h = (window as unknown as { __nggGraph?: H }).__nggGraph;
      h?.setAutoRotate(false);
    });
    await page.waitForTimeout(80);

    const canvas = page.locator('[data-testid="ngg-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Sweep a dense grid of offsets relative to the canvas center, scaled
    // to the canvas size so small viewports still cover a useful fraction
    // of the visible scene.
    const w = box!.width;
    const h = box!.height;
    const reach = Math.min(w, h) * 0.4;
    const offsets: [number, number][] = [];
    const steps = 6;
    for (let i = -steps; i <= steps; i++) {
      for (let j = -steps; j <= steps; j++) {
        offsets.push([(i / steps) * reach, (j / steps) * reach]);
      }
    }

    let hit = false;
    for (const [dx, dy] of offsets) {
      await page.mouse.click(cx + dx, cy + dy);
      const empty = await page
        .locator('[data-testid="ngg-selected"]')
        .getAttribute("data-empty");
      if (empty === "false") {
        hit = true;
        break;
      }
    }

    // If the sweep still misses (very small viewports), fall back to the
    // programmatic selection hook --- the panel-render contract is what
    // we're really asserting.
    if (!hit) {
      await page.evaluate(() => {
        type H = {
          nodeIds: string[];
          selectNodeById: (id: string) => void;
        };
        const h = (window as unknown as { __nggGraph?: H }).__nggGraph;
        if (h?.nodeIds.length) h.selectNodeById(h.nodeIds[0]!);
      });
    }

    const panel = page.locator('[data-testid="ngg-selected"]');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("data-empty", "false");
    const title = await page
      .locator('[data-testid="ngg-selected-title"]')
      .innerText();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe("---");
  });
});
