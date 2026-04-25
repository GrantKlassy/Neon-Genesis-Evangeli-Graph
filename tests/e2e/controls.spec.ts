import { expect, test } from "@playwright/test";
import { waitForGraphState } from "./_helpers";

test.describe("graph controls + programmatic API", () => {
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
    expect(ids).toContain("A7");
    expect(ids).toContain("A8");
    expect(ids).toContain("C1");

    await page.evaluate(() => {
      const h = (
        window as { __nggGraph?: { selectNodeById: (id: string) => void } }
      ).__nggGraph;
      h?.selectNodeById("A7");
    });

    const panel = page.getByTestId("ngg-selected");
    await expect(panel).toHaveAttribute("data-empty", "false");
    await expect(page.getByTestId("ngg-selected-title")).toContainText(
      /Local-Combination-46/,
    );
    await expect(page.getByTestId("ngg-selected-kind")).toContainText(
      /late.night.pair/i,
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
      h?.selectNodeById("A7");
    });
    await expect(root).toHaveAttribute("data-highlighted-node", "A7");

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
