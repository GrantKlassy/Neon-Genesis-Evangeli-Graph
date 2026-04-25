import { expect, test } from "@playwright/test";
import { waitForGraphState } from "./_helpers";

test.describe("graph structure visible in the DOM", () => {
  test("legend shows node kinds and edge kinds", async ({ page }) => {
    await page.goto("/");
    await waitForGraphState(page);
    const legend = page.locator('[data-testid="ngg-legend"]');
    await expect(legend).toBeVisible();
    await expect(legend).toContainText(/Characters/i);
    await expect(legend).toContainText(/Angels/i);
    await expect(legend).toContainText(/Magi/i);
    await expect(legend).toContainText(/Magi link/i);
    await expect(legend).toContainText(/Angel sequence/i);
  });

  test("readout has the three top-level sections", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('[data-testid="ngg-section-characters"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="ngg-section-angels"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="ngg-section-magi"]'),
    ).toBeVisible();
  });

  test("characters section lists the eight expected pilots/cast", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator('[data-testid="ngg-section-characters"]');
    for (const id of [
      "char_shinji",
      "char_asuka",
      "char_rei",
      "char_misato",
      "char_kaworu",
      "char_gendo",
      "char_ritsuko",
      "char_mari",
    ]) {
      await expect(
        section.locator(`[data-testid="character-${id}"]`),
      ).toBeVisible();
    }
  });

  test("angels section lists all 18 in canonical order", async ({ page }) => {
    await page.goto("/");
    const section = page.locator('[data-testid="ngg-section-angels"]');
    const items = section.locator("li");
    await expect(items).toHaveCount(18);
    for (let i = 1; i <= 18; i++) {
      await expect(
        section.locator(`[data-testid="angel-${i}"]`),
      ).toBeVisible();
    }
  });

  test("magi section lists three nodes", async ({ page }) => {
    await page.goto("/");
    const section = page.locator('[data-testid="ngg-section-magi"]');
    const items = section.locator("li");
    await expect(items).toHaveCount(3);
    await expect(section).toContainText(/Casper/);
    await expect(section).toContainText(/Melchior/);
    await expect(section).toContainText(/Balthasar/);
  });

  test("source attribution names the show", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator('[data-testid="ngg-footer"]');
    await expect(footer).toContainText(/Neon Genesis Evangelion/);
  });

  test("selected panel starts hidden", async ({ page }) => {
    await page.goto("/");
    await waitForGraphState(page);
    const panel = page.locator('[data-testid="ngg-selected"]');
    await expect(panel).toHaveAttribute("data-empty", "true");
    await expect(panel).toBeHidden();
  });
});
