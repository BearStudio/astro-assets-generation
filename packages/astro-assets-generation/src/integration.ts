import type { AstroIntegration } from "astro";
import { realpathSync } from "node:fs";
import path from "node:path";
import {
  resolveTakumiWasmPath as resolveTakumiWasmPathFrom,
  toNodeModulesRelativePath,
} from "./wasm-path";

const resolveTakumiWasmPath = (): string | null =>
  resolveTakumiWasmPathFrom(import.meta.url);

// Locate the Takumi WASM file so @astrojs/vercel includes it in the serverless
// function bundle without app consumers needing manual includeFiles config.
// This integration deliberately runs Takumi on WASM everywhere: it needs no
// platform-specific optional dependency on the deploy target and works in
// runtimes where the native addon cannot load (WebContainer, edge). The native
// @takumi-rs/core-* packages do exist, but we never resolve them.
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
        const resolvedWasmFilePath = resolveTakumiWasmPath();
        const wasmFilePath = isStatic ? resolvedWasmFilePath : null;
        const serverWasmFilePath = isStatic ? null : resolvedWasmFilePath;
        // Path that stays valid once the bundle is deployed, see wasm-path.ts.
        const wasmRelativePath = resolvedWasmFilePath
          ? toNodeModulesRelativePath(resolvedWasmFilePath)
          : null;
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
            // Both the absolute and the node_modules-relative path are injected: the
            // absolute one no longer exists on deploy targets that move the bundle to
            // another filesystem root (Vercel builds in /vercel/path0, runs from
            // /var/task), where only the relative layout is preserved.
            ...(isStatic
              ? {}
              : {
                  define: {
                    __TAKUMI_WASM_PATH__: JSON.stringify(serverWasmFilePath),
                    __TAKUMI_WASM_RELATIVE_PATH__: JSON.stringify(
                      serverWasmFilePath ? wasmRelativePath : null
                    ),
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
                      // and keeps the native .node binding out of the prerender
                      // context, where @takumi-rs/core cannot be resolved.
                      if (
                        id === "#backend" &&
                        importer?.includes("/takumi-js/")
                      ) {
                        return "\0virtual:takumi-wasm-node-backend";
                      }
                    },
                    load(id: string) {
                      if (id === "\0virtual:takumi-wasm-node-backend") {
                        // Read the WASM binary synchronously at module load time. This
                        // is equivalent to what @takumi-rs/wasm/bundlers/node.mjs does
                        // but without the new URL(..., import.meta.url) that breaks in
                        // SSR builds. Import @takumi-rs/wasm by absolute path because
                        // Rollup cannot resolve bare package names from virtual module
                        // context.
                        //
                        // The WASM path itself is resolved at runtime, relative-first:
                        // an `output: "static"` site with an adapter still serves its
                        // on-demand routes from this bundle on the deploy target, where
                        // the build-time absolute path no longer exists (Vercel builds
                        // in /vercel/path0, runs from /var/task) but the relative
                        // node_modules layout is preserved. This mirrors
                        // resolveBuiltFilePath in wasm-path.ts, inlined because the
                        // virtual module must be self-contained — keep both in sync.
                        return `
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as wasm from ${JSON.stringify(wasmEsmPath)};

const ABSOLUTE_PATH = ${JSON.stringify(wasmFilePath)};
const RELATIVE_PATH = ${JSON.stringify(wasmRelativePath)};

const walkUpCandidates = (fromDir) => {
  const candidates = [];
  let dir = fromDir;
  for (;;) {
    candidates.push(path.join(dir, RELATIVE_PATH));
    const parent = path.dirname(dir);
    if (parent === dir) return candidates;
    dir = parent;
  }
};

const resolveWasmFilePath = () => {
  const candidates = RELATIVE_PATH
    ? [
        ...walkUpCandidates(path.dirname(fileURLToPath(import.meta.url))),
        ...walkUpCandidates(process.cwd()),
      ]
    : [];
  candidates.push(ABSOLUTE_PATH);
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    "[@bearstudio/astro-assets-generation] Could not locate the Takumi WASM binary at runtime. " +
      "If you deploy to a serverless platform, make sure the file is part of the function bundle " +
      "(e.g. \`includeFiles\` for @astrojs/vercel). Tried:\\n" +
      candidates.join("\\n")
  );
};

wasm.initSync({ module: readFileSync(resolveWasmFilePath()) });
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
