import type { AstroIntegration } from "astro";
import { existsSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const takumiNativeBindings = [
  {
    packageName: "@takumi-rs/core-linux-x64-gnu",
    binding: "core.linux-x64-gnu.node",
  },
  {
    packageName: "@takumi-rs/core-linux-arm64-gnu",
    binding: "core.linux-arm64-gnu.node",
  },
];

const getTakumiNativeFiles = (root: URL) => {
  return [
    ...new Set(
      takumiNativeBindings.flatMap(({ packageName, binding }) => {
        const packageDirName = packageName.split("/").at(-1);
        const candidatePackageDirs = [
          join(fileURLToPath(root), "node_modules", ...packageName.split("/")),
        ];

        for (const nodeModulesDir of require.resolve.paths(packageName) ?? []) {
          candidatePackageDirs.push(
            join(nodeModulesDir, ...packageName.split("/")),
          );
        }

        try {
          const coreScopeDir = dirname(
            dirname(dirname(require.resolve("@takumi-rs/core"))),
          );

          if (packageDirName) {
            candidatePackageDirs.push(join(coreScopeDir, packageDirName));
          }
        } catch {
          // The integration can still be evaluated in installs that do not use Takumi.
        }

        return candidatePackageDirs.flatMap((packageDir) => {
          const files = [
            join(packageDir, binding),
            join(packageDir, "package.json"),
          ];

          return files.flatMap((file) => {
            if (!existsSync(file)) {
              return [];
            }

            return [file, realpathSync(file)];
          });
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
            // @astrojs/vercel reads vite.assetsInclude, globs the matching files,
            // and adds them to nft's includeFiles. nft can't trace napi-rs
            // platform-conditional requires, so we force-include the linux
            // native bindings this way.
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
