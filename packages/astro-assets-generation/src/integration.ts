import type { AstroIntegration } from "astro";
import { cpSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

// nft (used by @astrojs/vercel) can't statically trace napi-rs platform-conditional
// require() calls, so the native .node bindings are missing from the function bundle.
// We fix this by copying them directly after the Vercel adapter finishes.
function injectTakumiBindings() {
  if (process.platform !== "linux") return;

  const functionsDir = resolve(process.cwd(), ".vercel", "output", "functions");
  if (!existsSync(functionsDir)) return;

  const bindings = ["core-linux-x64-gnu", "core-linux-arm64-gnu"];

  for (const entry of readdirSync(functionsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.endsWith(".func")) continue;

    for (const binding of bindings) {
      const src = resolve(process.cwd(), "node_modules", "@takumi-rs", binding);
      if (!existsSync(src)) continue;

      const dest = resolve(
        functionsDir,
        entry.name,
        "node_modules",
        "@takumi-rs",
        binding
      );
      cpSync(src, dest, { recursive: true, dereference: true });
    }
  }
}

export function astroAssetsGeneration(): AstroIntegration {
  return {
    name: "@bearstudio/astro-assets-generation",
    hooks: {
      "astro:config:setup": ({ config, updateConfig }) => {
        updateConfig({
          vite: {
            optimizeDeps: { exclude: ["@takumi-rs/image-response"] },
            ssr: {
              external: ["@takumi-rs/image-response"],
              noExternal: ["@bearstudio/astro-assets-generation"],
            },
          },
        });

        // Wrap the Vercel adapter's astro:build:done so our injection runs
        // after nft has already written the function bundle.
        const adapter = config.adapter;
        if (adapter?.name === "@astrojs/vercel") {
          const originalBuildDone = adapter.hooks?.["astro:build:done"];
          updateConfig({
            adapter: {
              ...adapter,
              hooks: {
                ...adapter.hooks,
                "astro:build:done": async (options: any) => {
                  await (originalBuildDone as any)?.(options);
                  injectTakumiBindings();
                },
              },
            },
          });
        }
      },
    },
  };
}
