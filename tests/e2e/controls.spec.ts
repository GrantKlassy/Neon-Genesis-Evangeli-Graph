import { expect, test } from "@playwright/test";
import { SPOILER_FULL, seedSpoilerProgress, waitForGraphState } from "./_helpers";

test.describe("graph controls + programmatic API", () => {
  test.beforeEach(async ({ page }) => {
    await seedSpoilerProgress(page, SPOILER_FULL);
  });

  test("pause/play toggle flips auto-rotate state", async ({ page }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    const button = page.getByTestId("ngg-toggle-rotate");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(button).toContainText(/rotating/i);

    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(button).toContainText(/paused/i);

    const auto = await page.evaluate(
      () =>
        (window as { __nggGraph?: { autoRotate: boolean } }).__nggGraph
          ?.autoRotate,
    );
    expect(auto).toBe(false);

    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
  });

  test("clear button resets selection", async ({ page }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    // Programmatically pick the first node so we don't depend on raycaster geometry.
    await page.evaluate(() => {
      const h = (
        window as {
          __nggGraph?: {
            selectNodeById: (id: string) => void;
            nodeIds: string[];
          };
        }
      ).__nggGraph;
      if (h) h.selectNodeById(h.nodeIds[0]!);
    });
    const panel = page.getByTestId("ngg-selected");
    await expect(panel).toHaveAttribute("data-empty", "false");

    await page.getByTestId("ngg-clear-selection").click();
    await expect(panel).toHaveAttribute("data-empty", "true");
  });

  test("selectNodeById exposes a programmatic selection hook", async ({
    page,
  }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    const ids = await page.evaluate(
      () =>
        (window as { __nggGraph?: { nodeIds: string[] } }).__nggGraph?.nodeIds,
    );
    expect(ids).toContain("char_shinji");
    expect(ids).toContain("angel_05_ramiel");
    expect(ids).toContain("magi_casper");

    await page.evaluate(() => {
      const h = (
        window as { __nggGraph?: { selectNodeById: (id: string) => void } }
      ).__nggGraph;
      h?.selectNodeById("char_shinji");
    });

    const panel = page.getByTestId("ngg-selected");
    await expect(panel).toHaveAttribute("data-empty", "false");
    await expect(page.getByTestId("ngg-selected-title")).toContainText(
      /Shinji Ikari/,
    );
    await expect(page.getByTestId("ngg-selected-kind")).toContainText(
      /character/i,
    );
  });

  test("highlight state updates dataset on selection", async ({ page }) => {
    await page.goto("/");
    const state = await waitForGraphState(page);
    test.skip(state !== "ready", `graph state was ${state}`);

    const root = page.getByTestId("ngg-graph-root");
    await page.evaluate(() => {
      const h = (
        window as { __nggGraph?: { selectNodeById: (id: string) => void } }
      ).__nggGraph;
      h?.selectNodeById("magi_casper");
    });
    await expect(root).toHaveAttribute(
      "data-highlighted-node",
      "magi_casper",
    );

    await page.evaluate(() => {
      const h = (
        window as {
          __nggGraph?: { selectNodeById: (id: string | null) => void };
        }
      ).__nggGraph;
      h?.selectNodeById(null);
    });
    await expect(root).toHaveAttribute("data-highlighted-node", "");
  });
});
