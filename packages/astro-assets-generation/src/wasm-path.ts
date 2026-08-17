import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const NODE_MODULES_SEGMENT = `${path.sep}node_modules${path.sep}`;

/**
 * Build-time helper: turn an absolute path pointing inside `node_modules` into a
 * path relative to the directory holding that `node_modules` (the workspace root
 * for pnpm monorepos), e.g.
 * `node_modules/.pnpm/@takumi-rs+wasm@2.9.0_.../node_modules/@takumi-rs/wasm/pkg/takumi_wasm_bg.wasm`.
 *
 * Absolute build-machine paths do not survive deployment: Vercel builds in
 * `/vercel/path0` and runs the serverless function from `/var/task`, keeping the
 * relative layout but changing the root. The relative path is therefore the only
 * part of a build-time path that stays valid at runtime.
 */
export function toNodeModulesRelativePath(absolutePath: string): string | null {
  const index = absolutePath.indexOf(NODE_MODULES_SEGMENT);
  if (index === -1) {
    return null;
  }

  return absolutePath.slice(index + 1);
}

function walkUpCandidates(relativePath: string, fromDir: string): string[] {
  const candidates: string[] = [];
  let dir = fromDir;

  for (;;) {
    candidates.push(path.join(dir, relativePath));
    const parent = path.dirname(dir);
    if (parent === dir) {
      return candidates;
    }
    dir = parent;
  }
}

/**
 * Runtime resolution of a file that was located at build time.
 *
 * Relative candidates are tried first on purpose: they are the ones that work on
 * a deploy target, so local builds exercise the same code path as production
 * instead of silently succeeding on the build-machine absolute path.
 *
 * NOTE: `integration.ts` inlines an equivalent resolver in the virtual
 * `#backend` module (it must be self-contained inside the consumer bundle).
 * Keep both in sync.
 */
export function resolveBuiltFilePath(options: {
  absolutePath?: string | null;
  relativePath?: string | null;
  /** Directory to start walking up from, usually the caller's own directory. */
  fromDir: string;
  /** Human readable name of the file, used in the error message. */
  label: string;
}): string {
  const { absolutePath, relativePath, fromDir, label } = options;

  const candidates = relativePath
    ? [
        ...walkUpCandidates(relativePath, fromDir),
        ...walkUpCandidates(relativePath, process.cwd()),
      ]
    : [];

  if (absolutePath) {
    candidates.push(absolutePath);
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `[@bearstudio/astro-assets-generation] Could not locate ${label} at runtime. ` +
      `If you deploy to a serverless platform, make sure the file is part of the ` +
      `function bundle (e.g. \`includeFiles\` for @astrojs/vercel). Tried:\n` +
      candidates.join("\n")
  );
}

/**
 * Locate the Takumi WASM binary through Node resolution. `@takumi-rs/wasm` is a
 * transitive dependency of `takumi-js` and lives in takumi-js's own pnpm virtual
 * `node_modules`, so it must be resolved via takumi-js's location rather than
 * directly.
 */
export function resolveTakumiWasmPath(fromUrl: string): string | null {
  try {
    const _require = createRequire(fromUrl);
    const takumiPath = _require.resolve("takumi-js");
    const takumiRequire = createRequire(takumiPath);
    return takumiRequire.resolve("@takumi-rs/wasm/takumi_wasm_bg.wasm");
  } catch {
    return null;
  }
}
