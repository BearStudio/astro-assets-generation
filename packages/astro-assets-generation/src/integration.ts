import type { AstroIntegration } from "astro";
import { existsSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const takumiNativePackage = "@takumi-rs/core-linux-x64-gnu";
const takumiNativeBinding = "core.linux-x64-gnu.node";
// takumi-js v2 resolves its native binding via @takumi-rs/core, which itself
// tries the sibling platform package. We locate the .node file so @astrojs/vercel
// can include it in the serverless function bundle without manual includeFiles.

const resolvePackage = (packageName: string) => {
  try {
    return require.resolve(packageName);
  } catch {
    return undefined;
  }
};

const getTakumiNativeFiles = (root: URL) => {
  const packageDirName = takumiNativePackage.split("/").at(-1);
  const candidatePackageDirs = [
    join(
      fileURLToPath(root),
      "node_modules",
      ...takumiNativePackage.split("/"),
    ),
  ];

  // The native package may be installed either from the consuming app or from
  // this library's optional dependency, depending on the package manager layout.
  for (const nodeModulesDir of require.resolve.paths(takumiNativePackage) ??
    []) {
    candidatePackageDirs.push(
      join(nodeModulesDir, ...takumiNativePackage.split("/")),
    );
  }

  // @takumi-rs/core is a transitive dep of takumi-js; resolve it to find
  // where the @takumi-rs/ scope lives so we can locate the platform package.
  const takumiCorePath =
    resolvePackage("@takumi-rs/core") ?? resolvePackage("takumi-js");

  if (takumiCorePath && packageDirName) {
    const coreScopeDir = dirname(dirname(dirname(takumiCorePath)));

    // Takumi's loader resolves the platform package from @takumi-rs/core first.
    // With pnpm, that can live inside core's virtual node_modules directory.
    candidatePackageDirs.push(join(coreScopeDir, packageDirName));
  }

  return [
    ...new Set(
      candidatePackageDirs.flatMap((packageDir) => {
        const files = [
          join(packageDir, takumiNativeBinding),
          join(packageDir, "package.json"),
        ];

        return files.flatMap((file) => {
          if (!existsSync(file)) {
            return [];
          }

          // Include both the symlink and the real file so pnpm links remain valid
          // after @astrojs/vercel copies assets into the serverless function.
          return [file, realpathSync(file)];
        });
      }),
    ),
  ];
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
              ...getTakumiNativeFiles(config.root),
            ],
            optimizeDeps: { exclude: ["takumi-js"] },
            ssr: {
              external: ["takumi-js"],
              noExternal: ["@bearstudio/astro-assets-generation"],
            },
          },
        });
      },
    },
  };
}
