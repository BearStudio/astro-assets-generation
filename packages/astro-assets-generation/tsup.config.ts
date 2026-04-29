import { defineConfig } from "tsup";
import { copyFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";
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
    "@twemoji/svg",
  ],
  onSuccess: async () => {
    copyFileSync("src/emoji-data.json", "dist/emoji-data.json");
    rmSync("src/emoji-data.json");

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
