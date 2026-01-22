import { ImageResponse } from "@takumi-rs/image-response";
import { renderToStaticMarkup } from "react-dom/server";
import { match } from "ts-pattern";
import fs from "node:fs/promises";
import path from "node:path";
import type { JSX } from "react";
import type { AssetImageConfig } from "./types";
import { DEFAULT_FONTS } from "./theme";

let libraryConfig = {
  debugBackground: "#0a0a0a",
  siteUrl: "",
  isDev: true,
};

export function configure(config: Partial<typeof libraryConfig>) {
  libraryConfig = { ...libraryConfig, ...config };
}

export async function PNG(component: JSX.Element, config: AssetImageConfig) {
  const response = new ImageResponse(component, {
    width: config.width,
    height: config.height,
  });

  return response.arrayBuffer();
}

export async function DEBUG_HTML(
  component: JSX.Element,
  config: AssetImageConfig
): Promise<string> {
  const scale = config.debugScale ?? 0.5;
  const html = renderToStaticMarkup(component);

  return `<!DOCTYPE html>
  <html>
    <head>
      <title>Debug OG Image</title>
      <style>
      ${DEFAULT_FONTS.map(
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
      ).join("\n")}
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

export function generateImageResponsePNG(buffer: ArrayBuffer) {
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
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
