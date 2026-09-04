---
title: Change the emoji provider
description: Pick which emoji artwork is used, globally or per template, and render emoji offline.
sidebar:
  order: 3
---

Emoji inside any text node are detected and drawn as images from an emoji set.
Twemoji is used by default. Nothing is required to get emoji working:

```tsx
<h1>Hello 👋 World 🌍</h1>
```

## Change the default for every template

Set `emoji` in `configure()`:

```typescript title="src/lib/assets.ts"
configure({
  emoji: "noto",
  // ...
});
```

## Override it for one template

Set `emoji` in the template's `config`. The template value wins over the global
one:

```tsx title="src/pages/blog/[slug]/assets/_og-image.tsx"
export const config: AssetImageConfig = {
  width: 1200,
  height: 630,
  emoji: "fluent",
};
```

## Available providers

| Value          | Artwork                              |
| -------------- | ------------------------------------ |
| `"twemoji"`    | Twitter emoji (default)              |
| `"blobmoji"`   | Google's blob emoji                  |
| `"noto"`       | Noto Color Emoji                     |
| `"openmoji"`   | OpenMoji                             |
| `"fluent"`     | Microsoft Fluent, 3D style           |
| `"fluentFlat"` | Microsoft Fluent, flat style         |
| `"from-font"`  | Glyphs from the fonts you registered |

## Render emoji without network access

Every provider except `"from-font"` downloads emoji images from a CDN during
render. If your build machine or server has no internet access, or you want a
fully reproducible build, do this instead:

1. Register a font that contains colour emoji glyphs, for example Noto Color
   Emoji, in `customFonts`. See [Add custom fonts](../custom-fonts/).
2. Add it to the `fontFamily` of the text that contains emoji, or to
   `FontWrapper`.
3. Set `emoji: "from-font"` globally or on the template.

```typescript title="src/lib/assets.ts"
configure({
  emoji: "from-font",
  customFonts: [
    { name: "Geist", url: "/fonts/Geist.ttf", weight: 400, style: "normal" },
    { name: "Emoji", url: "/fonts/NotoColorEmoji.ttf", weight: 400, style: "normal" },
  ],
});
```

```tsx
<FontWrapper fontFamily="Geist, Emoji">
  <h1>Ship it 🚀</h1>
</FontWrapper>
```

## Check the result

The `.debug` preview uses the browser's emoji font, so it does not reflect the
provider. Open the `.png` to see the chosen artwork.
