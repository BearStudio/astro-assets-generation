import { ImageResponse } from "@takumi-rs/image-response";
import { renderToStaticMarkup } from "react-dom/server";
import { match } from "ts-pattern";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { JSX } from "react";
import type { AssetImageConfig, FontConfig } from "./types";
import { getAllFonts } from "./theme";

let libraryConfig = {
  debugBackground: "#0a0a0a",
  siteUrl: "",
  isDev: true,
  customFonts: [] as FontConfig[],
};

/**
 * Configure the assets generation library.
 *
 * @example
 * ```typescript
 * import { configure } from "@bearstudio/astro-assets-generation";
 *
 * configure({
 *   customFonts: [
 *     {
 *       name: "Geist",
 *       url: "/fonts/Geist.ttf",
 *       weight: 400,
 *       style: "normal"
 *     }
 *   ],
 *   isDev: import.meta.env.DEV,
 *   siteUrl: import.meta.env.SITE
 * });
 * ```
 */
export function configure(config: Partial<typeof libraryConfig>) {
  libraryConfig = { ...libraryConfig, ...config };
  // Invalidate font cache when custom fonts are changed
  if (config.customFonts !== undefined) {
    fontsCache = null;
  }
}

export function getConfiguredFonts(): FontConfig[] {
  return libraryConfig.customFonts;
}

/**
 * Load a single font file
 */
async function loadFontData(font: FontConfig): Promise<Buffer> {
  // If URL is absolute (http/https), always fetch
  if (font.url.startsWith("http://") || font.url.startsWith("https://")) {
    const res = await fetch(font.url);
    if (!res.ok) {
      throw new Error(`Failed to fetch font: ${font.url}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  // If URL starts with "/" (web path), handle as public directory path.
  // Always try filesystem first (works in dev, build, and SSR runtime),
  // then fall back to HTTP (SSR runtime when files aren't on disk).
  if (font.url.startsWith("/")) {
    const relativePath = font.url.replace(/^\//, "");
    for (const dir of ["public", "dist"]) {
      try {
        return await fs.readFile(
          path.resolve(process.cwd(), dir, relativePath)
        );
      } catch {
        continue;
      }
    }
    const url = new URL(font.url, libraryConfig.siteUrl);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch font ${font.name}: ${url}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  // If URL is an absolute file system path (not starting with /), read it directly
  if (path.isAbsolute(font.url)) {
    return await fs.readFile(font.url);
  }

  // For relative paths (built-in package fonts like "./fonts/NotoSansThai-Regular.ttf").
  // Always try filesystem in order: relative to this file, then via node_modules
  // (needed when bundled with noExternal), then HTTP as last resort.
  const fontFileName = path.basename(font.url);
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const possiblePaths = [
    path.resolve(currentDir, "./fonts", fontFileName),
    path.resolve(currentDir, "../src/fonts", fontFileName),
    path.resolve(
      process.cwd(),
      "node_modules/@bearstudio/astro-assets-generation/dist/fonts",
      fontFileName
    ),
    path.resolve(
      process.cwd(),
      "node_modules/@bearstudio/astro-assets-generation/src/fonts",
      fontFileName
    ),
  ];
  for (const fontPath of possiblePaths) {
    try {
      return await fs.readFile(fontPath);
    } catch {
      continue;
    }
  }
  const url = new URL(`/fonts/${fontFileName}`, libraryConfig.siteUrl);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to load built-in font ${font.name}. Tried: ${possiblePaths.join(", ")}`
    );
  }
  return Buffer.from(await res.arrayBuffer());
}

let fontsCache: Array<{
  name: string;
  data: ArrayBuffer;
  weight: number;
  style: string;
}> | null = null;

/**
 * Load all fonts and prepare them for ImageResponse
 * Uses caching to avoid reloading fonts on every request
 */
async function loadFonts(): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  const allFonts = getAllFonts(libraryConfig.customFonts);
  return Promise.all(
    allFonts.map(async (font) => {
      const buffer = await loadFontData(font);
      // Convert Buffer to ArrayBuffer
      const arrayBuffer = new ArrayBuffer(buffer.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(buffer);
      return {
        name: font.name,
        weight: font.weight,
        style: font.style,
        data: arrayBuffer,
      };
    })
  );
}

async function getFonts(): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  return (fontsCache ??= await loadFonts());
}

export async function PNG(component: JSX.Element, config: AssetImageConfig) {
  const fonts = await getFonts();

  const response = new ImageResponse(component, {
    width: config.width,
    height: config.height,
    fonts,
  });

  return response.arrayBuffer();
}

export async function JPEG(component: JSX.Element, config: AssetImageConfig) {
  const fonts = await getFonts();

  const response = new ImageResponse(component, {
    width: config.width,
    height: config.height,
    fonts,
    format: "jpeg",
  });

  return response.arrayBuffer();
}

