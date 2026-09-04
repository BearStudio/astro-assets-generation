---
title: Add more templates and formats
description: Serve several image designs from one route and choose between PNG and JPEG output.
sidebar:
  order: 5
---

One API route can serve any number of templates. Each `_*.tsx` file in the
route's folder becomes a template, named after the file without the underscore
and extension.

## Add a second template

Create another file next to the existing one:

```
src/pages/blog/[slug]/assets/
├── _og-image.tsx          → /blog/<slug>/assets/og-image.png
├── _twitter-card.tsx      → /blog/<slug>/assets/twitter-card.png
└── [__image].[__type].ts
```

```tsx title="src/pages/blog/[slug]/assets/_twitter-card.tsx"
import type { AssetImageConfig } from "@bearstudio/astro-assets-generation";

export const config: AssetImageConfig = {
  width: 1200,
  height: 600,
};

export default function TwitterCard({ params }: { params: { slug: string } }) {
  return <div style={{ display: "flex", width: "100%", height: "100%" }}>…</div>;
}
```

The route picks it up through `import.meta.glob("./_*.tsx")`. If you use
`getStaticPaths`, the new template is included automatically: paths are the
product of every parent param, every template and every image type.

## Share layout between templates

Templates are ordinary React components. Put shared pieces in a file that does
not start with `_` so it is not treated as a template, or outside the route
folder entirely:

```tsx title="src/components/og/Frame.tsx"
export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", padding: 64 }}>
      {children}
    </div>
  );
}
```

## Choose output formats

The URL extension selects the format: `.png`, `.jpg` or `.jpeg`. PNG is
lossless and larger. JPEG is smaller and fine for photographic backgrounds, but
has no transparency.

With `getStaticPaths`, the third argument of `getStaticPathsForAssets` decides
which formats are written to disk. The default is `["png", "jpg"]`.

```typescript
return getStaticPathsForAssets(
  modules,
  posts.map((post) => ({ slug: post.id })),
  ["jpg"],
);
```

With `prerender = false`, every format is available on request.

## Give templates their own settings

`config` is per template, so each can have its own size, preview scale and
emoji provider:

```tsx
export const config: AssetImageConfig = {
  width: 1080,
  height: 1080,
  debugScale: 0.4,
  emoji: "noto",
};
```

## Use templates outside a blog

The route can live anywhere under `src/pages`. For a single site-wide image with
no parent param:

```
src/pages/assets/
├── _default-og.tsx        → /assets/default-og.png
└── [__image].[__type].ts
```

```typescript title="src/pages/assets/[__image].[__type].ts"
export const getStaticPaths = () => getStaticPathsForAssets(modules, [{}]);
```

Passing `[{}]` as the parent params produces one path per template and format
with no other params.
