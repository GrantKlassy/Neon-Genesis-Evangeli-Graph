const { execSync } = require("child_process");

const PORT = Number(process.env.PORT ?? 4321);
const BASE = `http://localhost:${PORT}`;

function findChromePath() {
  try {
    const browserPath = execSync(
      "node -e \"const pw = require('@playwright/test'); console.log(pw.chromium.executablePath())\"",
      { encoding: "utf8" },
    ).trim();
    if (browserPath) return browserPath;
  } catch {}
  return undefined;
}

/** @type {import('@lhci/cli').LighthouseConfig} */
module.exports = {
  ci: {
    collect: {
      chromePath: findChromePath(),
      chromeFlags: ["--headless=new", "--no-sandbox"],
      url: [`${BASE}/`],
      startServerCommand: `pnpm run build && pnpm exec astro preview --port ${PORT}`,
      startServerReadyPattern: "localhost",
      numberOfRuns: 3,
      settings: {
        throttling: {
          rttMs: 70,
          throughputKbps: 12000,
          cpuSlowdownMultiplier: 4,
        },
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 800,
          deviceScaleFactor: 2,
        },
        formFactor: "mobile",
        onlyCategories: ["performance", "accessibility", "best-practices"],
      },
    },
    assert: {
      assertions: {
        // Category scores. Performance is intentionally lenient because
        // three.js + the WebGL boot is the entire point of the page.
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        // Timing metrics: relaxed compared to a static-content page because
        // we ship a ~125 KB gzipped three.js client bundle by design.
        "first-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "speed-index": ["error", { maxNumericValue: 3500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "max-potential-fid": ["warn", { maxNumericValue: 300 }],
        // Structural budgets
        "dom-size": ["error", { maxNumericValue: 1500 }],
        "server-response-time": ["error", { maxNumericValue: 500 }],
        "mainthread-work-breakdown": ["warn", { maxNumericValue: 3000 }],
        "bootup-time": ["warn", { maxNumericValue: 2000 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
