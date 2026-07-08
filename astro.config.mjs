import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// The site is a GitHub Pages *project* deployment, so in production it is
// served from a repo-name subpath (e.g. /Neon-Genesis-Evangeli-Graph/). The
// deploy workflow passes that prefix in via PUBLIC_BASE_PATH (sourced from
// actions/configure-pages). Locally --- dev, preview, unit + e2e --- the var
// is unset, so the base stays "/" and every goto("/") and root-absolute
// asset path keeps working untouched.
const base = process.env.PUBLIC_BASE_PATH || "/";

export default defineConfig({
  site: "https://grantklassy.github.io",
  base,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
