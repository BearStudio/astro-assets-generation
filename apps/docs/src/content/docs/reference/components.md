---
title: Components
description: The FontWrapper React component.
sidebar:
  order: 5
---

## `FontWrapper`

```tsx
import { FontWrapper } from "@bearstudio/astro-assets-generation";

<FontWrapper fontFamily="Geist" style={{ background: "#0f172a" }}>
  {children}
</FontWrapper>
```

Renders a `<div>` that fills its parent and sets a `font-family` stack
combining your fonts with the built-in fallbacks for non-Latin scripts.

### Props

| Prop          | Type                  | Default                        | Description                                                                 |
| ------------- | --------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| `children`    | `ReactNode`           | required                       | Content to wrap.                                                            |
| `fontFamily`  | `string`              | `undefined`                    | Primary font name, placed first in the stack. Only the first comma-separated name is used. |
| `customFonts` | `FontConfig[]`        | fonts from `configure()`       | Fonts whose names are added to the stack after the primary font. Does not load fonts; they must still be registered globally. |
| `style`       | `React.CSSProperties` | `{}`                           | Merged over the wrapper's own styles.                                       |

### Rendered output

```tsx
<div
  style={{
    fontFamily: "<primary>, <other custom fonts>, Thai, Jap, KR, Arabic, sans-serif",
    width: "100%",
    height: "100%",
    ...style,
  }}
>
  {children}
</div>
```

`Thai`, `Jap`, `KR` and `Arabic` are the names of the
[built-in fallback fonts](../fonts/#built-in-fallback-fonts). The primary font
is omitted from the "other custom fonts" part so it is never listed twice.

### Type

```typescript
import type { FontWrapperProps } from "@bearstudio/astro-assets-generation";
```
