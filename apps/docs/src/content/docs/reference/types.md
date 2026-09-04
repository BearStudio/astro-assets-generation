---
title: Types
description: Exported TypeScript types.
sidebar:
  order: 8
---

```typescript
import type {
  AssetImageConfig,
  AssetLoader,
  EmojiType,
  FontConfig,
  FontConfiguration,
  FontWrapperProps,
} from "@bearstudio/astro-assets-generation";
```

## `AssetImageConfig`

```typescript
interface AssetImageConfig {
  width: number;
  height: number;
  debugScale?: number;
  emoji?: EmojiType;
}
```

| Field        | Description                                                              |
| ------------ | ------------------------------------------------------------------------ |
| `width`      | Output width in pixels.                                                  |
| `height`     | Output height in pixels.                                                 |
| `debugScale` | Zoom factor of the `.debug` preview. Default `0.5`.                      |
| `emoji`      | Emoji provider for this template. Overrides `emoji` from `configure()`.  |

Exported as `config` from every [template module](../templates/).

## `EmojiType`

```typescript
type EmojiType =
  | "twemoji"
  | "blobmoji"
  | "noto"
  | "openmoji"
  | "fluent"
  | "fluentFlat"
  | "from-font";
```

`"from-font"` uses glyphs from the registered fonts and performs no network
request. All other values fetch artwork from a CDN.

## `FontConfig`

```typescript
interface FontConfig {
  name: string;
  url: string;
  weight: number;
  style: "normal" | "italic";
}
```

| Field    | Description                                                                              |
| -------- | ---------------------------------------------------------------------------------------- |
| `name`   | Family name used in `fontFamily`.                                                        |
| `url`    | `https://` URL, `/`-rooted web path, or absolute filesystem path. See [Fonts](../fonts/#url-resolution). |
| `weight` | 100 to 900.                                                                              |
| `style`  | `"normal"` or `"italic"`.                                                                |

## `FontConfiguration`

```typescript
interface FontConfiguration {
  fonts?: FontConfig[];
}
```

Exported for completeness. Not used by the public API.

## `AssetLoader`

```typescript
type AssetLoader = (url: string) => Promise<Buffer | null | undefined>;
```

Signature of `loadAsset` in `configure()`. `url` is a `/`-rooted path such as
`/fonts/Geist.ttf` or `/_astro/logo.abc123.png`. Return the file contents, or
`null` / `undefined` to let the library fetch over HTTP.

## `FontWrapperProps`

```typescript
interface FontWrapperProps {
  children: ReactNode;
  customFonts?: FontConfig[];
  fontFamily?: string;
  style?: React.CSSProperties;
}
```

See [`FontWrapper`](../components/#fontwrapper).
