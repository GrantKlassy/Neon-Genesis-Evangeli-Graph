import { expect, test } from "@playwright/test";
import {
  SPOILER_FULL,
  SPOILER_NONE,
  revealWithProgress,
  waitForGraphState,
} from "./_helpers";

test.describe("spoiler gate --- first-visit prompt", () => {
  test("opens the gate on first page load", async ({ page }) => {
    await page.goto("/");
    const gate = page.getByTestId("ngg-spoiler-gate");
    await expect(gate).toBeVisible();
    await expect(gate).toHaveAttribute("data-state", "visible");
  });

  test("revealing closes the gate", async ({ page }) => {
    await page.goto("/");
    const gate = page.getByTestId("ngg-spoiler-gate");
    await expect(gate).toBeVisible();
    await page.getByTestId("ngg-spoiler-reveal").click();
    await expect(gate).toBeHidden();
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

test.describe("spoiler gate --- persistence + force eject", () => {
  test("revealing writes the progress to localStorage", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("ngg-spoiler-ep-slider").fill("12");
    await page.getByTestId("ngg-spoiler-reveal").click();

    const stored = await page.evaluate(() =>
      localStorage.getItem("ngg-spoiler-progress"),
    );
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.episode).toBe(12);
  });

  test("returning visit skips the gate and broadcasts persisted tier", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("ngg-spoiler-ep-slider").fill("8");
    await page.getByTestId("ngg-spoiler-reveal").click();

    // Reload --- the gate should NOT prompt this time. The renderer should
    // have received ep=8 via the bootstrap broadcast.
    await page.reload();
    const gate = page.getByTestId("ngg-spoiler-gate");
    await expect(gate).toBeHidden();
    const root = page.getByTestId("ngg-graph-root");
    await expect(root).toHaveAttribute("data-spoiler-episode", "8");
  });

  test("preseeded localStorage bypasses the gate (peek-graph.mjs invariant)", async ({
    page,
  }) => {
    // Mirrors what scripts/peek-graph.mjs does: seed a full-reveal
    // SpoilerProgress before any page script runs. The gate must read it
    // on bootstrap and stay hidden, and the renderer must broadcast the
    // seeded tier into data-spoiler-* attributes on the graph root.
    //
    // If this breaks (storage key renamed, schema changed, gate stops
    // honoring persisted state on first paint), `task local:peek` would
    // silently capture the spoiler gate instead of the graph. Catch it
    // here, not by squinting at a screenshot.
    await page.addInitScript(() => {
      localStorage.setItem(
        "ngg-spoiler-progress",
        JSON.stringify({ episode: 26, eoe: true }),
      );
    });
    await page.goto("/");

    const gate = page.getByTestId("ngg-spoiler-gate");
    await expect(gate).toBeHidden();
    const root = page.getByTestId("ngg-graph-root");
    await expect(root).toHaveAttribute("data-spoiler-episode", "26");
    await expect(root).toHaveAttribute("data-spoiler-eoe", "true");
  });

  test("force-eject row is hidden on first visit (nothing to eject)", async ({
    page,
  }) => {
    await page.goto("/");
    const ejectRow = page.getByTestId("ngg-spoiler-eject-row");
    await expect(ejectRow).toBeHidden();
  });

  test("force-eject row appears once a tier is persisted", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("ngg-spoiler-reveal").click();
    // Reopen so we can SEE the eject row inside the gate.
    await page.getByTestId("ngg-spoiler-reopen").click();
    const ejectRow = page.getByTestId("ngg-spoiler-eject-row");
    await expect(ejectRow).toBeVisible();
  });

  test("dies-by-end-of-series badge stays hidden pre-show-complete", async ({
    page,
  }) => {
    await page.goto("/");
    // Reveal at ep 25 + no EoE --- the EoE-equivalent visibility rule
    // would unmask the tag (eoe-or-ep25), but the show-complete rule
    // is stricter (eoe AND ep>=26), so the badge must NOT show.
    await page.getByTestId("ngg-spoiler-ep-slider").fill("25");
    await page.getByTestId("ngg-spoiler-reveal").click();

    const showDeath = await page.evaluate(
      () => document.body.dataset.spoilersShowDeath,
    );
    expect(showDeath).toBe("false");
    // Misato carries the death tag in the SSR character cards; her badge
    // should be in markup but hidden by CSS.
    const badge = page.getByTestId("ngg-death-badge-char_misato");
    await expect(badge).toBeHidden();
  });

  test("dies-by-end-of-series badge shows when show is complete", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("ngg-spoiler-preset-all").click();
    await page.getByTestId("ngg-spoiler-eoe").check();
    await page.getByTestId("ngg-spoiler-reveal").click();

    const showDeath = await page.evaluate(
      () => document.body.dataset.spoilersShowDeath,
    );
    expect(showDeath).toBe("true");
    // The Readout DOM badges are below the graph pin --- scroll into
    // view first so the visibility check is meaningful.
    const badge = page.getByTestId("ngg-death-badge-char_misato");
    await badge.scrollIntoViewIfNeeded();
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/dies by end of series/i);
  });

  test("force eject clears localStorage and re-prompts on reload", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("ngg-spoiler-ep-slider").fill("20");
    await page.getByTestId("ngg-spoiler-reveal").click();

    // Reopen, eject. The gate stays open and the slider snaps back to 0.
    await page.getByTestId("ngg-spoiler-reopen").click();
    await page.getByTestId("ngg-spoiler-eject").click();
    const stored = await page.evaluate(() =>
      localStorage.getItem("ngg-spoiler-progress"),
    );
    expect(stored).toBeNull();
    const readout = page.getByTestId("ngg-spoiler-ep-readout");
    await expect(readout).toHaveText("0");
    // Eject row hides itself once localStorage is empty again.
    await expect(page.getByTestId("ngg-spoiler-eject-row")).toBeHidden();

    // And after a reload the user gets the first-visit prompt again.
    await page.reload();
    await expect(page.getByTestId("ngg-spoiler-gate")).toBeVisible();
  });
});

test.describe("renderer applies the gate to nodes and edges", () => {
  test("at full progress, no nodes are masked", async ({ page }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);
    await revealWithProgress(page, SPOILER_FULL);

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
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);
    await revealWithProgress(page, SPOILER_NONE);

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
        thirdImpact: h.isNodeMasked("concept_third_impact"),
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
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);
    await revealWithProgress(page, SPOILER_NONE);

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
        thirdImpact: h.isNodeMasked("concept_third_impact"),
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
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);
    await revealWithProgress(page, SPOILER_NONE);

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
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);
    await revealWithProgress(page, SPOILER_NONE);

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
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);
    await revealWithProgress(page, { episode: 26, eoe: true });

    const root = page.getByTestId("ngg-graph-root");
    await expect(root).toHaveAttribute("data-spoiler-episode", "26");
    await expect(root).toHaveAttribute("data-spoiler-eoe", "true");
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
});

test.describe("spoiler gate --- canon scope is TV + EoE only", () => {
  test("there is no Rebuild checkbox in the gate", async ({ page }) => {
    await page.goto("/");
    // Catch any silent re-introduction of the Rebuild row. The schema
    // and gate are TV+EoE only --- if a future change adds a Rebuild
    // toggle back the user expects this test to scream.
    await expect(page.getByTestId("ngg-spoiler-rebuild")).toHaveCount(0);
    await expect(page.getByTestId("ngg-spoiler-rebuild-label")).toHaveCount(0);
    await expect(page.getByTestId("ngg-spoiler-rebuild-hint")).toHaveCount(0);
  });
});
