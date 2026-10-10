import { defineConfig } from "astro/config";

// SITE_URL / BASE_PATH come from actions/configure-pages in CI, so the same build works at
// openinfinity.github.io/website/ (before the custom domain) and at www.open-infinity.com.
export default defineConfig({
  // configure-pages reports http:// until HTTPS is enforced; the site is always served over https
  site: (process.env.SITE_URL || "https://www.open-infinity.com").replace(/^http:/, "https:"),
  base: process.env.BASE_PATH || "/",
});
