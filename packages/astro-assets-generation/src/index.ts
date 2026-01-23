import type { APIRoute } from "astro";
import {
  DEBUG_HTML,
  PNG,
  generateImageResponseHTML,
  generateImageResponsePNG,
} from "./image";

export class NotFoundAssetError extends Error {
  constructor() {
    super("Asset not found");
    this.name = "NotFoundAssetError";
  }
}

export const apiImageEndpoint: (modules: Record<string, unknown>) => APIRoute =
  (modules) =>
  async ({ params, site }) => {
    try {
      console.log(`[API] Request: ${params.__image}/${params.__type}`);

      const content = Object.entries(modules)
        .map(([path, file]) => ({
          fileName: path
            .split("/")
            .at(-1)
            ?.replace(/\.tsx$/, "")
            .replace(/^_/, ""),
          file,
        }))
        .find(({ fileName }) => fileName === params.__image)?.file as any;

      if (!content?.default) {
        console.error(`[API] Template not found: _${params.__image}.tsx`);
        throw new NotFoundAssetError();
      }

      console.log(`[API] Rendering template: _${params.__image}.tsx`);

      const component = await content.default({ params, site });
      const config = content.config;

      if (params.__type === "debug") {
        const html = await DEBUG_HTML(component, config);
        return generateImageResponseHTML(html);
      }

      if (params.__type === "png") {
        const png = await PNG(component, config);
        return generateImageResponsePNG(png);
      }

      return new Response(null, {
        status: 404,
        statusText: "Format not supported (use png or debug)",
      });
    } catch (error) {
      console.error("[API] Error:", error);

      if (error instanceof NotFoundAssetError) {
        return new Response(null, {
          status: 404,
          statusText: error.message,
        });
      }

      return new Response("Failed to generate asset", {
        status: 500,
      });
    }
  };

export { getAstroImageBase64, configure } from "./image";
export { extractEmoji } from "./emoji";
export { Emoji } from "./components/Emoji";
export type { AssetImageConfig } from "./types";
