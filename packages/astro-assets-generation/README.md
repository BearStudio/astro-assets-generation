# @bearstudio/astro-assets-generation

An Astro integration to generate dynamic assets (OG images, social media cards, etc.) using React components and [Takumi](https://github.com/takumi-rs/takumi).

## Features

- 🎨 **React-based templates**: Create image templates using React components
- 🖼️ **PNG generation**: Generate high-quality PNG images from React components
- 🐛 **Debug mode**: Preview your templates in the browser with HTML debug view
- 😀 **Emoji support**: Built-in emoji rendering using Twemoji SVGs
- 📦 **Astro integration**: Seamless integration with Astro's content collections and routing
- 🎯 **Type-safe**: Full TypeScript support

## Installation

```bash
pnpm add @bearstudio/astro-assets-generation
# or
npm install @bearstudio/astro-assets-generation
# or
yarn add @bearstudio/astro-assets-generation
```

## Quick Start

### 1. Configure the library

In your Astro project, configure the library (typically in `src/lib/assets.ts` or similar):

```typescript
import { configure } from "@bearstudio/astro-assets-generation";

configure({
  debugBackground: "#0a0a0a", // Background color for debug HTML view
  siteUrl: import.meta.env.SITE ?? "http://localhost:4321",
  isDev: import.meta.env.DEV,
});
```

### 2. Create an image template

Create a React component for your image template. The file should be prefixed with `_` (e.g., `_cover-author.tsx`):

```tsx
// src/pages/blog/[slug]/assets/_your-template-name.tsx
import type { AssetImageConfig } from "@bearstudio/astro-assets-generation";

export const config: AssetImageConfig = {
  width: 1200,
  height: 630,
  debugScale: 0.5, // Optional: scale for debug view
};

export default function YourTemplateName() {
  // Your logic here to fetch data if needed
  return (
   // The content of your image
  )}

```

### 3. Create the API route

Create an API route that uses `apiImageEndpoint`:

```typescript
// src/pages/blog/[slug]/assets/[__image].[__type].ts
import { apiImageEndpoint } from "@bearstudio/astro-assets-generation";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = apiImageEndpoint(
  import.meta.glob("./_*.tsx", { eager: true }),
);
```

### 4. Use the generated image

Access your generated images at:

- PNG: `/blog/my-post/assets/your-template-name.png`
- Debug HTML: `/blog/my-post/assets/your-template-name.debug`

## API Reference

### `configure(config)`

Configure the library with global settings.

```typescript
configure({
  debugBackground: "#0a0a0a", // Background color for debug HTML view
  siteUrl: "https://example.com", // Your site URL (for production image fetching)
  isDev: true, // Whether running in development mode
});
```

### `apiImageEndpoint(modules)`

Creates an Astro API route handler that generates images from your templates.

**Parameters:**

- `modules`: A glob object from `import.meta.glob("./_*.tsx", { eager: true })`

**Returns:** An `APIRoute` handler

**URL Pattern:** `[__image].[__type]`

- `__image`: The template name (filename without `_` prefix and `.tsx` extension)
- `__type`: Either `png` or `debug`

### `getAstroImageBase64(image)`

Converts an Astro image object to a base64 data URI for use in templates.

```typescript
const base64 = await getAstroImageBase64(author.data.image);
// Returns: "data:image/jpeg;base64, /9j/4AAQSkZJRg..."
```

### `extractEmoji(input)`

Extracts emojis from a string and returns the cleaned text and emoji array.

```typescript
const { text, emojis } = extractEmoji("Hello World 🚀 🔥");
// text: "Hello World"
// emojis: ["🚀", "🔥"]
```

### `Emoji` Component

React component to render emojis in your templates.

```tsx
<Emoji emoji="🚀" size={64} />
```

**Props:**

- `emoji` (string): The emoji character to render
- `size` (number, optional): Size in pixels (default: 4)

### `AssetImageConfig` Type

Configuration object for image templates.

```typescript
interface AssetImageConfig {
  width: number; // Image width in pixels
  height: number; // Image height in pixels
  debugScale?: number; // Optional scale for debug view (0-1)
}
```

## Styling

Templates use [Tailwind CSS](https://tailwindcss.com/) via the `tw` prop. You can also use inline styles with the `style` prop.

**Supported CSS features:**

- Tailwind utility classes via `tw` prop
- Inline styles via `style` prop
- Flexbox and Grid layouts

**Note:** Not all CSS features are supported. The library uses Takumi's image rendering engine, which has limitations compared to a full browser.

## Astro Configuration

Make sure your `astro.config.mjs` includes the necessary Vite optimizations:

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
        "@takumi-rs/helpers",Ò
        "@bearstudio/astro-assets-generation",
      ],
    },
  },
  integrations: [react()],
});
```

## Dependencies

- `@takumi-rs/image-response`: Core image generation engine
- `@twemoji/svg`: Emoji SVG assets
- `ts-pattern`: Pattern matching utilities
- `react` & `react-dom`: For React component rendering
