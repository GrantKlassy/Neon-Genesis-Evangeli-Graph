import { expect, test } from "@playwright/test";

/**
 * When WebGL is unavailable, the graph host must surface a clear fallback so
 * the page still works as a readable data dump.
 *
 * We monkey-patch HTMLCanvasElement.getContext to refuse webgl/webgl2 contexts
 * before the inline script bootstraps. Other 2D usage stays unaffected.
 */
test.describe("WebGL unavailable", () => {
  test("falls back to readable mode when no WebGL context", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const proto = HTMLCanvasElement.prototype as unknown as {
        getContext: (
          this: HTMLCanvasElement,
          id: string,
          ...rest: unknown[]
        ) => unknown;
      };
      const original = proto.getContext;
      proto.getContext = function (
        this: HTMLCanvasElement,
        id: string,
        ...rest: unknown[]
      ) {
        if (id === "webgl" || id === "webgl2" || id === "experimental-webgl") {
          return null;
        }
        return (original as Function).apply(this, [id, ...rest]);
      } as typeof original;
    });

    await page.goto("/");

    const root = page.locator('[data-testid="ngg-graph-root"]');
    await page.waitForFunction(
      () => {
        const el = document.querySelector(
          '[data-testid="ngg-graph-root"]',
        ) as HTMLElement | null;
        return !!el && el.dataset.state === "no-webgl";
      },
      null,
      { timeout: 8000 },
    );
    await expect(root).toHaveAttribute("data-state", "no-webgl");
    const fallback = page.locator('[data-testid="ngg-fallback"]');
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText(/WebGL unavailable/i);

    // Readout still renders so the page is useful.
    const readout = page.locator('[data-testid="ngg-readout"]');
    await expect(readout).toBeVisible();
  });
});
