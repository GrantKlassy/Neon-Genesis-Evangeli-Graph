import { expect, test } from "@playwright/test";
import {
  SPOILER_FULL,
  SPOILER_NONE,
  seedSpoilerProgress,
  waitForGraphState,
} from "./_helpers";

test.describe("spoiler gate --- first visit", () => {
  test("opens the gate when no progress is stored", async ({ page }) => {
    await page.goto("/");
    const gate = page.getByTestId("ngg-spoiler-gate");
    await expect(gate).toBeVisible();
    await expect(gate).toHaveAttribute("data-state", "visible");
  });

  test("revealing with default settings persists progress and closes gate", async ({
    page,
  }) => {
    await page.goto("/");
    const gate = page.getByTestId("ngg-spoiler-gate");
    await expect(gate).toBeVisible();
    await page.getByTestId("ngg-spoiler-reveal").click();
    await expect(gate).toBeHidden();

    const stored = await page.evaluate(() =>
      localStorage.getItem("ngg-spoiler-progress"),
    );
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toEqual({ episode: 0, eoe: false, rebuild: false });
  });

  test("preset 'finished it' fills the slider to 26", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("ngg-spoiler-preset-all").click();
    const readout = page.getByTestId("ngg-spoiler-ep-readout");
    await expect(readout).toHaveText("26");
  });

  test("reopen pill brings the gate back after dismissal", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("ngg-spoiler-reveal").click();
    await expect(page.getByTestId("ngg-spoiler-gate")).toBeHidden();
    await page.getByTestId("ngg-spoiler-reopen").click();
    await expect(page.getByTestId("ngg-spoiler-gate")).toBeVisible();
  });
});

test.describe("spoiler gate --- repeat visits with seeded progress", () => {
  test("does NOT open the gate when localStorage already has progress", async ({
    page,
  }) => {
    await seedSpoilerProgress(page, SPOILER_FULL);
    await page.goto("/");
    await waitForGraphState(page);
    const gate = page.getByTestId("ngg-spoiler-gate");
    await expect(gate).toBeHidden();
  });
});

test.describe("renderer applies the gate to nodes and edges", () => {
  test("at full progress, no nodes are masked", async ({ page }) => {
    await seedSpoilerProgress(page, SPOILER_FULL);
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    const masked = await page.evaluate(() => {
      type H = {
        nodeIds: string[];
        isNodeMasked: (id: string) => boolean;
      };
      const h = (window as unknown as { __nggGraph?: H }).__nggGraph;
      if (!h) return null;
      return h.nodeIds.filter((id) => h.isNodeMasked(id));
    });
    expect(masked).toEqual([]);
  });

  test("at zero progress, late-show entities are masked", async ({ page }) => {
    await seedSpoilerProgress(page, SPOILER_NONE);
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    const flags = await page.evaluate(() => {
      type H = { isNodeMasked: (id: string) => boolean };
      const h = (window as unknown as { __nggGraph?: H }).__nggGraph;
      if (!h) return null;
      return {
        kaworu: h.isNodeMasked("char_kaworu"),
        toji: h.isNodeMasked("char_toji"),
        yui: h.isNodeMasked("char_yui"),
        asuka: h.isNodeMasked("char_asuka"),
        tabris: h.isNodeMasked("angel_17_tabris"),
        sachiel: h.isNodeMasked("angel_03_sachiel"),
        shinji: h.isNodeMasked("char_shinji"),
        rei: h.isNodeMasked("char_rei"),
        thirdImpact: h.isNodeMasked("event_third_impact"),
      };
    });
    expect(flags).not.toBeNull();
    expect(flags!.kaworu).toBe(true);
    expect(flags!.toji).toBe(true);
    expect(flags!.yui).toBe(true);
    expect(flags!.asuka).toBe(true);
    expect(flags!.tabris).toBe(true);
    expect(flags!.thirdImpact).toBe(true);
    // Open characters / ep1 angel stay visible.
    expect(flags!.shinji).toBe(false);
    expect(flags!.rei).toBe(false);
    expect(flags!.sachiel).toBe(false);
  });

  test("changing the gate live re-applies the mask to the scene", async ({
    page,
  }) => {
    await seedSpoilerProgress(page, SPOILER_NONE);
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    // Open the gate, set ep 24, reveal.
    await page.getByTestId("ngg-spoiler-reopen").click();
    await page.getByTestId("ngg-spoiler-ep-slider").fill("24");
    await page.getByTestId("ngg-spoiler-reveal").click();

    const flags = await page.evaluate(() => {
      type H = { isNodeMasked: (id: string) => boolean };
      const h = (window as unknown as { __nggGraph?: H }).__nggGraph;
      if (!h) return null;
      return {
        kaworu: h.isNodeMasked("char_kaworu"),
        tabris: h.isNodeMasked("angel_17_tabris"),
        thirdImpact: h.isNodeMasked("event_third_impact"),
      };
    });
    expect(flags).not.toBeNull();
    expect(flags!.kaworu).toBe(false);
    expect(flags!.tabris).toBe(false);
    // Third Impact is EoE-or-ep25+, still gated at ep 24.
    expect(flags!.thirdImpact).toBe(true);
  });

  test("selecting a masked node renders a masked readout panel", async ({
    page,
  }) => {
    await seedSpoilerProgress(page, SPOILER_NONE);
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    await page.evaluate(() => {
      type H = { selectNodeById: (id: string) => void };
      const h = (window as unknown as { __nggGraph?: H }).__nggGraph;
      h?.selectNodeById("char_kaworu");
    });

    const panel = page.getByTestId("ngg-selected");
    await expect(panel).toHaveAttribute("data-empty", "false");
    await expect(panel).toHaveAttribute("data-masked", "true");
    const title = await page
      .getByTestId("ngg-selected-title")
      .innerText();
    // Masked label replaces alphanumerics with full-block characters.
    expect(title).toMatch(/█/);
    expect(title.toLowerCase()).not.toContain("kaworu");
  });

  test("selecting an open node renders an unmasked readout panel", async ({
    page,
  }) => {
    await seedSpoilerProgress(page, SPOILER_NONE);
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    await page.evaluate(() => {
      type H = { selectNodeById: (id: string) => void };
      const h = (window as unknown as { __nggGraph?: H }).__nggGraph;
      h?.selectNodeById("char_shinji");
    });

    const panel = page.getByTestId("ngg-selected");
    await expect(panel).toHaveAttribute("data-empty", "false");
    await expect(panel).toHaveAttribute("data-masked", "false");
    const title = await page
      .getByTestId("ngg-selected-title")
      .innerText();
    expect(title).toContain("Shinji");
  });
});

