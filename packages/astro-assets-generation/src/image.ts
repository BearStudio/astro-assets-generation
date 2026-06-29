import { render, type FontLoader } from "takumi-js";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { JSX } from "react";
import type { AssetImageConfig, EmojiType, FontConfig } from "./types";
import { getAllFonts } from "./theme";

// Injected by the Vite plugin in integration.ts at SSR bundle time.
// Undefined when the module is loaded outside of Vite (e.g., astro.config.ts evaluation).
declare const __TAKUMI_WASM_PATH__: string | undefined;

/**
 * Optional override called before fetching `siteUrl + url` for asset images
 * and `/`-prefixed font URLs. Return `null` or `undefined` to fall back to
 * fetch. Useful for `output: 'static'` builds — see `diskLoader` from
 * `@bearstudio/astro-assets-generation/disk-loader`.
 */
export type AssetLoader = (url: string) => Promise<Buffer | null | undefined>;

let libraryConfig = {
  debugBackground: "#0a0a0a",
  siteUrl: "",
  isDev: true,
  customFonts: [] as FontConfig[],
  emoji: "twemoji" as EmojiType,
  loadAsset: undefined as AssetLoader | undefined,
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
 *   siteUrl: import.meta.env.SITE,
 *   emoji: "twemoji", // "twemoji" | "blobmoji" | "noto" | "openmoji" | "fluent" | "fluentFlat" | "from-font"
 * });
 * ```
 */
export function configure(config: Partial<typeof libraryConfig>) {
  libraryConfig = { ...libraryConfig, ...config };
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

  // Web path (resolved against siteUrl). Defer to loadAsset if provided.
  if (font.url.startsWith("/")) {
    if (libraryConfig.loadAsset) {
      const fromLoader = await libraryConfig.loadAsset(font.url);
      if (fromLoader) return fromLoader;
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
  // (needed when bundled with noExternal).
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
  throw new Error(
    `Failed to load built-in font ${font.name}. Tried: ${possiblePaths.join(", ")}`
  );
}

function fontConfigToLoader(font: FontConfig): FontLoader {
  return {
    name: font.name,
    weight: font.weight,
    style: font.style,
    key: font.url,
    data: () => loadFontData(font),
  };
}

function getFontLoaders(): FontLoader[] {
  return getAllFonts(libraryConfig.customFonts).map(fontConfigToLoader);
}

// Lazy WASM fallback: loaded once on first render, cached for all subsequent renders.
// takumi-js v2 beta.7+ does not publish platform-specific native packages, so the WASM
// path is always taken until native packages are released.
// __TAKUMI_WASM_PATH__ is replaced by Vite's define at SSR bundle time; it is undefined
// when this module is loaded outside of Vite (e.g., during astro.config.ts evaluation).
let _wasmLoaded = false;
let _wasmModule: WebAssembly.Module | undefined;

async function resolveRenderModule(): Promise<{ module?: WebAssembly.Module }> {
  if (_wasmLoaded) return _wasmModule ? { module: _wasmModule } : {};
  _wasmLoaded = true;
  const wasmFilePath =
    typeof __TAKUMI_WASM_PATH__ !== "undefined" ? __TAKUMI_WASM_PATH__ : null;
  if (wasmFilePath) {
    const wasmBytes = await fs.readFile(wasmFilePath);
    _wasmModule = await WebAssembly.compile(new Uint8Array(wasmBytes));
  }
  return _wasmModule ? { module: _wasmModule } : {};
}

export async function PNG(
  component: JSX.Element,
  config: AssetImageConfig
): Promise<Uint8Array> {
  const { module } = await resolveRenderModule();
  return render(component, {
    width: config.width,
    height: config.height,
    fonts: getFontLoaders(),
    emoji: config.emoji ?? libraryConfig.emoji,
    format: "png",
    module,
  });
}

export async function JPEG(
  component: JSX.Element,
  config: AssetImageConfig
): Promise<Uint8Array> {
  const { module } = await resolveRenderModule();
  return render(component, {
    width: config.width,
    height: config.height,
    fonts: getFontLoaders(),
    emoji: config.emoji ?? libraryConfig.emoji,
    format: "jpeg",
    module,
  });
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
      </style>
    </head>
    <body>
      <div id="screen">
        <div id="render">
          ${html}
        </div>
      </div>
    </body>
  </html>`;
}

export function generateImageResponsePNG(buffer: ArrayBuffer | Uint8Array) {
  const body = buffer instanceof ArrayBuffer ? buffer : new Uint8Array(buffer);
  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      // "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export function generateImageResponseJPEG(buffer: ArrayBuffer | Uint8Array) {
  const body = buffer instanceof ArrayBuffer ? buffer : new Uint8Array(buffer);
  return new Response(body, {
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

async function readDevAstroImage(image: { src: string }): Promise<Buffer> {
  // Vite dev: image.src is `/@fs/<absolute-path>?<query>`.
  return fs.readFile(
    path.resolve(image.src.replace(/\?.*/, "").replace("/@fs", ""))
  );
}

async function fetchAstroImage(image: { src: string }): Promise<Buffer> {
  const res = await fetch(new URL(image.src, libraryConfig.siteUrl));
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${image.src}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function getAstroImageBuffer(image: { src: string }) {
  const fileExtension = RegExp(/.(jpg|jpeg|png)$/)
    .exec(image.src)?.[0]
    .slice(1);

  const fileTypeMap: Record<string, string> = {
    jpg: "jpeg",
    jpeg: "jpeg",
    png: "png",
  };
  const fileType = fileExtension ? fileTypeMap[fileExtension] : undefined;
  if (!fileType) throw new Error("Must be a jpg, jpeg or png");

  let buffer: Buffer | null | undefined;
  if (libraryConfig.isDev) {
    buffer = await readDevAstroImage(image);
  } else {
    if (libraryConfig.loadAsset) {
      buffer = await libraryConfig.loadAsset(image.src);
    }
    buffer ??= await fetchAstroImage(image);
  }

  return { buffer, fileType };
}

export async function getAstroImageBase64(image: { src: string }) {
  const { buffer, fileType } = await getAstroImageBuffer(image);
  return imageBufferToBase64(buffer, fileType);
}

export function imageBufferToBase64(
  buffer: Buffer | Uint8Array,
  fileType: string
) {
  const buf = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return `data:image/${fileType};base64, ${buf.toString("base64")}`;
}

export async function jsxToBase64(
  component: JSX.Element,
  config: { width: number; height: number }
): Promise<string> {
  const data = await PNG(component, config);
  return imageBufferToBase64(data, "png");
}
