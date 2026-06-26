import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import { astroAssetsGeneration } from "@bearstudio/astro-assets-generation";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react(), mdx(), astroAssetsGeneration()],
});
