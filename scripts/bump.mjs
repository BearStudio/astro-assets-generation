#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_PATH = resolve(
  __dirname,
  "../packages/astro-assets-generation/package.json",
);

const BUMP_TYPES = ["major", "minor", "patch"];
const type = process.argv[2];

if (!BUMP_TYPES.includes(type)) {
  console.error(`Usage: pnpm bump <${BUMP_TYPES.join("|")}>`);
  process.exit(1);
}

const status = execSync("git status --porcelain", { encoding: "utf8" }).trim();
if (status) {
  console.error(
    "Working tree is not clean. Commit or stash your changes before bumping.",
  );
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8"));
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(pkg.version);
if (!match) {
  console.error(`Unsupported version format: ${pkg.version}`);
  process.exit(1);
}

const [, majorStr, minorStr, patchStr] = match;
const major = Number(majorStr);
const minor = Number(minorStr);
const patch = Number(patchStr);

const nextVersion =
  type === "major"
    ? `${major + 1}.0.0`
    : type === "minor"
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

pkg.version = nextVersion;
writeFileSync(PKG_PATH, `${JSON.stringify(pkg, null, 2)}\n`);

const tag = `v${nextVersion}`;
const message = `chore: release ${tag}`;

execSync(`git add "${PKG_PATH}"`, { stdio: "inherit" });
execSync(`git commit -m "${message}"`, { stdio: "inherit" });
execSync(`git tag -a "${tag}" -m "${message}"`, { stdio: "inherit" });

console.log(`Bumped to ${nextVersion} and tagged ${tag}.`);
console.log("");
console.log("Next steps:");
console.log("  1. Push the commit and tag:");
console.log("       git push --follow-tags");
console.log("  2. Publish to npm:");
console.log("       cd packages/astro-assets-generation && pnpm npm:publish");
