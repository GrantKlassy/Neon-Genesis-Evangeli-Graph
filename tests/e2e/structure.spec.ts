import { expect, test } from "@playwright/test";
import { waitForGraphState } from "./_helpers";

test.describe("graph structure visible in the DOM", () => {
  // The structure tests assert DOM presence and counts, both of which render
  // beneath the spoiler-gate overlay. No need to dismiss the gate.

  test("legend shows node kinds and edge kinds", async ({ page }) => {
    await page.goto("/");
    await waitForGraphState(page);
    const legend = page.locator('[data-testid="ngg-legend"]');
    await expect(legend).toBeVisible();
    await expect(legend).toContainText(/Characters/i);
    await expect(legend).toContainText(/Angels/i);
    await expect(legend).toContainText(/Magi/i);
    await expect(legend).toContainText(/Families/i);
    await expect(legend).toContainText(/Magi link/i);
    await expect(legend).toContainText(/Angel sequence/i);
    await expect(legend).toContainText(/Member of family/i);
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

  test("events section lists First Impact and Second Impact", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator('[data-testid="ngg-section-events"]');
    await expect(section).toBeVisible();
    await expect(
      section.locator('[data-testid="event-event_first_impact"]'),
    ).toBeVisible();
    await expect(
      section.locator('[data-testid="event-event_second_impact"]'),
    ).toBeVisible();
    // Second Impact links out to its EvaWiki article.
    await expect(
      page.locator('[data-testid="evageeks-link-event_second_impact"]'),
    ).toHaveAttribute("href", "https://wiki.evageeks.org/Second_Impact");
  });

  test("supporting cast (Kaji, Fuyutsuki, bridge trio, Pen Pen) renders in characters section", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator('[data-testid="ngg-section-characters"]');
    for (const id of [
      "char_kaji",
      "char_fuyutsuki",
      "char_maya",
      "char_hyuga",
      "char_aoba",
      "char_pen_pen",
      "char_hikari",
      "char_kensuke",
    ]) {
      await expect(
        section.locator(`[data-testid="character-${id}"]`),
      ).toBeVisible();
    }
  });

  test("organizations section includes SEELE, WILLE, GEHIRN, JSSDF, Marduk, Japanese Government", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator('[data-testid="ngg-section-organizations"]');
    for (const id of [
      "org_nerv",
      "org_seele",
      "org_wille",
      "org_gehirn",
      "org_jssdf",
      "org_marduk",
      "org_japan_gov",
    ]) {
      await expect(
        section.locator(`[data-testid="organization-${id}"]`),
      ).toBeVisible();
    }
  });

  test("locations section lists Tokyo-3, Geofront, Terminal/Central Dogma, Antarctica", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator('[data-testid="ngg-section-locations"]');
    for (const id of [
      "loc_nerv_hq",
      "loc_tokyo3",
      "loc_geofront",
      "loc_terminal_dogma",
      "loc_central_dogma",
      "loc_antarctica",
    ]) {
      await expect(
        section.locator(`[data-testid="location-${id}"]`),
      ).toBeVisible();
    }
  });

  test("families section lists Ikari and Akagi", async ({ page }) => {
    await page.goto("/");
    const section = page.locator('[data-testid="ngg-section-families"]');
    await expect(section).toBeVisible();
    await expect(
      section.locator('[data-testid="family-family_ikari"]'),
    ).toBeVisible();
    await expect(
      section.locator('[data-testid="family-family_akagi"]'),
    ).toBeVisible();
  });

  test("readout cards link out to EvaWiki for entities the wiki indexes", async ({
    page,
  }) => {
    await page.goto("/");
    // Characters: Shinji has a dedicated wiki page, link must be present.
    const shinjiLink = page.locator(
      '[data-testid="evageeks-link-char_shinji"]',
    );
    await expect(shinjiLink).toBeVisible();
    await expect(shinjiLink).toHaveAttribute(
      "href",
      "https://wiki.evageeks.org/Shinji_Ikari",
    );
    await expect(shinjiLink).toHaveAttribute("target", "_blank");
    await expect(shinjiLink).toHaveAttribute("rel", /noopener/);
    // Angels: Sachiel.
    await expect(
      page.locator('[data-testid="evageeks-link-angel_03_sachiel"]'),
    ).toHaveAttribute("href", "https://wiki.evageeks.org/Sachiel");
    // EVAs: Unit-01.
    await expect(
      page.locator('[data-testid="evageeks-link-eva_unit01"]'),
    ).toHaveAttribute("href", "https://wiki.evageeks.org/Evangelion_Unit-01");
    // Magi: each personality node points at the shared /Magi article.
    await expect(
      page.locator('[data-testid="evageeks-link-magi_casper"]'),
    ).toHaveAttribute("href", "https://wiki.evageeks.org/Magi");
    // Concepts the wiki does NOT index must not render a link.
    await expect(
      page.locator('[data-testid="evageeks-link-concept_hedgehogs_dilemma"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-testid="evageeks-link-concept_trauma"]'),
    ).toHaveCount(0);
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
