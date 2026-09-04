---
title: Deploy to Vercel
description: Run on-demand image generation as a Vercel serverless function.
sidebar:
  order: 7
---

A static site needs nothing special: `astro build` writes the images and Vercel
serves them as files. This guide is for on-demand rendering, where the image
route runs inside a serverless function.

## Add the adapter

```bash
pnpm astro add vercel
```

```javascript title="astro.config.mjs"
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import { astroAssetsGeneration } from "@bearstudio/astro-assets-generation";

export default defineConfig({
  site: "https://your-domain.com",
  integrations: [react(), astroAssetsGeneration()],
  adapter: vercel(),
});
```

Keep `astroAssetsGeneration()` in the list. On Vercel it does one extra thing:
it registers Takumi's WebAssembly renderer with the adapter's file tracer, so
the file is copied into the function bundle. Without it the function fails at
runtime with a message starting with
`Could not locate the Takumi WASM binary`.

## Opt the route out of prerendering

```typescript title="src/pages/blog/[slug]/assets/[__image].[__type].ts"
import { apiImageEndpoint } from "@bearstudio/astro-assets-generation";
import type { APIRoute } from "astro";
import "../../../../lib/assets";

export const prerender = false;

export const GET: APIRoute = apiImageEndpoint(
  import.meta.glob("./_*.tsx", { eager: true }),
);
```

## Remove the disk loader

Delete `loadAsset: diskLoader()` and the `disk-loader` import from your config
module:

```typescript title="src/lib/assets.ts"
import { configure } from "@bearstudio/astro-assets-generation";

configure({
  siteUrl: import.meta.env.SITE,
  isDev: import.meta.env.DEV,
});
```

Vercel traces every file your function reads. The disk loader reads from
`dist/`, so leaving it in place ships your whole build output inside the
function and can push it over the size limit. Without it, fonts and images are
fetched from `siteUrl` at request time.

## Set the site URL

`siteUrl` must be the domain the function can fetch its own assets from. Set
`site` in the Astro config to your production domain. Preview deployments then
fetch from production, which is fine as long as the fonts and images exist
there.

## Deploy

```bash
vercel deploy
```

Request an image on the deployment and check the function logs. A successful
render logs two lines:

```
[API] Request: og-image/png
[API] Rendering template: _og-image.tsx
```

## Add cache headers

Serverless renders cost execution time. Return `Cache-Control` so Vercel's edge
cache serves repeat requests. See step 6 of the
[dynamic tutorial](../../tutorials/dynamic-og-images/#6-add-cache-headers) for
the wrapper.

## Other serverless platforms

Netlify and Cloudflare adapters follow the same steps: add the adapter, set
`prerender = false`, remove the disk loader, set `siteUrl`. The renderer is
WebAssembly and needs no native binary, so it runs wherever Node or a
compatible runtime does.
