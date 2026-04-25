import { expect, test } from "@playwright/test";

test.describe("palette CSS variables propagate to the page", () => {
  test("iconic entity variables resolve at :root with valid hex values", async ({
    page,
  }) => {
    await page.goto("/");
    const values = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const names = [
        "--palette-asuka-primary",
        "--palette-shinji-primary",
        "--palette-rei-primary",
        "--palette-unit01-primary",
        "--palette-unit02-primary",
        "--palette-nerv-primary",
        "--palette-seele-primary",
        "--palette-at-field-primary",
        "--palette-third-impact-primary",
        "--palette-mass-production-primary",
      ];
      return Object.fromEntries(
        names.map((n) => [n, root.getPropertyValue(n).trim()]),
      ) as Record<string, string>;
    });
    for (const [name, value] of Object.entries(values)) {
      expect(value, `${name} did not resolve`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  test("secondary variables also resolve (asuka secondary 1)", async ({
    page,
  }) => {
    await page.goto("/");
    const value = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--palette-asuka-secondary-1")
        .trim(),
    );
    expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("Asuka swatch in the showcase paints the canon hex", async ({
    page,
  }) => {
    await page.goto("/");
    const swatch = page.locator('[data-testid="palette-primary-asuka"]');
    await swatch.scrollIntoViewIfNeeded();
    await expect(swatch).toBeVisible();
    const bg = await swatch.evaluate(
      (el) => getComputedStyle(el as HTMLElement).backgroundColor,
    );
    // Asuka primary is #d6271e --- rgb(214, 39, 30).
    expect(bg).toBe("rgb(214, 39, 30)");
  });

  test("PaletteShowcase renders all 5 category groups", async ({ page }) => {
    await page.goto("/");
    for (const cat of ["character", "eva", "organization", "magi", "concept"]) {
      const group = page.locator(`[data-testid="palette-category-${cat}"]`);
      await expect(group).toBeVisible();
    }
  });

  test("expected entity count is rendered (23 cards)", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator(
      '[data-testid="ngg-palette-showcase"] [data-entity-key]',
    );
    await expect(cards).toHaveCount(23);
  });
});
