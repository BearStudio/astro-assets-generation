# @bearstudio/astro-assets-generation

An Astro integration to generate dynamic assets (OG images, social media cards, etc.) using React components and [Takumi](https://github.com/takumi-rs/takumi).

## Features

- 🎨 **React-based templates**: Create image templates using React components
- 🖼️ **Multiple formats**: Generate PNG and JPEG/JPG images from React components
- 🐛 **Debug mode**: Preview your templates in the browser with HTML debug view
- 😀 **Emoji support**: Built-in emoji rendering using Twemoji SVGs
- 🌍 **Multilingual support**: Built-in fonts for Thai, Japanese, Korean, and Arabic
- 🔤 **Custom fonts**: Easy custom font configuration with automatic fallbacks
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
  import.meta.glob("./_*.tsx", { eager: true })
);
```

### 4. Use the generated image

Access your generated images at:

- PNG: `/blog/my-post/assets/your-template-name.png`
- JPEG: `/blog/my-post/assets/your-template-name.jpg` or `/blog/my-post/assets/your-template-name.jpeg`
- Debug HTML: `/blog/my-post/assets/your-template-name.debug`

## Font Management

### Built-in Non-Latin Font Support

The library includes built-in support for non-Latin characters with the following fonts:

- **Thai**: Noto Sans Thai
- **Japanese**: Noto Sans JP
- **Korean**: Noto Sans KR
- **Arabic**: Noto Sans Arabic

These fonts are automatically loaded and available in all templates.

### Custom Fonts

You can add custom fonts to your templates by configuring them in the `configure()` function:

```typescript
// src/lib/assets.ts
import {
  configure,
  type FontConfig,
} from "@bearstudio/astro-assets-generation";

const customFonts: FontConfig[] = [
  {
    name: "Geist",
    url: "/fonts/Geist.ttf",
    weight: 400,
    style: "normal",
  },
  {
    name: "Inter",
    url: "https://example.com/fonts/Inter-Bold.ttf",
    weight: 700,
    style: "normal",
  },
];

configure({
  debugBackground: "#0a0a0a",
  siteUrl: import.meta.env.SITE ?? "http://localhost:4321",
  isDev: import.meta.env.DEV,
  customFonts, // Add your custom fonts here
});
```

#### Supported Font URL Formats

- **Web paths**: `/fonts/Font.ttf` (resolved from `public/` directory)
- **HTTP/HTTPS URLs**: `https://example.com/fonts/Font.ttf`
- **Relative paths**: `./fonts/Font.ttf` (for package-internal fonts)
- **Absolute paths**: `/absolute/path/to/Font.ttf`

### FontWrapper Component

Use the `FontWrapper` component to manage fonts in your templates with automatic fallback to non-Latin fonts:

```tsx
import {
  FontWrapper,
  Emoji,
  extractEmoji,
} from "@bearstudio/astro-assets-generation";

export default function MyTemplate() {
  const { text: cleanTitle, emojis } = extractEmoji("Hello 世界 مرحبا 🚀");

  return (
    <FontWrapper fontFamily="Geist" style={{ background: "white" }}>
      <div tw="flex flex-col p-16">
        <h1 tw="text-6xl font-bold">
          {cleanTitle}
          {emojis.map((emoji, i) => (
            <Emoji key={i} emoji={emoji} size={64} />
          ))}
        </h1>
        <p tw="text-xl">
          English, 日本語, 한국어, العربية, ไทย - all supported!
        </p>
      </div>
    </FontWrapper>
  );
}
```

**How it works:**

The `FontWrapper` creates a font stack that automatically includes:

1. Your primary font (via `fontFamily` prop)
2. Custom fonts configured globally
3. Built-in non-Latin fonts (Thai, Japanese, Korean, Arabic)
4. Generic `sans-serif` fallback

This ensures that all characters render correctly, even if your primary font doesn't support them.

### FontWrapper Props

```typescript
interface FontWrapperProps {
  children: ReactNode;
  fontFamily?: string; // Primary font family name
  customFonts?: FontConfig[]; // Override global fonts (optional)
  style?: React.CSSProperties; // Additional CSS styles
}
```

### Example: Multi-language Support