export async function DEBUG_HTML(
  component: JSX.Element,
  config: AssetImageConfig
): Promise<string> {
  const scale = config.debugScale ?? 0.5;
  const html = renderToStaticMarkup(component);
  const allFonts = getAllFonts(libraryConfig.customFonts);

  // Resolve font URLs for the browser:
  // - custom fonts starting with "/" are absolute from root → keep as-is
  // - built-in fonts with relative paths (./fonts/...) → resolve via siteUrl
  const resolvedFonts = allFonts.map((font) => {
    let url = font.url;
    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("/")
    ) {
      const fontFileName = path.basename(url);
      url = `${libraryConfig.siteUrl}/fonts/${fontFileName}`;
    }
    return { ...font, url };
  });

  return `<!DOCTYPE html>
  <html>
    <head>
      <title>Debug OG Image</title>
      <script src="https://cdn.tailwindcss.com"></script>
      ${resolvedFonts
        .map(
          (font) =>
            `<link rel="preload" href="${font.url}" as="font" type="font/${
              font.url.endsWith(".ttf") ? "truetype" : "woff2"
            }" crossorigin>`
        )
        .join("\n      ")}
      <style>
      ${resolvedFonts
        .map(
          (font) => `
          @font-face {
            font-family: "${font.name}";
            font-style: ${font.style};
            font-weight: ${font.weight};
            font-display: block;
            src: url("${font.url}") format("${
              font.url.endsWith(".ttf") ? "truetype" : "woff"
            }");
          }
        `
        )
        .join("\n")}
        :root {
          --width: ${config.width}px;
          --height: ${config.height}px;
          --scale: ${scale};
        }
        body {
          background: ${libraryConfig.debugBackground} url('/debug.png') repeat;
          margin: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: calc(var(--width)*var(--scale));
          min-height: calc(var(--height)*var(--scale));
        }
        #screen {
          width: calc(var(--width)*var(--scale));
          height: calc(var(--height)*var(--scale));
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          border-radius: 8px;
        }
        #render {
          width: var(--width);
          height: var(--height);
          flex: none;
          transform: scale(var(--scale));
          transform-origin: top left;
          background: white;
          overflow: hidden;
        }
        /* Replace tw attribute with class for Tailwind */
        [tw] {
          /* This will be handled by replacing tw with class in the HTML */
        }
      </style>
    </head>
    <body>
      <div id="screen">
        <div id="render">
          ${html.replace(/tw=/g, "class=")}
        </div>
      </div>
    </body>
  </html>`;
}

export function generateImageResponsePNG(buffer: ArrayBuffer) {
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      // "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export function generateImageResponseJPEG(buffer: ArrayBuffer) {
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      // "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export function generateImageResponseHTML(html: string) {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

export function getImageNameFromTsxPath(path: string) {
  return path
    .split("/")
    .at(-1)
    ?.replace(/\.tsx$/, "")
    .replace(/^_/, "");
}

function getAstroImagePath(image: { src: string }) {
  return libraryConfig.isDev
    ? path.resolve(image.src.replace(/\?.*/, "").replace("/@fs", ""))
    : image.src;
}

async function getAstroImageBuffer(image: { src: string }) {
  const fileExtension = RegExp(/.(jpg|jpeg|png)$/)
    .exec(image.src)?.[0]
    .slice(1);
  const fileToRead = getAstroImagePath(image);

  return {
    buffer: await match(libraryConfig.isDev)
      .with(true, async () => await fs.readFile(fileToRead))
      .with(false, async () => {
        // Try reading from dist directory first (build-time static generation)
        const distPath = path.resolve(
          process.cwd(),
          "dist",
          fileToRead.replace(/^\//, "")
        );
        try {
          return await fs.readFile(distPath);
        } catch {
          // Fall back to HTTP fetch (SSR runtime)
        }
        const res = await fetch(new URL(fileToRead, libraryConfig.siteUrl));

        if (!res.ok) {
          throw new Error(`Failed to fetch image: ${fileToRead}`);
        }

        return Buffer.from(await res.arrayBuffer());
      })
      .exhaustive(),
    fileType: match(fileExtension)
      .with("jpg", "jpeg", () => "jpeg")
      .with("png", () => "png")
      .otherwise(() => {
        throw new Error(`Must be a jpg, jpeg or png`);
      }),
  };
}

export async function getAstroImageBase64(image: { src: string }) {
  const { buffer, fileType } = await getAstroImageBuffer(image);
  return imageBufferToBase64(buffer, fileType);
}

export function imageBufferToBase64(buffer: Buffer, fileType: string) {
  return `data:image/${fileType};base64, ${buffer.toString("base64")}`;
}
