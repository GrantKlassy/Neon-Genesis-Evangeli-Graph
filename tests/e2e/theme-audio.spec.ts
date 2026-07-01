import { expect, test } from "@playwright/test";

test.describe("theme audio", () => {
  // The spoiler gate intercepts clicks until dismissed. The mute pill is a
  // chrome control unrelated to the gate, so seed localStorage to skip the
  // overlay --- same trick scripts/peek-graph.mjs uses.
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem(
          "ngg-spoiler-progress",
          JSON.stringify({ episode: 26, eoe: true }),
        );
      } catch {
        /* localStorage unavailable; gate will simply prompt --- non-fatal */
      }
    });
  });

  test("theme audio has no source until a playback gesture lands", async ({
    page,
  }) => {
    await page.goto("/");

    const audio = page.getByTestId("ngg-theme-audio");
    // Source is bound lazily: nothing is fetched on load, so a gitignored /
    // absent theme file never 404s. The element starts with no src.
    await expect(audio).toHaveJSProperty("src", "");

    // A gesture (the mute pill click counts) wires the single JP source.
    await page.getByTestId("ngg-theme-toggle").click();
    await expect(audio).toHaveJSProperty(
      "src",
      new URL("/sound/theme.opus", page.url()).toString(),
    );
  });

  test("mute pill toggles muted state and persists it", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("ngg-theme-toggle");

    // Default is unmuted (audio.muted=false), so the first gesture starts
    // audible playback. The pill therefore renders in the "playing" state.
    await expect(toggle).toHaveAttribute("data-state", "playing");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    // Click mutes.
    await toggle.click();
    await expect(toggle).toHaveAttribute("data-state", "muted");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(
      await page.evaluate(() => localStorage.getItem("ngg.theme.muted")),
    ).toBe("true");

    // Preference persists across reloads.
    await page.reload();
    const toggle2 = page.getByTestId("ngg-theme-toggle");
    await expect(toggle2).toHaveAttribute("data-state", "muted");
    await expect(toggle2).toHaveAttribute("aria-pressed", "false");
  });

  test("there is no language switcher", async ({ page }) => {
    await page.goto("/");
    // The dual-theme JP/US flag toggle was removed; only the mute pill ships.
    await expect(page.getByTestId("ngg-theme-lang-toggle")).toHaveCount(0);
  });
});
