---
title: Embed images in a template
description: Add logos, avatars, remote pictures and nested renders to a generated image.
sidebar:
  order: 4
---

Templates use the plain `<img>` element. The renderer needs to know the image
size, so always give `width` and `height` in the `style`.

## Use an image from `src/`

Import the file like you would in any Astro component, then convert it to a
data URI with `getAstroImageBase64`. The function runs at render time, so call
it inside the async template:

```tsx title="src/pages/blog/[slug]/assets/_og-image.tsx"
import { getAstroImageBase64 } from "@bearstudio/astro-assets-generation";
import logo from "../../../../assets/logo.png";

export default async function OgImage() {
  const logoSrc = await getAstroImageBase64(logo);

  return (
    <div style={{ display: "flex", padding: 64 }}>
      <img src={logoSrc} style={{ width: 160, height: 160 }} />
    </div>
  );
}
```

The same works for images declared in a content collection schema with the
`image()` helper, for example an author avatar:

```tsx
const post = await getEntry("blog", params.slug);
const avatar = await getAstroImageBase64(post.data.author.avatar);

<img src={avatar} style={{ width: 128, height: 128, borderRadius: 9999 }} />;
```

Only PNG and JPEG sources are accepted. Convert SVG or WebP files beforehand.

### How the file is found

- **Dev server**: read straight from disk.
- **Static build**: read from `dist/` through `diskLoader()`. Keep
  `loadAsset: diskLoader()` in `configure()`.
- **Server adapter**: fetched from `siteUrl` at request time. The image must be
  deployed with the site, which Astro does for you.

## Use a remote image

Pass the URL directly. Takumi fetches it during render:

```tsx
<img
  src="https://example.com/cover.jpg"
  style={{ width: 400, height: 225, objectFit: "cover" }}
/>
```

The render fails if the URL is unreachable from the build machine or server.

## Use a file from `public/`

Files in `public/` are not imported, so `getAstroImageBase64` does not apply.
Build an absolute URL from the `site` prop the template receives instead:

```tsx
export default function OgImage({ site }: { site?: URL }) {
  const badge = new URL("/images/badge.png", site).href;
  return <img src={badge} style={{ width: 96, height: 96 }} />;
}
```

In a static build the URL must be reachable at build time, which it usually is
not. Prefer importing from `src/` for static sites.

## Render one component inside another

`jsxToBase64` renders any JSX element to a PNG and returns a data URI. Use it
when part of the image has its own fixed size and layout, such as a QR code or
a chart:

```tsx
import { jsxToBase64 } from "@bearstudio/astro-assets-generation";

export default async function OgImage() {
  const badge = await jsxToBase64(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#3b82f6",
        color: "white",
        fontSize: 48,
      }}
    >
      New
    </div>,
    { width: 300, height: 150 },
  );

  return (
    <div style={{ display: "flex", padding: 64 }}>
      <img src={badge} style={{ width: 300, height: 150 }} />
    </div>
  );
}
```

The nested render uses the same fonts and emoji provider as the outer one.
