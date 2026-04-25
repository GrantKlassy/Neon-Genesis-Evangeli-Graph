import { expect, test } from "@playwright/test";
import { waitForGraphState } from "./_helpers";

test.describe("smoke", () => {
  test("homepage renders with header, graph section, and readout", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Neon Genesis Evangeli-Graph/);

    const header = page.locator('[data-testid="ngg-header"]');
    await expect(header).toBeVisible();

    const h1 = page.locator("h1");
    await expect(h1).toContainText(/Neon Genesis/i);
    await expect(h1).toContainText(/Evangeli-Graph/i);

    const graphSection = page.locator('[data-testid="ngg-graph-section"]');
    await expect(graphSection).toBeVisible();

    const readout = page.locator('[data-testid="ngg-readout"]');
    await expect(readout).toBeVisible();
  });

  test("stat counters reflect the wordword4numbers graph (8/6/30+)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("stat-accounts")).toHaveText("8");
    await expect(page.getByTestId("stat-communities")).toHaveText("6");
    const edgesText = await page.getByTestId("stat-edges").innerText();
    const edges = Number(edgesText);
    expect(edges).toBeGreaterThanOrEqual(30);
  });

  test("graph host element reaches a terminal state", async ({ page }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    expect(["ready", "no-webgl", "error"]).toContain(state);
  });

  test("no console errors during page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await waitForGraphState(page);
    // Allow a beat for any deferred work to surface.
    await page.waitForTimeout(250);
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
