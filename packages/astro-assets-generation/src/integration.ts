import type { AstroIntegration } from "astro";
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

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
        const isStatic = config.output === "static";
        const wasmFilePath = isStatic ? resolveTakumiWasmPath() : null;
        // Absolute path to @takumi-rs/wasm ESM glue code, used in the virtual module.
        // Rollup cannot resolve the package name from a virtual module (no importer
        // context), so we use the absolute path computed at build time.
        const wasmEsmPath = wasmFilePath
          ? path.join(
              path.dirname(path.dirname(wasmFilePath)),
              "dist/export.mjs"
            )
          : null;
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
            ssr: isStatic
              ? {
                  // For static output, takumi-js must be bundled because pre-rendered
                  // page chunks run in a temporary Node.js context that cannot resolve
                  // packages outside the app's own node_modules.
                  noExternal: [
                    "takumi-js",
                    "@takumi-rs/wasm",
                    "@takumi-rs/helpers",
                    "@bearstudio/astro-assets-generation",
                  ],
                }
              : {
                  external: ["takumi-js"],
                  noExternal: ["@bearstudio/astro-assets-generation"],
                },
            // For server/hybrid output, inject the WASM path so bundled code can
            // read the WASM binary at runtime without needing to resolve it through
            // pnpm's virtual node_modules (which is inaccessible from the bundle context).
            ...(isStatic
              ? {}
              : {
                  define: {
                    __TAKUMI_WASM_PATH__: JSON.stringify(resolveTakumiWasmPath()),
                  },
                }),
            plugins: wasmFilePath && wasmEsmPath
              ? [
                  {
                    name: "astro-assets-generation:takumi-wasm-backend",
                    enforce: "pre" as const,
                    resolveId(id: string, importer: string | undefined) {
                      // For static output, intercept takumi-js's #backend import and
                      // replace it with a virtual module that reads the WASM from an
                      // absolute path. This avoids relying on import.meta.url (which
                      // points to the output chunk in SSR builds, not the source file)
                      // and the native .node binding (unavailable in beta.7+).
                      if (
                        id === "#backend" &&
                        importer?.includes("/takumi-js/")
                      ) {
                        return "\0virtual:takumi-wasm-node-backend";
                      }
                    },
                    load(id: string) {
                      if (id === "\0virtual:takumi-wasm-node-backend") {
                        // Read the WASM binary synchronously at module load time using
                        // the absolute path resolved at build time. This is equivalent
                        // to what @takumi-rs/wasm/bundlers/node.mjs does but without
                        // the new URL(..., import.meta.url) that breaks in SSR builds.
                        // Import @takumi-rs/wasm by absolute path because Rollup cannot
                        // resolve bare package names from virtual module context.
                        return `
import { readFileSync } from "node:fs";
import * as wasm from ${JSON.stringify(wasmEsmPath)};
const wasmBytes = readFileSync(${JSON.stringify(wasmFilePath)});
wasm.initSync({ module: wasmBytes });
export const loadBackend = () => Promise.resolve(wasm);
`;
                      }
                    },
                  },
                ]
              : [],
          },
        });
      },
    },
  };
}