test.describe("spoiler dataset attributes", () => {
  test("graph root mirrors the active progress in dataset", async ({
    page,
  }) => {
    await seedSpoilerProgress(page, { episode: 18, eoe: false, rebuild: true });
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    const root = page.getByTestId("ngg-graph-root");
    await expect(root).toHaveAttribute("data-spoiler-episode", "18");
    await expect(root).toHaveAttribute("data-spoiler-eoe", "false");
    await expect(root).toHaveAttribute("data-spoiler-rebuild", "true");
  });
});

test.describe("spoiler gate --- EoE requires Ep. 26", () => {
  test("EoE checkbox is disabled until the slider is at 26", async ({
    page,
  }) => {
    await page.goto("/");
    const eoe = page.getByTestId("ngg-spoiler-eoe");
    const label = page.getByTestId("ngg-spoiler-eoe-label");
    const hint = page.getByTestId("ngg-spoiler-eoe-hint");

    await expect(eoe).toBeDisabled();
    await expect(label).toHaveAttribute("data-disabled", "true");
    await expect(hint).toBeVisible();

    // Bump the slider to 26 --- EoE should now be available.
    await page.getByTestId("ngg-spoiler-ep-slider").fill("26");
    await expect(eoe).toBeEnabled();
    await expect(label).toHaveAttribute("data-disabled", "false");
    await expect(hint).toBeHidden();
  });

  test("dropping the slider below 26 unchecks and disables EoE", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("ngg-spoiler-ep-slider").fill("26");
    const eoe = page.getByTestId("ngg-spoiler-eoe");
    await eoe.check();
    await expect(eoe).toBeChecked();

    await page.getByTestId("ngg-spoiler-ep-slider").fill("7");
    await expect(eoe).not.toBeChecked();
    await expect(eoe).toBeDisabled();
  });

  test("the 'finished it' preset enables EoE in one click", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("ngg-spoiler-preset-all").click();
    const eoe = page.getByTestId("ngg-spoiler-eoe");
    await expect(eoe).toBeEnabled();
  });

  test("a tampered localStorage payload (ep 7, eoe true) is normalized to ep 26", async ({
    page,
  }) => {
    // Manually seed an impossible state. parseSpoilerProgress should rescue
    // it on read and the renderer should treat the user as fully caught up.
    await seedSpoilerProgress(page, { episode: 7, eoe: true, rebuild: false });
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    const root = page.getByTestId("ngg-graph-root");
    await expect(root).toHaveAttribute("data-spoiler-episode", "26");
    await expect(root).toHaveAttribute("data-spoiler-eoe", "true");
  });
});
