# @bearstudio/astro-assets-generation

Generate dynamic images (OG images, social media cards, etc.) using React components in your Astro projects. Powered by [Takumi](https://github.com/takumi-rs/takumi).

## Features

- Design images with React components and JSX
- Generate PNG, JPEG, or JPG images
- Debug mode to preview templates in browser
- Built-in emoji support with configurable provider (Twemoji by default)
- Automatic multilingual support (Thai, Japanese, Korean, Arabic)
- Custom fonts with lazy loading and automatic subsetting
- Fast Rust-based rendering via takumi-js v2

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
import { astroAssetsGeneration } from "@bearstudio/astro-assets-generation";

export default defineConfig({
  integrations: [react(), astroAssetsGeneration()],
});
```

The integration configures the Takumi Vite/SSR settings for you. On Vercel, it
also includes Takumi's native Linux binding in the serverless function output,
so consumers do not need custom `includeFiles` config.

### 2. Configure the Library

Create a configuration file (e.g., `src/lib/assets.ts`):

```typescript
import { configure } from "@bearstudio/astro-assets-generation";
import { diskLoader } from "@bearstudio/astro-assets-generation/disk-loader";

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
  // emoji: "twemoji", // Optional. Default: "twemoji"
  // Required for `output: 'static'` (prerender has no server). Omit for SSR
  // adapters — the library will fetch from `siteUrl` instead.
  loadAsset: diskLoader(),
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
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: 64,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <h1 style={{ color: "white", fontSize: 72, fontWeight: "bold" }}>
          My Blog Post
        </h1>
        <p style={{ color: "white", fontSize: 24 }}>Post: {params.slug}</p>
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
import { astroAssetsGeneration } from "@bearstudio/astro-assets-generation";

export default defineConfig({
  integrations: [react(), astroAssetsGeneration()],
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

### Drop `loadAsset` for serverless deployments

When you ship to a serverless adapter (Vercel, Netlify, Cloudflare…), remove
`loadAsset: diskLoader()` from your `configure()` call. The library will fetch
images and fonts from `siteUrl` at runtime, and the `disk-loader` import is no
longer needed. Keeping it in serverless builds causes file tracers like
`@vercel/nft` to bundle your entire `dist/` into the function output.

### Vercel

No Vercel-specific app config is required beyond adding the Vercel adapter and
`astroAssetsGeneration()`. The integration handles Takumi's native Node binding
for the Vercel Linux runtime.

## Font Management

### Built-in Fallback Fonts

The library provides default fallback font definitions for Thai, Japanese,
Korean, and Arabic. These fonts are loaded from a CDN on first render and
cached automatically — no manual cache management required. Font subsetting
is active by default: Takumi only processes the glyphs present in the rendered
content, so loading a full CJK font only costs what the content actually uses.

If your deployment cannot rely on CDN access, register your own fonts via
`customFonts`.

### Custom Fonts

Add fonts in your configuration:

```typescript
configure({
  customFonts: [
    {
      name: "Tomorrow", // Name used in CSS font-family declarations
      url: "/fonts/Tomorrow-Regular.ttf", // /public path, absolute URL, or file path
      weight: 400,
      style: "normal",
    },
    {
      name: "Tomorrow",
      url: "/fonts/Tomorrow-Bold.ttf",
      weight: 700,
      style: "normal",
    },
  ],
});
```

Custom fonts are lazy-loaded: fetched on first render and cached automatically
by Takumi's internal key-based cache. Subsequent renders reuse the cached data.

### FontWrapper Component

Wraps content with an automatic font-family stack that includes both your
custom fonts and the built-in non-Latin fallbacks:

```tsx
import { FontWrapper } from "@bearstudio/astro-assets-generation";

<FontWrapper fontFamily="Tomorrow">
  <div style={{ padding: 64 }}>
    <p>English, 日本語, 한국어, العربية, ไทย - all supported!</p>
  </div>
</FontWrapper>;
```

## Emoji Support

Emojis are detected and rendered automatically inside any text node. Just write them inline:

```tsx
return <h1>Hello 👋 World 🌍</h1>;
```

The default provider is Twemoji. You can change it globally in `configure()` or
per template via `AssetImageConfig`. The per-template value takes precedence.

```typescript
// Global default
configure({ emoji: "noto" });
```

```tsx
// Per-template override
export const config: AssetImageConfig = {
  width: 1200,
  height: 630,
  emoji: "fluent",
};
```

Available providers: `"twemoji"` (default), `"blobmoji"`, `"noto"`,
`"openmoji"`, `"fluent"`, `"fluentFlat"`, `"from-font"`.

`"from-font"` uses emoji glyphs embedded in your loaded fonts instead of
fetching external images.

## Styling

Use inline styles via the `style` prop:

```tsx
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "#3b82f6",
  }}
>
  <h1 style={{ color: "white", fontSize: 96, fontWeight: "bold" }}>Hello</h1>
</div>
```

## Working with Images

### Astro Images

```tsx
import { getAstroImageBase64 } from "@bearstudio/astro-assets-generation";

const avatarBase64 = await getAstroImageBase64(author.data.avatar);

<img
  src={avatarBase64}
  style={{ width: 128, height: 128, borderRadius: 9999 }}
/>;
```

### External Images

```tsx
<img src="https://example.com/image.jpg" style={{ width: 256, height: 256 }} />
```

### JSX to Base64

Use `jsxToBase64` to render any JSX component as a PNG and get a base64 data URI. This is useful for embedding generated images inside other templates.

```tsx
import { jsxToBase64 } from "@bearstudio/astro-assets-generation";

const base64 = await jsxToBase64(
  <div tw="flex items-center justify-center w-full h-full bg-blue-500">
    <h1 tw="text-white text-4xl">Hello</h1>
  </div>,
  { width: 600, height: 300 }
);

<img src={base64} tw="w-64 h-32" />;
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
  ], // Optional
  emoji: "twemoji", // Optional. Default: "twemoji"
  // Optional. Resolves `getAstroImageBase64` images and `/`-prefixed font
  // URLs before falling back to fetch. Required for `output: 'static'`.
  loadAsset: diskLoader(),
});
```

#### `diskLoader(options?)`

Imported from `@bearstudio/astro-assets-generation/disk-loader`. Returns an
`AssetLoader` that reads a request URL from disk, looking under
`process.cwd()/dist/` then `process.cwd()/public/` by default.

```typescript
import { diskLoader } from "@bearstudio/astro-assets-generation/disk-loader";

loadAsset: diskLoader();
loadAsset: diskLoader({ directories: ["dist", "public", "custom"] });
```

Lives in a sub-export so its `process.cwd()` references stay out of the main
entry — without that split, `@vercel/nft` would trace `dist/**` into
serverless function bundles.

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

#### `jsxToBase64(component, config)`

Renders a JSX element as a PNG and returns a base64 data URI. Useful for embedding a generated image inside another template.

```typescript
const base64 = await jsxToBase64(<MyComponent />, { width: 600, height: 300 });
```

### Components

#### `<FontWrapper fontFamily="Geist">`

Wraps content with automatic font fallback support.

### Types

#### `AssetImageConfig`

```typescript
interface AssetImageConfig {
  width: number;
  height: number;
  debugScale?: number; // Scale factor for debug view. Default: 0.5
  emoji?: EmojiType; // Overrides the global default set in configure()
}
```

#### `EmojiType`

```typescript
type EmojiType =
  | "twemoji" // Default
  | "blobmoji"
  | "noto"
  | "openmoji"
  | "fluent"
  | "fluentFlat"
  | "from-font"; // Use emoji glyphs from loaded fonts, no external fetch
```

#### `FontConfig`

```typescript
interface FontConfig {
  name: string; // Used in CSS font-family declarations
  url: string; // HTTP/HTTPS URL, /public path, or absolute file path
  weight: number; // 100–900
  style: "normal" | "italic";
}
```

#### `AssetLoader`

```typescript
type AssetLoader = (url: string) => Promise<Buffer | null | undefined>;
```

Return `null` or `undefined` to fall back to fetch.

## Troubleshooting

**Images not generating?**

- Verify template starts with `_` (e.g., `_og-image.tsx`)
- Check API route uses `[__image].[__type].ts` (double underscores)
- Import config file in API route

**Fonts not loading?**

- Verify font name matches internal font name
- Check `siteUrl` is correct in production
- Ensure custom font URLs are accessible from production URL
- Ensure the deployment environment can reach the CDN for built-in fallback fonts

**Emojis not rendering?**

- Ensure the deployment environment can reach the CDN for the configured emoji provider
- Use `emoji: "from-font"` if your fonts include emoji glyphs and external CDN access is restricted

**Vercel cannot load Takumi native bindings?**

- Ensure `astroAssetsGeneration()` is present in `astro.config`
- Ensure optional dependencies are installed during deployment (`@takumi-rs/core-linux-x64-gnu`)

**Styling issues?**

- Use the `style` prop with inline CSS objects
- Test in debug mode (`.debug` extension)
- Stick to well-supported CSS features

## Example: Blog OG Image

```tsx
// src/pages/blog/[slug]/assets/_og-image.tsx
import { FontWrapper } from "@bearstudio/astro-assets-generation";
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
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: 64,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "auto",
          }}
        >
          <h1 style={{ color: "white", fontSize: 72, fontWeight: "bold" }}>
            {post.data.title}
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p style={{ color: "white", fontSize: 24 }}>{post.data.author}</p>
          <p style={{ color: "white", fontSize: 24 }}>
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
