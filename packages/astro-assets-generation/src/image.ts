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

  // If URL starts with "/" (web path), handle as public directory path
  if (font.url.startsWith("/")) {
    return await match(libraryConfig.isDev)
      .with(true, async () => {
        // In dev mode, read from public directory
        const publicPath = font.url.replace(/^\//, "");
        const publicFontPath = path.resolve(
          process.cwd(),
          "public",
          publicPath
        );
        try {
          return await fs.readFile(publicFontPath);
        } catch {
          throw new Error(
            `Failed to load font ${font.name} from ${publicFontPath}`
          );
        }
      })
      .with(false, async () => {
        // In production, fetch from site URL
        const url = new URL(font.url, libraryConfig.siteUrl);
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch font: ${url}`);
        }
        return Buffer.from(await res.arrayBuffer());
      })
      .run();
  }

  // If URL is an absolute file system path (not starting with /), read it directly
  if (path.isAbsolute(font.url)) {
    return await fs.readFile(font.url);
  }

  // For relative paths (like "./fonts/NotoSansThai-Regular.ttf"), handle dev vs production
  return await match(libraryConfig.isDev)
    .with(true, async () => {
      // In dev mode, fonts are in the package's fonts directory
      const fontFileName = path.basename(font.url);
      const currentFile = fileURLToPath(import.meta.url);
      const currentDir = path.dirname(currentFile);

      // Try multiple possible locations for package fonts
      const possiblePaths = [
        // Direct fonts directory (if in dist)
        path.resolve(currentDir, "./fonts", fontFileName),
        // Source fonts directory
        path.resolve(currentDir, "../src/fonts", fontFileName),
      ];

      // Try each path
      for (const fontPath of possiblePaths) {
        try {
          return await fs.readFile(fontPath);
        } catch (err) {
          if (libraryConfig.isDev) {
            console.warn(
              `[astro-assets-generation] Font "${font.name}" not found at ${fontPath}, trying next location...`
            );
          }
          continue;
        }
      }

      // If not found in package, try public directory (for user-provided fonts)
      const publicPath = font.url.replace(/^\.\/fonts\//, "");
      const publicFontPath = path.resolve(process.cwd(), "public", publicPath);
      try {
        return await fs.readFile(publicFontPath);
      } catch {
        throw new Error(
          `Failed to load font ${font.name} from ${font.url}. ` +
            `Tried: ${possiblePaths.join(", ")} and ${publicFontPath}`
        );
      }
    })
    .with(false, async () => {
      // In production, try to load from package first, then fetch from site URL
      const fontFileName = path.basename(font.url);
      const currentFile = fileURLToPath(import.meta.url);
      const currentDir = path.dirname(currentFile);

      // Try multiple possible locations for package fonts
      const possiblePaths = [
        // Direct fonts directory (if in dist)
        path.resolve(currentDir, "./fonts", fontFileName),
        // Source fonts directory
        path.resolve(currentDir, "../src/fonts", fontFileName),
      ];

      // Try each path
      for (const fontPath of possiblePaths) {
        try {
          return await fs.readFile(fontPath);
        } catch (err) {
          if (libraryConfig.isDev) {
            console.warn(
              `[astro-assets-generation] Font "${font.name}" not found at ${fontPath}, trying next location...`
            );
          }
          continue;
        }
      }

      // If not found locally, fetch from site URL
      const fontUrl = font.url.startsWith("/")
        ? font.url
        : `/fonts/${fontFileName}`;
      const url = new URL(fontUrl, libraryConfig.siteUrl);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(
          `Failed to fetch font: ${url}. ` +
            `Also tried local paths: ${possiblePaths.join(", ")}`
        );
      }
      return Buffer.from(await res.arrayBuffer());
    })
    .run();
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

  return `<!DOCTYPE html>
  <html>
    <head>
      <title>Debug OG Image</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
      ${allFonts
        .map(
          (font) => `
          @font-face {
            font-family: "${font.name}";
            font-style: ${font.style};
            font-weight: ${font.weight};
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
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export function generateImageResponseJPEG(buffer: ArrayBuffer) {
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
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
        const res = await fetch(new URL(fileToRead, libraryConfig.siteUrl));

        if (!res.ok) {
          throw new Error(`Failed to fetch image: ${fileToRead}`);
        }

        return Buffer.from(await res.arrayBuffer());
      })
      .run(),
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
