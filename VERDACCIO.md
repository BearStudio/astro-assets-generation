# Release on Verdaccio

This guide explains how to publish `@bearstudio/astro-assets-generation` to a local Verdaccio registry to test the library before publishing it to npm.

## Prerequisites

- [Verdaccio](https://verdaccio.org/) installed (`npm install -g verdaccio`)
- pnpm installed

## 1. Start Verdaccio

In a separate terminal:

```bash
verdaccio
```

Verdaccio will be available at `http://localhost:4873`.

## 2. Configure max body size (first time only)

The library tarball exceeds Verdaccio's default body size limit. Update `~/.config/verdaccio/config.yaml` to raise it:

```yaml
# https://verdaccio.org/docs/configuration#max-body-size
max_body_size: 20mb
```

Restart Verdaccio after saving the file.

## 3. Create an account (first time only)

```bash
npm adduser --registry http://localhost:4873
```

Enter any username, password, and email — the values can be fake for local use.

## 4. Build the library

From the monorepo root:

```bash
pnpm build
```

Or only the package:

```bash
cd packages/astro-assets-generation
pnpm build
```

## 5. Publish to Verdaccio

```bash
cd packages/astro-assets-generation
pnpm verdaccio:publish
```

This runs:

```bash
pnpm publish --registry http://localhost:4873 --no-git-checks
```

> The `--no-git-checks` flag allows publishing without a clean working tree.

## 6. Test in a project

In the project that consumes the library:

```bash
pnpm add @bearstudio/astro-assets-generation --registry http://localhost:4873
```

## 7. Republish after changes

If the version hasn't changed, unpublish first:

```bash
cd packages/astro-assets-generation
pnpm verdaccio:unpublish
```

Then rebuild and republish:

```bash
pnpm build
pnpm verdaccio:publish
```

If the version has changed (in `package.json`), you can republish directly without unpublishing.

## Bumping the version

Manually update the `version` field in `packages/astro-assets-generation/package.json` before publishing.

Example:

```json
{
  "version": "0.3.0"
}
```
