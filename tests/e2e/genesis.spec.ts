import { expect, test } from "@playwright/test";

test.describe("genesis registry CSS variables propagate to the page", () => {
  // No spoiler-gate setup --- these tests assert CSS-variable / DOM presence,
  // both of which resolve under the gate overlay.

  test("iconic entity variables resolve at :root with valid hex values (genesis-prefixed)", async ({
    page,
  }) => {
    await page.goto("/");
    const values = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const names = [
        "--genesis-asuka-primary",
        "--genesis-shinji-primary",
        "--genesis-rei-primary",
        "--genesis-ikari-primary",
        "--genesis-ayanami-primary",
        "--genesis-unit01-primary",
        "--genesis-unit02-primary",
        "--genesis-nerv-primary",
        "--genesis-seele-primary",
        "--genesis-at-field-primary",
        "--genesis-third-impact-primary",
        "--genesis-mass-production-primary",
        "--genesis-sachiel-primary",
        "--genesis-tabris-primary",
      ];
      return Object.fromEntries(
        names.map((n) => [n, root.getPropertyValue(n).trim()]),
      ) as Record<string, string>;
    });
    for (const [name, value] of Object.entries(values)) {
      expect(value, `${name} did not resolve`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  test("legacy palette-prefixed mirrors still resolve (backwards compat)", async ({
    page,
  }) => {
    await page.goto("/");
    const value = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--palette-asuka-primary")
        .trim(),
    );
    expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("secondary variables also resolve (asuka secondary 1)", async ({
    page,
  }) => {
    await page.goto("/");
    const value = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--genesis-asuka-secondary-1")
        .trim(),
    );
    expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("Asuka swatch in the showcase paints the canon hex", async ({
    page,
  }) => {
    await page.goto("/");
    const swatch = page.locator('[data-testid="genesis-primary-asuka"]');
    await swatch.scrollIntoViewIfNeeded();
    await expect(swatch).toBeVisible();
    const bg = await swatch.evaluate(
      (el) => getComputedStyle(el as HTMLElement).backgroundColor,
    );
    // Asuka primary is #d6271e --- rgb(214, 39, 30).
    expect(bg).toBe("rgb(214, 39, 30)");
  });

  test("GenesisShowcase renders all 6 kind groups", async ({ page }) => {
    await page.goto("/");
    for (const kind of [
      "characters",
      "eva",
      "organizations",
      "magi",
      "angels",
      "concepts",
    ]) {
      const group = page.locator(`[data-testid="genesis-kind-${kind}"]`);
      await expect(group).toBeVisible();
    }
  });

  test("the canonical core character shortcodes are rendered as cards", async ({
    page,
  }) => {
    await page.goto("/");
    for (const code of [
      "shinji",
      "asuka",
      "rei",
      "misato",
      "kaworu",
      "gendo",
      "ritsuko",
      "keel",
      "ikari",
      "ayanami",
    ]) {
      const card = page.locator(`[data-testid="genesis-entry-${code}"]`);
      await expect(card, `card for ${code} missing`).toBeVisible();
    }
  });
});

test.describe("genesis text highlighter wraps aliases inline", () => {
  // The header blurb is rendered server-side; the gate overlay does not
  // affect its highlighter spans.

  test("Header blurb tints 'Shinji Ikari' as a single shinji shortcode span", async ({
    page,
  }) => {
    await page.goto("/");
    const blurb = page.locator('[data-testid="ngg-header-blurb"]');
    await expect(blurb).toBeVisible();
    const shinjiSpans = blurb.locator(
      'span.g-shortcode[data-shortcode="shinji"]',
    );
    await expect(shinjiSpans.first()).toBeVisible();
    await expect(shinjiSpans.first()).toHaveText("Shinji Ikari");
    // The bare 'Ikari' family shortcode does NOT appear here --- the longest
    // alias ('Shinji Ikari') wins, so the whole label paints in shinji navy.
    const ikariSpans = blurb.locator(
      'span.g-shortcode[data-shortcode="ikari"]',
    );
    await expect(ikariSpans).toHaveCount(0);
  });

  test("highlighted Shinji span paints the Shinji primary color", async ({
    page,
  }) => {
    await page.goto("/");
    const span = page
      .locator(
        '[data-testid="ngg-header-blurb"] span[data-shortcode="shinji"]',
      )
      .first();
    await expect(span).toBeVisible();
    const color = await span.evaluate(
      (el) => getComputedStyle(el as HTMLElement).color,
    );
    // Shinji primary is #1f3a8a --- rgb(31, 58, 138).
    expect(color).toBe("rgb(31, 58, 138)");
  });
});
