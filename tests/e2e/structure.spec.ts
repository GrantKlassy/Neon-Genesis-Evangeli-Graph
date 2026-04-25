import { expect, test } from "@playwright/test";
import { waitForGraphState } from "./_helpers";

test.describe("graph structure visible in the DOM", () => {
  test("legend shows clusters and edge kinds", async ({ page }) => {
    await page.goto("/");
    await waitForGraphState(page);
    const legend = page.locator('[data-testid="ngg-legend"]');
    await expect(legend).toBeVisible();
    await expect(legend).toContainText(/Late-night pair/i);
    await expect(legend).toContainText(/Activity compression/i);
    await expect(legend).toContainText(/Hidden profiles/i);
    await expect(legend).toContainText(/Normal users/i);
    await expect(legend).toContainText(/Temporal proximity/i);
    await expect(legend).toContainText(/Direct comment/i);
  });

  test("readout has all four cluster cards", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('[data-testid="cluster-CL2_late_night_pair"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="cluster-CL1b_activity_compression"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="cluster-CL1_hidden_profiles"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="cluster-CL4_normal_users"]'),
    ).toBeVisible();
  });

  test("CL2 card lists A7 + A8 as members", async ({ page }) => {
    await page.goto("/");
    const cl2 = page.locator('[data-testid="cluster-CL2_late_night_pair"]');
    await expect(cl2).toContainText(/A7/);
    await expect(cl2).toContainText(/A8/);
    await expect(cl2).toContainText(/Local-Combination-46/);
    await expect(cl2).toContainText(/Vast-Walk-5938/);
  });

  test("anomalies and open threads sections are populated", async ({
    page,
  }) => {
    await page.goto("/");
    const anomalies = page.locator('[data-testid="ngg-anomalies"]');
    await expect(anomalies).toBeVisible();
    const anomalyItems = anomalies.locator("li");
    expect(await anomalyItems.count()).toBeGreaterThanOrEqual(5);

    const openThreads = page.locator('[data-testid="ngg-open-threads"]');
    await expect(openThreads).toBeVisible();
    const threadItems = openThreads.locator("li");
    expect(await threadItems.count()).toBeGreaterThanOrEqual(5);
  });

  test("source attribution links the GRAPH.md path", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator('[data-testid="ngg-footer"]');
    await expect(footer).toContainText(
      /funny3\/investigations\/wordword4numbers\/GRAPH\.md/,
    );
  });

  test("selected panel starts hidden", async ({ page }) => {
    await page.goto("/");
    await waitForGraphState(page);
    const panel = page.locator('[data-testid="ngg-selected"]');
    await expect(panel).toHaveAttribute("data-empty", "true");
    await expect(panel).toBeHidden();
  });
});
