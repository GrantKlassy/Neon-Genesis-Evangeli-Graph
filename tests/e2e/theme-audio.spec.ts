import { expect, test } from "@playwright/test";

test.describe("theme audio", () => {
  // The spoiler gate intercepts clicks until dismissed. The flag toggle
  // is a chrome control unrelated to the gate, so seed localStorage to
  // skip the overlay --- same trick scripts/peek-graph.mjs uses.
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

  test("flag toggle swaps the audio source between JP and US", async ({
    page,
  }) => {
    await page.goto("/");

    const audio = page.getByTestId("ngg-theme-audio");
    const langToggle = page.getByTestId("ngg-theme-lang-toggle");

    // Defaults: JP source, JP flag visible.
    await expect(langToggle).toHaveAttribute("data-lang", "jp");
    await expect(audio).toHaveJSProperty(
      "src",
      `${new URL("/sound/theme.opus", page.url()).toString()}`,
    );

    // Click flag once: source flips to the English ADV dub.
    await langToggle.click();
    await expect(langToggle).toHaveAttribute("data-lang", "us");
    await expect(audio).toHaveJSProperty(
      "src",
      `${new URL("/sound/theme_en.opus", page.url()).toString()}`,
    );

    // Click again: back to JP. The toggle is symmetric.
    await langToggle.click();
    await expect(langToggle).toHaveAttribute("data-lang", "jp");
    await expect(audio).toHaveJSProperty(
      "src",
      `${new URL("/sound/theme.opus", page.url()).toString()}`,
    );
  });

  test("language preference persists across reloads", async ({ page }) => {
    await page.goto("/");
    const langToggle = page.getByTestId("ngg-theme-lang-toggle");
    await langToggle.click();
    await expect(langToggle).toHaveAttribute("data-lang", "us");

    await page.reload();
    const langToggle2 = page.getByTestId("ngg-theme-lang-toggle");
    await expect(langToggle2).toHaveAttribute("data-lang", "us");
    const audio = page.getByTestId("ngg-theme-audio");
    await expect(audio).toHaveJSProperty(
      "src",
      `${new URL("/sound/theme_en.opus", page.url()).toString()}`,
    );
  });

  test("both opus assets respond with audio content", async ({ page }) => {
    // The component sets audio.src directly; if either file 404s the flag
    // toggle becomes a silent footgun. Hit both paths and verify the
    // server returns binary audio bytes, not an HTML 404 fallback.
    for (const path of ["/sound/theme.opus", "/sound/theme_en.opus"]) {
      const res = await page.request.get(path);
      expect(res.status(), `${path} status`).toBe(200);
      const ct = res.headers()["content-type"] ?? "";
      expect(ct, `${path} content-type`).toMatch(/audio|opus|ogg/i);
    }
  });
});
