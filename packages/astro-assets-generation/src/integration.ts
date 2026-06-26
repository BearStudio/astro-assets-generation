import type { AstroIntegration } from "astro";
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);

// Locate the Takumi WASM file. @takumi-rs/wasm is a transitive dep of takumi-js
// and lives in takumi-js's own pnpm virtual node_modules, so it must be resolved
// via takumi-js's location rather than directly.
function resolveTakumiWasmPath(): string | null {
  try {
    const takumiPath = _require.resolve("takumi-js");
    const takumiReq = createRequire(takumiPath);
    return takumiReq.resolve("@takumi-rs/wasm/takumi_wasm_bg.wasm");
  } catch {
    return null;
  }
}

// Locate the Takumi WASM file so @astrojs/vercel includes it in the serverless
// function bundle without app consumers needing manual includeFiles config.
// takumi-js v2 beta.7+ does not publish platform-specific native packages;
// the WASM backend is used for all platforms until native packages are released.
const getTakumiFiles = (): string[] => {
  const wasmPath = resolveTakumiWasmPath();
  if (!wasmPath) return [];
  try {
    // Include both the symlink and the real file so pnpm links remain valid
    // after @astrojs/vercel copies assets into the serverless function.
    return [...new Set([wasmPath, realpathSync(wasmPath)])];
  } catch {
    return [wasmPath];
  }
};

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

export function astroAssetsGeneration(): AstroIntegration {
  return {
    name: "@bearstudio/astro-assets-generation",
    hooks: {
      "astro:config:setup": ({ config, updateConfig }) => {
        updateConfig({
          vite: {
            // @astrojs/vercel forwards vite.assetsInclude into its file tracer.
            // This keeps the Takumi native binding in the function bundle without
            // making app consumers configure Vercel includeFiles themselves.
            assetsInclude: [
              ...toArray(config.vite.assetsInclude),
              ...getTakumiFiles(),
            ],
            optimizeDeps: { exclude: ["takumi-js"] },
            ssr: {
              external: ["takumi-js"],
              noExternal: ["@bearstudio/astro-assets-generation"],
            },
            // Inject the WASM file path at SSR bundle time so bundled code can
            // read it without needing runtime module resolution. @takumi-rs/wasm
            // lives in takumi-js's pnpm virtual node_modules and cannot be
            // resolved via CJS require from the SSR bundle context.
            define: {
              __TAKUMI_WASM_PATH__: JSON.stringify(resolveTakumiWasmPath()),
            },
          },
        });
      },
    },
  };
}
