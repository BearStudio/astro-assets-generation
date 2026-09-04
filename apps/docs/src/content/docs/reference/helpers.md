---
title: Helper functions
description: getAstroImageBase64(), jsxToBase64() and diskLoader().
sidebar:
  order: 6
---

## `getAstroImageBase64(image)`

```typescript
import { getAstroImageBase64 } from "@bearstudio/astro-assets-generation";

const dataUri: string = await getAstroImageBase64(image);
```

| Parameter | Type              | Description                                                                        |
| --------- | ----------------- | ---------------------------------------------------------------------------------- |
| `image`   | `{ src: string }` | An Astro `ImageMetadata` object: an imported image or an `image()` collection field. |

Returns a `data:image/<png|jpeg>;base64,…` string for use as an `<img>` `src`.

Accepted formats: `.png`, `.jpg`, `.jpeg`. Any other extension throws
`Must be a jpg, jpeg or png`.

Resolution order:

| `isDev` | Steps                                                                 |
| ------- | --------------------------------------------------------------------- |
| `true`  | Read the file from disk using the dev server's `/@fs/` source path.  |
| `false` | Call `loadAsset(image.src)` if configured; if it returns nothing, fetch `new URL(image.src, siteUrl)`. |

## `jsxToBase64(element, size)`

```typescript
import { jsxToBase64 } from "@bearstudio/astro-assets-generation";

const dataUri: string = await jsxToBase64(<Badge />, { width: 300, height: 150 });
```

| Parameter | Type                                | Description                       |
| --------- | ----------------------------------- | --------------------------------- |
| `element` | `JSX.Element`                       | Element to render.                |
| `size`    | `{ width: number; height: number }` | Canvas size in pixels.            |

Renders the element to PNG with the globally configured fonts and emoji
provider and returns a `data:image/png;base64,…` string. Use it to embed a
rendered component inside another template.

## `diskLoader(options?)`

```typescript
import { diskLoader } from "@bearstudio/astro-assets-generation/disk-loader";

configure({ loadAsset: diskLoader() });
configure({ loadAsset: diskLoader({ directories: ["dist", "public", "static"] }) });
```

| Option        | Type       | Default              | Description                                                        |
| ------------- | ---------- | -------------------- | ------------------------------------------------------------------ |
| `directories` | `string[]` | `["dist", "public"]` | Directories, relative to `process.cwd()`, searched in order.       |

Returns an [`AssetLoader`](../types/#assetloader). Given a URL path such as
`/fonts/Geist.ttf`, it strips the leading slash and tries
`<cwd>/<directory>/fonts/Geist.ttf` for each directory. Returns the first file
found, or `null` so the library falls back to HTTP.

The function lives in its own entry point, `…/disk-loader`, so that code
referencing `process.cwd()` and `dist` never enters the main bundle. File
tracers such as `@vercel/nft` would otherwise include the whole `dist/`
folder in serverless functions. Import it only for static builds.
