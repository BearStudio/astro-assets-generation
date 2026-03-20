# @bearstudio/astro-assets-generation

Generate dynamic images (OG images, social media cards, etc.) using React components in your Astro projects. Powered by [Takumi](https://github.com/takumi-rs/takumi).

## Features

- 🎨 Design images with React components and JSX
- 🖼️ Generate PNG, JPEG, or JPG images
- 🐛 Debug mode to preview templates in browser
- 😀 Built-in emoji support with Twemoji
- 🌍 Automatic multilingual support (Thai, Japanese, Korean, Arabic)
- 🔤 Custom fonts with automatic fallbacks
- ⚡ Fast Rust-based rendering

## Installation

```bash
pnpm add @bearstudio/astro-assets-generation
```

## Quick Start

### 1. Configure Astro

Update your `astro.config.mjs`:

```javascript
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  vite: {
    optimizeDeps: {
      exclude: [
        "@takumi-rs/image-response",
        "@takumi-rs/core",
        "@takumi-rs/helpers",
      ],
    },
    ssr: {
      noExternal: [
        "@takumi-rs/image-response",
        "@takumi-rs/core",
        "@takumi-rs/helpers",
        "@bearstudio/astro-assets-generation",
      ],
    },
  },
  integrations: [react()],
});
```

### 2. Configure the Library

Create a configuration file (e.g., `src/lib/assets.ts`):

```typescript
import { configure } from "@bearstudio/astro-assets-generation";

configure({
  debugBackground: "#0a0a0a",
  siteUrl: import.meta.env.SITE ?? "http://localhost:4321",
  isDev: import.meta.env.DEV,
  customFonts: [
    // Optional
    {
      name: "Geist",
      url: "/fonts/Geist.ttf",
      weight: 400,
      style: "normal",
    },
  ],
});
```

### 3. Create a Template

Create a React component prefixed with `_`:

```tsx
// src/pages/blog/[slug]/assets/_og-image.tsx
import { FontWrapper } from "@bearstudio/astro-assets-generation";
import type { AssetImageConfig } from "@bearstudio/astro-assets-generation";

export const config: AssetImageConfig = {
  width: 1200,
  height: 630,
  debugScale: 0.5, // Optional: for debug view
};

export default function OgImage({ params }: { params: { slug: string } }) {
  return (
    <FontWrapper fontFamily="Geist">
      <div
        tw="flex flex-col w-full h-full p-16"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <h1 tw="text-white text-7xl font-bold">My Blog Post</h1>
        <p tw="text-white text-2xl">Post: {params.slug}</p>
      </div>
    </FontWrapper>
  );
}
```

### 4. Create API Route

```typescript
// src/pages/blog/[slug]/assets/[__image].[__type].ts
import {
  apiImageEndpoint,
  getStaticPathsForAssets,
} from "@bearstudio/astro-assets-generation";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import "@/lib/assets"; // Import your config

const modules = import.meta.glob("./_*.tsx", { eager: true });

export const getStaticPaths = async () => {
  const posts = await getCollection("blog");
  return getStaticPathsForAssets(
    modules,
    posts.map((post) => ({ slug: post.id }))
  );
};

export const GET: APIRoute = apiImageEndpoint(modules);
```

### 5. Access Your Images

- **PNG**: `/blog/my-post/assets/og-image.png`
- **JPEG**: `/blog/my-post/assets/og-image.jpg`
- **Debug**: `/blog/my-post/assets/og-image.debug`

## Using Dynamic Routes (with an Adapter)

By default, the examples above use `getStaticPaths` to pre-generate images at build time — no server adapter required.

If you need to generate images on-demand (e.g., for a very large number of routes or frequently changing content), you can use `prerender = false` instead. This requires an [Astro server adapter](https://docs.astro.build/en/guides/server-side-rendering/).

### Install an adapter

```bash
pnpm astro add vercel
# or
pnpm astro add node
```

### Update `astro.config.mjs`

```javascript
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

export default defineConfig({
  vite: {
    optimizeDeps: {
      exclude: [
        "@takumi-rs/image-response",
        "@takumi-rs/core",
        "@takumi-rs/helpers",
      ],
    },
    ssr: {
      noExternal: [
        "@takumi-rs/image-response",
        "@takumi-rs/core",
        "@takumi-rs/helpers",
        "@bearstudio/astro-assets-generation",
      ],
    },
  },
  integrations: [react()],
  adapter: vercel(),
});
```

### Update API Route

Replace `getStaticPaths` with `prerender = false`:

```typescript
// src/pages/blog/[slug]/assets/[__image].[__type].ts
import { apiImageEndpoint } from "@bearstudio/astro-assets-generation";
import type { APIRoute } from "astro";
import "@/lib/assets";

export const prerender = false;

export const GET: APIRoute = apiImageEndpoint(
  import.meta.glob("./_*.tsx", { eager: true })
);
```

## Font Management

### Built-in Fonts

The library automatically includes fonts for Thai, Japanese, Korean, and Arabic. These are used as fallbacks.

### Custom Fonts

Add fonts in your configuration:

```typescript
const customFonts: FontConfig[] = [
  {
    name: "Geist", // Must match font's internal name
    url: "/fonts/Geist.ttf", // Path or URL
    weight: 400,
    style: "normal",
  },
];
```

### FontWrapper Component

Automatically creates a font stack with fallbacks:

```tsx
import { FontWrapper } from "@bearstudio/astro-assets-generation";

<FontWrapper fontFamily="Geist">
  <div tw="p-16">
    <p>English, 日本語, 한국어, العربية, ไทย - all supported!</p>
  </div>
</FontWrapper>;
```

## Emoji Support

Use the `Emoji` component for crisp emoji rendering at any size:

```tsx
import { Emoji } from "@bearstudio/astro-assets-generation";
return (
  <h1>
    <span>Hello world</span> <Emoji emoji={🌍} size={64} />
  </h1>
);
```

Use the `TextWithEmoji` component to correctly display a text containing nested emojis

```tsx
import { TextWithEmoji } from "@bearstudio/astro-assets-generation";
return (
  <h1>
    <TextWithEmoji>Hello 👋 World 🌍</TextWithEmoji>
  </h1>
);
```

## Styling

Images are rendered by [Takumi](https://takumi.kane.tw/), which supports a subset of CSS. Use the `tw` prop for Tailwind classes and the `style` prop for values that `tw` cannot express.

### Use `tw` for

Layout, typography, solid colors, spacing — anything expressible with standard Tailwind classes:

```tsx
<div tw="flex flex-col w-full h-full p-16 bg-slate-900">
  <h1 tw="text-white text-7xl font-bold leading-tight">Hello</h1>
  <p tw="text-slate-400 text-3xl mt-4">Subtitle</p>
</div>
```

### Use `style` for

The following cases are not supported via `tw` and require the `style` prop.

**Gradients** — `bg-gradient-to-*` with arbitrary color values is not reliably processed:

```tsx
// ❌
<div tw="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b]">
// ✅
<div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" }}>
```

**Colors with opacity** — the Tailwind `/opacity` modifier (e.g. `bg-indigo-500/30`) is not supported:

```tsx
// ❌
<span tw="bg-indigo-500/30 border border-indigo-500/50">
// ✅
<span style={{ background: "rgba(99, 102, 241, 0.3)", border: "1px solid rgba(99, 102, 241, 0.5)" }}>
```

**`object-fit`** — `object-cover` / `object-contain` classes may not apply correctly on `<img>`:

```tsx
// ❌
<img tw="w-16 h-16 object-cover" />
// ✅
<img tw="w-16 h-16" style={{ objectFit: "cover" }} />
```

**`box-shadow`** — `shadow-*` classes are not supported:

```tsx
// ❌
<div tw="shadow-lg">
// ✅
<div style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
```

**`text-shadow`** — not supported at all (neither `tw` nor via standard `style` — Takumi does not implement this property).

You can mix both props freely on the same element.

## Working with Images

### Astro Images

```tsx
import { getAstroImageBase64 } from "@bearstudio/astro-assets-generation";

const avatarBase64 = await getAstroImageBase64(author.data.avatar);

<img src={avatarBase64} tw="w-32 h-32 rounded-full" />;
```

### External Images

```tsx
<img src="https://example.com/image.jpg" tw="w-64 h-64" />
```

## API Reference

### Functions

#### `configure(config)`

```typescript
configure({
  debugBackground: "#0a0a0a",
  siteUrl: "https://example.com",
  isDev: import.meta.env.DEV,
  customFonts: [
    /* ... */
  ],
});
```

#### `apiImageEndpoint(modules)`

Creates an Astro API route handler:

```typescript
export const GET = apiImageEndpoint(
  import.meta.glob("./_*.tsx", { eager: true })
);
```

#### `getStaticPathsForAssets(modules, parentParams, imageTypes?)`

Generates static paths for all combinations of templates and image types. Automatically derives template names from the glob modules.

```typescript
const modules = import.meta.glob("./_*.tsx", { eager: true });

export const getStaticPaths = async () => {
  const posts = await getCollection("blog");
  return getStaticPathsForAssets(
    modules,
    posts.map((post) => ({ slug: post.id }))
    // optional 3rd arg: ["png", "jpg"] by default
  );
};
```

#### `getAstroImageBase64(image)`

Converts Astro image to base64 data URI.

### Components

#### `<Emoji emoji="🚀" size={64} />`

Renders emojis using Twemoji SVGs.

#### `<TextWithEmoji>`

Renders a text string containing emojis, automatically splitting and rendering each emoji with Twemoji SVGs at the correct size.

#### `<FontWrapper fontFamily="Geist">`

Wraps content with automatic font fallback support.

### Types

#### `AssetImageConfig`

```typescript
interface AssetImageConfig {
  width: number;
  height: number;
  debugScale?: number; // Default: 0.5
}
```

#### `FontConfig`

```typescript
interface FontConfig {
  name: string;
  url: string;
  weight: number;
  style: "normal" | "italic";
}
```

## Troubleshooting

**Images not generating?**

- Verify template starts with `_` (e.g., `_og-image.tsx`)
- Check API route uses `[__image].[__type].ts` (double underscores)
- Import config file in API route

**Fonts not loading?**

- Verify font name matches internal font name
- Check `siteUrl` is correct in production
- Ensure fonts are accessible from production URL

**Styling issues?**

- Use `tw` prop, not `className`
- Test in debug mode (`.debug` extension)
- Stick to well-supported CSS features

## Example: Blog OG Image

```tsx
// src/pages/blog/[slug]/assets/_og-image.tsx
import {
  FontWrapper,
  TextWithEmoji,
} from "@bearstudio/astro-assets-generation";
import { getEntry } from "astro:content";

export const config = { width: 1200, height: 630 };

export default async function BlogOgImage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getEntry("blog", params.slug);

  return (
    <FontWrapper fontFamily="Geist" style={{ width: "100%", height: "100%" }}>
      <div
        tw="flex flex-col w-full h-full p-16"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div tw="flex items-center mb-auto">
          <h1 tw="text-white text-7xl font-bold">
            <TextWithEmoji>{post.data.title}</TextWithEmoji>
          </h1>
        </div>
        <div tw="flex items-center justify-between">
          <p tw="text-white text-2xl">{post.data.author}</p>
          <p tw="text-white text-2xl">
            {new Date(post.data.date).toLocaleDateString()}
          </p>
        </div>
      </div>
    </FontWrapper>
  );
}
```

## License

MIT
