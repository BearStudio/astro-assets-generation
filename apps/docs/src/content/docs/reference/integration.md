---
title: astroAssetsGeneration()
description: The Astro integration and the Vite configuration it applies.
sidebar:
  order: 2
---

```javascript title="astro.config.mjs"
import { astroAssetsGeneration } from "@bearstudio/astro-assets-generation";

export default defineConfig({
  integrations: [react(), astroAssetsGeneration()],
});
```

Returns an `AstroIntegration` named `@bearstudio/astro-assets-generation`. It
takes no options. It must be listed together with `@astrojs/react`, which
compiles the `.tsx` templates.

## What it configures

The integration runs in the `astro:config:setup` hook and updates the Vite
configuration so Takumi's WebAssembly renderer works in each output mode. The
native `@takumi-rs/core` bindings are never used.

### `output: "static"` (default)

- Bundles `takumi-js`, `@takumi-rs/wasm`, `@takumi-rs/helpers` and this
  library into the prerender bundle (`ssr.noExternal`). Prerendered chunks run
  in a temporary Node context that cannot resolve packages outside the app's
  own `node_modules`, so they must be inlined.
- Replaces Takumi's internal backend import with a virtual module that reads
  the `.wasm` file from disk and initialises the WebAssembly backend
  synchronously.

### Server output or a route with `prerender = false`

- Keeps `takumi-js` external and bundles only this library.
- Injects the location of the `.wasm` file as build-time constants. At runtime
  the file is looked up relative to the bundle first, then at the build-time
  absolute path, so deployments that move the bundle to another directory
  (Vercel builds in one path and runs in another) still find it.

### All modes

- Adds the `.wasm` file to `vite.assetsInclude`. `@astrojs/vercel` forwards
  this list to its file tracer, which copies the file into the serverless
  function bundle.
- Excludes `takumi-js` from Vite's dependency pre-bundling.

## Runtime error

If the `.wasm` file cannot be found when a server route renders, the error
message begins with:

```
[@bearstudio/astro-assets-generation] Could not locate the Takumi WASM binary at runtime.
```

followed by the list of paths that were tried. See
[Troubleshooting](../../guides/troubleshooting/#vercel-function-cannot-find-the-takumi-wasm-binary).

## Peer dependencies

| Package         | Versions                        |
| --------------- | ------------------------------- |
| `astro`         | `^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0` |
| `@astrojs/react` | any version matching your Astro |
| `react`, `react-dom` | 18 or 19               |
