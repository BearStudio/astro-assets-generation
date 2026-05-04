import { defineConfig } from "tsup";
import { copyFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

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
  ],
  onSuccess: async () => {
    mkdirSync("dist/fonts", { recursive: true });

    const fontsDir = "src/fonts";
    if (existsSync(fontsDir)) {
      const ttfFiles = readdirSync(fontsDir).filter((f) => f.endsWith(".ttf"));
      ttfFiles.forEach((file) => {
        copyFileSync(join(fontsDir, file), join("dist/fonts", file));
      });
    }
  },
});
