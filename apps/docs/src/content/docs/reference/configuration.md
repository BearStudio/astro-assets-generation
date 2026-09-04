---
title: configure()
description: Every option accepted by configure(), with defaults.
sidebar:
  order: 1
---

```typescript
import { configure } from "@bearstudio/astro-assets-generation";

configure(options);
```

Sets the library-wide configuration. Call it once from a module that is
imported by every API route (a side-effect import is enough). Later calls merge
into the existing configuration; options you omit keep their current value.

## Options

All options are optional.

### `siteUrl`

- **Type:** `string`
- **Default:** `""`

Public origin of the site, without a trailing slash. Used to resolve
`/`-prefixed font URLs and Astro image sources when they are fetched over HTTP.
Pass `import.meta.env.SITE`, which Astro fills from `site` in your config.

### `isDev`

- **Type:** `boolean`
- **Default:** `true`

Whether the code runs under the Astro dev server. Controls how Astro images are
read: from the local filesystem in dev, through `loadAsset` then HTTP
otherwise. Always pass `import.meta.env.DEV`. Leaving the default `true` in a
production build makes image loading fail.

### `customFonts`

- **Type:** [`FontConfig[]`](../types/#fontconfig)
- **Default:** `[]`

Fonts made available to Takumi and to `FontWrapper`. Each entry is one file
with one weight and one style. Fonts load lazily on first use and are cached
for the lifetime of the process. See [Fonts](../fonts/) for URL resolution
rules.

### `emoji`

- **Type:** [`EmojiType`](../types/#emojitype)
- **Default:** `"twemoji"`

Emoji artwork used when a template does not set its own `emoji` in
`AssetImageConfig`.

### `loadAsset`

- **Type:** [`AssetLoader`](../types/#assetloader)
- **Default:** `undefined`

Hook called before fetching a `/`-prefixed font URL or an Astro image source in
non-dev mode. Receives the URL path (for example `/fonts/Geist.ttf` or
`/_astro/logo.abc123.png`) and returns a `Buffer`, or `null` or `undefined` to
fall back to HTTP. Use [`diskLoader()`](../helpers/#diskloaderoptions) for static
builds. Leave unset for server adapters.

### `debugBackground`

- **Type:** `string` (CSS colour)
- **Default:** `"#0a0a0a"`

Background colour of the `.debug` preview page around the rendered image.

## Example

```typescript title="src/lib/assets.ts"
import { configure } from "@bearstudio/astro-assets-generation";
import { diskLoader } from "@bearstudio/astro-assets-generation/disk-loader";

configure({
  siteUrl: import.meta.env.SITE ?? "http://localhost:4321",
  isDev: import.meta.env.DEV,
  customFonts: [
    { name: "Geist", url: "/fonts/Geist.ttf", weight: 400, style: "normal" },
  ],
  emoji: "twemoji",
  loadAsset: diskLoader(),
  debugBackground: "#0a0a0a",
});
```

## `getConfiguredFonts()`

```typescript
import { getConfiguredFonts } from "@bearstudio/astro-assets-generation";

const fonts: FontConfig[] = getConfiguredFonts();
```

Returns the current `customFonts` array. `FontWrapper` uses it to build its
font stack when no `customFonts` prop is given.
