import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "disk-loader": "src/disk-loader.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  minify: true,
  external: [
    "astro",
    "react",
    "react-dom",
    "node:fs",
    "node:path",
    "node:url",
    "node:module",
  ],
});
