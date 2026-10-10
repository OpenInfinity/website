import { defineConfig } from "astro/config";

// SITE_URL / BASE_PATH come from actions/configure-pages in CI, so the same build works at
// openinfinity.github.io/website/ (before the custom domain) and at www.open-infinity.com.
export default defineConfig({
  site: process.env.SITE_URL || "https://www.open-infinity.com",
  base: process.env.BASE_PATH || "/",
});
