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

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: [
        "@takumi-rs/image-response",
        "@takumi-rs/core",
        "@takumi-rs/helpers",
      ],
    },
    ssr: {
      noExternal: [
        "@takumi-rs/image-response",
        "@takumi-rs/core",
        "@takumi-rs/helpers",
        "@bearstudio/astro-assets-generation",
      ],
    },
  },
  integrations: [react(), mdx()],
  adapter,
});
