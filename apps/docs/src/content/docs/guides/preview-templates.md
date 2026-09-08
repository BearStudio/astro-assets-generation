---
title: Preview a template in the browser
description: Use the .debug URL to iterate on a template's layout without rendering a PNG on every change.
sidebar:
  order: 1
---

Every template can be opened as an HTML page instead of an image. Replace the
file extension in the URL with `.debug`:

```
/blog/my-post/assets/og-image.png    → the image
/blog/my-post/assets/og-image.debug  → the preview page
```

The preview page renders your JSX with the browser's engine, scaled down to fit
the window, on a dark background so the image edges are visible. Hot reload
works, so you can keep the page open while you edit the template.

## Enable the URL in a static project

Astro only serves a dynamic route for the params returned by `getStaticPaths`,
in dev as well as in build. If your route lists `["png"]` or relies on the
default `["png", "jpg"]`, the `.debug` URL returns 404.

Add `"debug"` to the image types in dev only, so preview pages never end up in
your build output:

```typescript title="src/pages/blog/[slug]/assets/[__image].[__type].ts" ins={6}
export const getStaticPaths = async () => {
  const posts = await getCollection("blog");
  return getStaticPathsForAssets(
    modules,
    posts.map((post) => ({ slug: post.id })),
    import.meta.env.DEV ? ["png", "debug"] : ["png"],
  );
};
```

Routes with `prerender = false` need no change: any type reaches the handler.

## Change the preview scale

The default scale is 0.5, so a 1200×630 image shows as 600×315. Set
`debugScale` in the template's `config` to change it:

```tsx
export const config: AssetImageConfig = {
  width: 1200,
  height: 630,
  debugScale: 0.75,
};
```

Use `1` to see the image at its real size.

## Change the page background

The colour around the preview comes from `debugBackground` in `configure()`:

```typescript title="src/lib/assets.ts"
configure({
  debugBackground: "#ffffff",
  // ...
});
```

## What the preview does not show

The browser is not Takumi. Expect small differences in text wrapping, line
height and font fallback. Emoji render with the browser's own emoji font, not
the configured provider. Always check the actual `.png` before shipping a
design.
