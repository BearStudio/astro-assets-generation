import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
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
    "@twemoji/svg",
  ],
  onSuccess: "cp src/emoji-data.json dist/emoji-data.json",
});
