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
    posts.map((post) => ({ slug: post.id })),
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
  import.meta.glob("./_*.tsx", { eager: true }),
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

```tsx
import { Emoji, extractEmoji } from "@bearstudio/astro-assets-generation";

const { text, emojis } = extractEmoji("Hello 🚀 World 🔥");
// text: "Hello World"
// emojis: ["🚀", "🔥"]

<div tw="flex items-center gap-2">
  <h1>{text}</h1>
  {emojis.map((emoji, i) => (
    <Emoji key={i} emoji={emoji} size={64} />
  ))}
</div>;
```

## Styling

Use Tailwind CSS via the `tw` prop or inline styles:

```tsx
<div tw="flex items-center justify-center w-full h-full bg-blue-500">
  <h1 tw="text-white text-8xl font-bold">Hello</h1>
</div>
```

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
  import.meta.glob("./_*.tsx", { eager: true }),
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
    posts.map((post) => ({ slug: post.id })),
    // optional 3rd arg: ["png", "jpg"] by default
  );
};
```

#### `getAstroImageBase64(image)`

Converts Astro image to base64 data URI.

#### `extractEmoji(input)`

Extracts emojis from text:

```typescript
const { text, emojis } = extractEmoji("Hello 🚀");
```

### Components

#### `<Emoji emoji="🚀" size={64} />`

Renders emojis using Twemoji SVGs.

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
  Emoji,
  extractEmoji,
} from "@bearstudio/astro-assets-generation";
import { getEntry } from "astro:content";

export const config = { width: 1200, height: 630 };

export default async function BlogOgImage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getEntry("blog", params.slug);
  const { text: title, emojis } = extractEmoji(post.data.title);

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
            {title}
            {emojis.map((emoji, i) => (
              <Emoji key={i} emoji={emoji} size={72} />
            ))}
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
