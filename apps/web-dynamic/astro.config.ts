import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";

const adapter =
  process.argv[3] === "--node" || process.argv[4] === "--node"
    ? node({ mode: "standalone" })
    : vercel({ isr: true });

const site = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:4321";

export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@takumi-rs/image-response"],
    },
    ssr: {
      external: ["@takumi-rs/image-response"],
      noExternal: ["@bearstudio/astro-assets-generation"],
    },
  },
  integrations: [react(), mdx()],
  adapter,
});
