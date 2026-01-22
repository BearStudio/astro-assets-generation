import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  minify: true,
  external: ["astro", "react", "react-dom"],
  treeshake: true,
});
