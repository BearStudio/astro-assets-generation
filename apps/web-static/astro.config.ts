import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import { astroAssetsGeneration } from "@bearstudio/astro-assets-generation";

// The origin is frozen into the static output at build time, so `site` must be
// set for absolute URLs (og:image) and for the library's asset/font fetching.
const site = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:4321";

export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react(), mdx(), astroAssetsGeneration()],
});
