---
title: Template modules
description: The contract a _*.tsx file must follow to be picked up as an image template.
sidebar:
  order: 3
---

A template is a `.tsx` module whose file name starts with `_`, placed in the
same folder as an [API route](../api-route/) and collected with
`import.meta.glob("./_*.tsx", { eager: true })`.

## File name

```
_<name>.tsx
```

`<name>` becomes the `__image` segment of the URL. `_og-image.tsx` is served as
`og-image.png`, `og-image.jpg`, `og-image.jpeg` and `og-image.debug`. The
leading underscore also prevents Astro from treating the file as a page.

## Exports

### `config` (required)

```typescript
export const config: AssetImageConfig = {
  width: 1200,
  height: 630,
  debugScale: 0.5,
  emoji: "twemoji",
};
```

| Field        | Type        | Required | Description                                                       |
| ------------ | ----------- | -------- | ----------------------------------------------------------------- |
| `width`      | `number`    | yes      | Output width in pixels.                                           |
| `height`     | `number`    | yes      | Output height in pixels.                                          |
| `debugScale` | `number`    | no       | Zoom of the `.debug` preview. Default `0.5`.                      |
| `emoji`      | `EmojiType` | no       | Emoji provider for this template. Overrides the global setting.   |

See [`AssetImageConfig`](../types/#assetimageconfig).

### `default` (required)

```typescript
export default function Template(props: TemplateProps): JSX.Element | Promise<JSX.Element>;
```

A React component, sync or async, that returns the JSX to render. It is called
once per request with the props below and its result is passed to Takumi.

The returned element is rendered into a `width × height` canvas. Its root
element should fill the canvas: give it `width: "100%"` and `height: "100%"`,
or wrap it in [`FontWrapper`](../components/#fontwrapper), which does that for
you.

## Props

The component receives the Astro API context of the request, spread into a
single object:

| Prop      | Type                     | Description                                                                  |
| --------- | ------------------------ | ---------------------------------------------------------------------------- |
| `params`  | `Record<string, string>` | Route params: your own (for example `slug`) plus `__image` and `__type`.      |
| `site`    | `URL \| undefined`       | The `site` from the Astro config.                                            |
| `request` | `Request`                | The incoming request. Headers are not available on prerendered routes.       |
| `url`     | `URL`                    | The request URL.                                                             |
| `locals`  | `App.Locals`             | Middleware locals.                                                           |
| …         |                          | Every other `APIContext` member (`cookies`, `redirect`, `generator`, and so on). |

Context getters that throw on prerendered routes, such as `clientAddress`, are
replaced by `undefined` rather than throwing.

Type the props you use:

```tsx
export default async function OgImage({
  params,
  site,
}: {
  params: { slug: string };
  site?: URL;
}) {
  // ...
}
```

## Signalling "not found"

Throw `NotFoundAssetError` to make the route answer `404` instead of `500`:

```tsx
import { NotFoundAssetError } from "@bearstudio/astro-assets-generation";

const post = await getEntry("blog", params.slug);
if (!post) throw new NotFoundAssetError();
```

Any other exception results in a `500` response and is logged.

## Styling

Styles are inline `style` objects, typed as `React.CSSProperties`. Takumi
implements a subset of CSS. The following are used throughout these docs and
render reliably:

- Flexbox layout (`display: "flex"`, `flexDirection`, `gap`, `alignItems`,
  `justifyContent`, …).
- Box model: `padding`, `margin`, `width`, `height`, `borderRadius`, `border`.
- Text: `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `lineHeight`,
  `textAlign`, `color`.
- Backgrounds: colours and `linear-gradient(…)`.
- Images via `<img>` with explicit `width` and `height`.

Class names and external stylesheets have no effect. For the full list of
supported properties, see the
[Takumi repository](https://github.com/takumi-rs/takumi). Verify anything not listed
above in the rendered `.png`, not only in the `.debug` preview.

## Data access

The module runs inside Astro's server build, so it can import `astro:content`
and use `getEntry`, `getCollection` and `render`, import images from `src/`,
read files with `node:fs`, or `fetch` remote data.
