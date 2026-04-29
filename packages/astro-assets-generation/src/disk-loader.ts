import fs from "node:fs/promises";
import path from "node:path";
import type { AssetLoader } from "./image";

/**
 * Built-in `loadAsset` for builds without a running server (e.g.
 * `output: 'static'`). Reads the requested URL from `dist/` then `public/`,
 * relative to `process.cwd()`.
 *
 * Lives in a sub-export so the `process.cwd()` / `dist` patterns never reach
 * the main entry — @vercel/nft would otherwise trace `dist/**` into
 * serverless function bundles for users who don't opt in.
 */
export function diskLoader(
  options: { directories?: string[] } = {}
): AssetLoader {
  const directories = options.directories ?? ["dist", "public"];
  return async (url) => {
    const relative = url.replace(/^\//, "");
    for (const dir of directories) {
      try {
        return await fs.readFile(path.resolve(process.cwd(), dir, relative));
      } catch {
        continue;
      }
    }
    return null;
  };
}
