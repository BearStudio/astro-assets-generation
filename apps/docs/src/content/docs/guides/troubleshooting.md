---
title: Troubleshoot common problems
description: Symptoms, causes and fixes for images, fonts, emoji and deployment issues.
sidebar:
  order: 8
---

## The image URL returns 404

Work through these in order:

1. **Template file name.** It must start with `_` and end in `.tsx`, for
   example `_og-image.tsx`. The URL uses the name without the underscore:
   `og-image.png`.
2. **Route file name.** It must be exactly `[__image].[__type].ts`, with two
   underscores before each param. One underscore makes Astro treat the params
   as regular names and the handler never sees them.
3. **Static paths.** With `getStaticPaths`, the URL must match a generated
   path. Check the parent params (is the slug in your collection?) and the
   image types (did you list `"jpg"` if you request `.jpg`?). This applies in
   dev too.
4. **The `.debug` URL in a static project.** It is only served when `"debug"`
   is in the image types. See
   [Preview a template](../preview-templates/#enable-the-url-in-a-static-project).
5. **Unsupported extension.** Only `png`, `jpg`, `jpeg` and `debug` are
   handled. Anything else is a 404.

## The image URL returns 500

The template threw during render. Look at the terminal or function logs: the
handler prints `[API] Error:` followed by the exception.

Common causes:

- `configure()` never ran because the config module is not imported in the
  route file. Add `import "../../lib/assets"` (adjust the path).
- A `getEntry` call returned `undefined` and the template used it. Throw
  `NotFoundAssetError` for a 404 instead of a 500.
- A font or image could not be fetched. See below.

## Fonts do not load

The PNG uses a fallback typeface even though a font is registered.

- **Name mismatch.** The `name` in `customFonts` must equal what you write in
  `fontFamily`. Case matters.
- **Weight or style missing.** `fontWeight: "bold"` needs a 700 entry.
  `fontStyle: "italic"` needs an `italic` entry.
- **File unreachable.** For a `/fonts/...` URL, a static build needs
  `loadAsset: diskLoader()` and the file in `public/fonts/`. A server build
  fetches `siteUrl + url`, so `siteUrl` must be your public domain and the
  file must be deployed. The error message in the log gives the URL that was
  tried.
- **CDN blocked.** The built-in Thai, Japanese, Korean and Arabic fallbacks
  come from jsDelivr. If your environment blocks it, register your own
  fallback fonts.

## Emoji do not render

- The emoji provider fetches artwork from a CDN. If the environment has no
  network access, switch to `emoji: "from-font"` and register a colour emoji
  font. See [Change the emoji provider](../emoji-provider/).
- The `.debug` preview never shows the provider's artwork. Check the `.png`.

## Astro images fail with "Must be a jpg, jpeg or png"

`getAstroImageBase64` only accepts PNG and JPEG. Convert SVG, WebP, AVIF or GIF
sources first.

## Astro images fail to fetch in a static build

`getAstroImageBase64` tries the disk loader, then HTTP. During `astro build`
there is no server, so a missing `loadAsset: diskLoader()` in `configure()`
leads to a failed fetch. Also confirm `isDev: import.meta.env.DEV` is set: the
default is `true`, which makes a build try to read dev-server paths.

## The layout looks different from the browser preview

The preview page uses the browser's CSS engine, while Takumi implements a
subset of CSS. Prefer flexbox layout and give every `<img>` an explicit width
and height. Check the `.png` for the final result.

## Build logs show warnings about `Astro.request.headers` or `Astro.session`

During prerender the handler copies every property of the Astro API context to
pass it to your template. Reading some of those properties triggers Astro's
"not available on prerendered pages" warnings. They are harmless and do not
affect the output.

## Vercel function cannot find the Takumi WASM binary

The error message starts with `Could not locate the Takumi WASM binary at
runtime`.

- Make sure `astroAssetsGeneration()` is in your `integrations`. It is what
  adds the file to the function bundle.
- Make sure `takumi-js` is installed as a regular dependency, not skipped by an
  install flag that drops optional or peer packages.

## The Vercel function is too large

The disk loader is still in the config. Remove `loadAsset: diskLoader()` and
the `disk-loader` import for serverless deployments. See
[Deploy to Vercel](../deploy-to-vercel/#remove-the-disk-loader).
