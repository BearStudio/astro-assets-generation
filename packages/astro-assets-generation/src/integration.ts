import type { AstroIntegration } from "astro";
import { existsSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const takumiNativePackage = "@takumi-rs/core-linux-x64-gnu";
const takumiNativeBinding = "core.linux-x64-gnu.node";

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

  for (const nodeModulesDir of require.resolve.paths(takumiNativePackage) ??
    []) {
    candidatePackageDirs.push(
      join(nodeModulesDir, ...takumiNativePackage.split("/")),
    );
  }

  const takumiCorePath = resolvePackage("@takumi-rs/core");

  if (takumiCorePath && packageDirName) {
    const coreScopeDir = dirname(dirname(dirname(takumiCorePath)));

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
            assetsInclude: [
              ...toArray(config.vite.assetsInclude),
              ...getTakumiNativeFiles(config.root),
            ],
            optimizeDeps: { exclude: ["@takumi-rs/image-response"] },
            ssr: {
              external: ["@takumi-rs/image-response"],
              noExternal: ["@bearstudio/astro-assets-generation"],
            },
          },
        });
      },
    },
  };
}
