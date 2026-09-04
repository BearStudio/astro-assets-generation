---
title: Fonts
description: Built-in fallback fonts, URL resolution rules and caching behaviour.
sidebar:
  order: 7
---

## Built-in fallback fonts

Four fonts are always registered after your `customFonts`. They cover scripts
that most Latin fonts lack.

| Name     | Script   | File                                          | Weight | Style  |
| -------- | -------- | --------------------------------------------- | ------ | ------ |
| `Thai`   | Thai     | Noto Sans Thai 5.2.8, `thai-400-normal.woff2` | 400    | normal |
| `Jap`    | Japanese | Noto Sans JP 5.2.8, `japanese-400-normal.woff2` | 400  | normal |
| `KR`     | Korean   | Noto Sans KR 5.2.8, `korean-400-normal.woff2` | 400    | normal |
| `Arabic` | Arabic   | Noto Sans Arabic 5.2.8, `arabic-400-normal.woff2` | 400 | normal |

They are served from `https://cdn.jsdelivr.net/npm/@fontsource/…` and fetched
on first use. Only 400 normal is provided; bold or italic non-Latin text falls
back to synthetic styling or to another font in the stack.

`FontWrapper` appends these names to its `font-family`. If you set
`fontFamily` by hand and need them, list them yourself:

```tsx
<p style={{ fontFamily: "Geist, Thai, Jap, KR, Arabic, sans-serif" }}>
```

## URL resolution

The `url` of a `FontConfig` is interpreted by its shape:

The checks run in this order and the first match wins.

| Shape                        | Behaviour                                                                  |
| ---------------------------- | -------------------------------------------------------------------------- |
| `http://…` or `https://…`    | Fetched over HTTP.                                                         |
| Starts with `/`              | `loadAsset(url)` if configured, else fetched from `new URL(url, siteUrl)`. |
| Other absolute path (`C:\…`) | Read from disk.                                                            |
| `./relative/path.ttf`        | Reserved for the library's own bundled fonts. Not for user fonts.          |

Because the `/` check comes first, a POSIX filesystem path such as
`/Users/me/fonts/Geist.ttf` is treated as a web path, not a file. Put user
fonts in `public/` and reference them as `/fonts/…`, or use an `https://` URL.

## Loading and caching

- Fonts are passed to Takumi as lazy loaders keyed by `url`. A file is fetched
  the first time a render needs it and kept in memory for the life of the
  process.
- Font subsetting is on: only glyphs that appear in the rendered content are
  processed.
- Registering the same `name` several times with different `weight` or `style`
  values is the intended way to provide a family.

## Font matching

For each text run Takumi looks up the requested `fontFamily`, `fontWeight` and
`fontStyle` among the registered fonts. When a glyph is missing from the chosen
font, it continues down the `font-family` list. Register every weight and style
you use: a face that is not registered is not synthesised from another one in
a predictable way.

## Debug preview

The `.debug` page declares every registered font with `@font-face` so the
browser shows the same typefaces. Font URLs starting with `/` are used as-is,
so they must be reachable from the browser on the dev server.
