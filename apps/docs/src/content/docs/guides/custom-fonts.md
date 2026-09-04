---
title: Add custom fonts
description: Register font files, use them in templates, and keep non-Latin text rendering correctly.
sidebar:
  order: 2
---

Without configuration Takumi renders text with a generic sans-serif. To use your
own typeface, register the font files once and reference them by name in your
templates.

## Register the font files

Put the files in `public/fonts/` and list them in `configure()`. One entry per
weight and style:

```typescript title="src/lib/assets.ts"
configure({
  customFonts: [
    {
      name: "Tomorrow",
      url: "/fonts/Tomorrow-Regular.ttf",
      weight: 400,
      style: "normal",
    },
    {
      name: "Tomorrow",
      url: "/fonts/Tomorrow-Bold.ttf",
      weight: 700,
      style: "normal",
    },
    {
      name: "Tomorrow",
      url: "/fonts/Tomorrow-Italic.ttf",
      weight: 400,
      style: "italic",
    },
  ],
  // ...
});
```

`name` is the value you will write in `fontFamily`. It does not have to match
the name embedded in the font file.

Register every weight you use. If a template asks for `fontWeight: "bold"` and
only the 400 file is registered, Takumi falls back to another font for the bold
text.

The `url` can also be:

- An `https://` URL, fetched directly.
- An absolute filesystem path, read from disk.

TTF, OTF and WOFF2 files work.

## Make the files reachable

A `/fonts/...` URL is resolved against `siteUrl`:

- **Static output**: keep `loadAsset: diskLoader()` in `configure()`. The
  build reads the file from `public/` with no network.
- **Server adapter**: the running server fetches `siteUrl + url`. Make sure
  `siteUrl` is your public domain and the fonts are deployed with the site.

Fonts load on the first render that needs them and stay cached in memory
afterwards.

## Use the font in a template

Wrap your content in `FontWrapper`:

```tsx
import { FontWrapper } from "@bearstudio/astro-assets-generation";

export default function OgImage() {
  return (
    <FontWrapper fontFamily="Tomorrow">
      <h1 style={{ fontSize: 72, fontWeight: 700 }}>Bold headline</h1>
      <p style={{ fontSize: 28, fontStyle: "italic" }}>Italic body</p>
    </FontWrapper>
  );
}
```

`FontWrapper` renders a full-size `div` whose `font-family` lists your font
first, then the other registered fonts, then the built-in fallbacks for Thai,
Japanese, Korean and Arabic, then `sans-serif`. Everything inside inherits it.

You can also set `fontFamily` on any element yourself. Do this when one block
needs a different typeface:

```tsx
<span style={{ fontFamily: "Tomorrow", fontSize: 24 }}>Tagline</span>
```

## Keep non-Latin text working

Most Latin fonts have no glyphs for 日本語, 한국어, العربية or ไทย. When a
character is missing, Takumi walks the `font-family` list and takes the glyph
from the first font that has it. `FontWrapper` puts the built-in Noto Sans
fallbacks on that list, so mixed-language strings render without extra work:

```tsx
<FontWrapper fontFamily="Tomorrow">
  <p>English, 日本語, 한국어, العربية, ไทย</p>
</FontWrapper>
```

The fallback fonts are downloaded from jsDelivr on first use. Only the glyphs
present in your content are processed, so a full CJK font costs little.

If your build or server cannot reach the CDN, register your own fallback and
list it in `fontFamily`:

```typescript title="src/lib/assets.ts"
configure({
  customFonts: [
    { name: "Tomorrow", url: "/fonts/Tomorrow-Regular.ttf", weight: 400, style: "normal" },
    { name: "Noto JP", url: "/fonts/NotoSansJP-Regular.ttf", weight: 400, style: "normal" },
  ],
});
```

```tsx
<FontWrapper fontFamily="Tomorrow, Noto JP">
```

## Pass fonts to one template only

`FontWrapper` accepts a `customFonts` prop that replaces the global list for
that wrapper. The fonts still have to be registered in `configure()` so Takumi
can load them; the prop only changes the `font-family` stack.

```tsx
<FontWrapper fontFamily="Tomorrow" customFonts={[tomorrowRegular]}>
```

## Check the result

Open the `.debug` URL: the preview page declares the same fonts with
`@font-face`, so you can see the typeface in the browser. Then open the `.png`.
If the browser shows the font but the PNG does not, the file URL is reachable
from your machine but not from the render process. See
[Troubleshooting](../troubleshooting/#fonts-do-not-load).
