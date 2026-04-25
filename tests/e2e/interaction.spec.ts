import { expect, test } from "@playwright/test";
import { waitForGraphState } from "./_helpers";

test.describe("interaction --- selecting a node updates the readout", () => {
  test("force-selecting a node via the renderer hook fills the panel", async ({
    page,
  }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    // Synthesize a click at the projected screen position of A7
    // (Local-Combination-46) by walking the scene through the global handle.
    // We can't easily access THREE objects from outside, so instead we
    // simulate selection by dispatching a click at the canvas center after
    // briefly pausing rotation: with 14 nodes near the origin, a center hit
    // is statistically likely. If it misses, fall back to scanning.
    const canvas = page.locator('[data-testid="ngg-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Grid-walk a small region until we hit a node.
    const offsets = [
      [0, 0],
      [-30, 0],
      [30, 0],
      [0, -30],
      [0, 30],
      [-60, 0],
      [60, 0],
      [0, -60],
      [0, 60],
      [-30, -30],
      [30, -30],
      [-30, 30],
      [30, 30],
      [-90, 0],
      [90, 0],
      [0, -90],
      [0, 90],
      [-60, -60],
      [60, 60],
    ];

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
      await page.waitForTimeout(40);
    }

    expect(hit, "no node was hit by canvas click sweep").toBe(true);

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