```tsx
import { FontWrapper } from "@bearstudio/astro-assets-generation";

export const config = {
  width: 1200,
  height: 630,
};

export default function MultilingualCard() {
  return (
    <FontWrapper fontFamily="Geist">
      <div tw="flex flex-col w-full h-full p-16 bg-gradient-to-br from-purple-600 to-blue-600">
        <h1 tw="text-white text-7xl font-bold mb-4">Universal Typography</h1>
        <div tw="text-white text-3xl space-y-2">
          <p>English: The quick brown fox</p>
          <p>日本語: 早い茶色のキツネ</p>
          <p>한국어: 빠른 갈색 여우</p>
          <p>العربية: الثعلب البني السريع</p>
          <p>ไทย: จิ้งจอกสีน้ำตาลที่รวดเร็ว</p>
        </div>
      </div>
    </FontWrapper>
  );
}
```

### Importing Configuration

Don't forget to import your configuration file in the API route:

```typescript
// src/pages/blog/[slug]/assets/[__image].[__type].ts
import { apiImageEndpoint } from "@bearstudio/astro-assets-generation";
import type { APIRoute } from "astro";
import "@/lib/assets"; // ← Import to execute configuration

export const prerender = false;

export const GET: APIRoute = apiImageEndpoint(
  import.meta.glob("./_*.tsx", { eager: true })
);
```

## API Reference

### `configure(config)`

Configure the library with global settings.

```typescript
configure({
  debugBackground: "#0a0a0a", // Background color for debug HTML view
  siteUrl: "https://example.com", // Your site URL (for production)
  isDev: true, // Whether running in development mode
  customFonts: [
    // Optional: custom fonts
    {
      name: "Geist",
      url: "/fonts/Geist.ttf",
      weight: 400,
      style: "normal",
    },
  ],
});
```

**Configuration Options:**

- `debugBackground` (string): Background color for debug HTML view
- `siteUrl` (string): Your site URL for production font/image fetching
- `isDev` (boolean): Development mode flag
- `customFonts` (FontConfig[]): Array of custom font configurations

### `apiImageEndpoint(modules)`

Creates an Astro API route handler that generates images from your templates.

**Parameters:**

- `modules`: A glob object from `import.meta.glob("./_*.tsx", { eager: true })`

**Returns:** An `APIRoute` handler

**URL Pattern:** `[__image].[__type]`

- `__image`: The template name (filename without `_` prefix and `.tsx` extension)
- `__type`: Either `png`, `jpg`, `jpeg`, or `debug`

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

### `FontWrapper` Component

React component for managing fonts with automatic multilingual support.

```tsx
import { FontWrapper } from "@bearstudio/astro-assets-generation";

<FontWrapper fontFamily="Geist" style={{ background: "white" }}>
  <div>Content with multilingual support</div>
</FontWrapper>;
```

**Props:**

- `children` (ReactNode): Child components to wrap
- `fontFamily` (string, optional): Primary font family name
- `customFonts` (FontConfig[], optional): Override global custom fonts
- `style` (React.CSSProperties, optional): Additional CSS styles

**Features:**

- Automatically creates a font stack with custom fonts + non-Latin fonts
- Ensures proper rendering of Thai, Japanese, Korean, and Arabic characters
- Falls back gracefully when primary font doesn't support certain characters

### `getConfiguredFonts()`

Returns the currently configured custom fonts.

```typescript
const fonts = getConfiguredFonts();
// Returns: FontConfig[]
```

### `AssetImageConfig` Type

Configuration object for image templates.

```typescript
interface AssetImageConfig {
  width: number; // Image width in pixels
  height: number; // Image height in pixels
  debugScale?: number; // Optional scale for debug view (0-1)
}
```

### `FontConfig` Type

Configuration object for custom fonts.

```typescript
interface FontConfig {
  name: string; // Font family name
  url: string; // Path or URL to font file
  weight: number; // Font weight (100-900)
  style: "normal" | "italic"; // Font style
}
```

**⚠️ Important:** The `name` must exactly match the internal font family name in the font file. Use a font inspector tool if you're unsure of the correct name.

**URL formats:**

- Web path: `/fonts/Font.ttf` (from `public/` directory)
- HTTP(S): `https://example.com/fonts/Font.ttf`
- Relative: `./fonts/Font.ttf` (package fonts)
- Absolute: `/absolute/path/to/Font.ttf`

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
