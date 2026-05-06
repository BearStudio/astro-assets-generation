import type { APIRoute } from "astro";
import {
  DEBUG_HTML,
  PNG,
  JPEG,
  generateImageResponseHTML,
  generateImageResponsePNG,
  generateImageResponseJPEG,
  getImageNameFromTsxPath,
} from "./image";

export class NotFoundAssetError extends Error {
  constructor() {
    super("Asset not found");
    this.name = "NotFoundAssetError";
  }
}

export const apiImageEndpoint: (modules: Record<string, unknown>) => APIRoute =
  (modules) => async (context) => {
    // Some context getters (e.g. `clientAddress`) throw in prerendered/static routes.
    // Safely copy all properties so the `...rest` spread doesn't trigger throwing getters.
    const safeContext = Object.fromEntries(
      Object.keys(context).map((k) => {
        try {
          return [k, (context as any)[k]];
        } catch {
          return [k, undefined];
        }
      })
    );
    const { params, site, ...rest } = safeContext;
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

      const component = await content.default({
        params,
        site,
        ...rest,
      });
      const config = content.config;

      if (params.__type === "debug") {
        const html = await DEBUG_HTML(component, config);
        return generateImageResponseHTML(html);
      }

      if (params.__type === "png") {
        const png = await PNG(component, config);
        return generateImageResponsePNG(png);
      }

      if (params.__type === "jpg" || params.__type === "jpeg") {
        const jpeg = await JPEG(component, config);
        return generateImageResponseJPEG(jpeg);
      }

      return new Response(null, {
        status: 404,
        statusText: "Format not supported (use png, jpg, jpeg or debug)",
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

export function getStaticPathsForAssets(
  modules: Record<string, unknown>,
  parentParams: Array<Record<string, string>>,
  imageTypes: string[] = ["png", "jpg"]
) {
  const imageNames = Object.keys(modules)
    .map((key) => getImageNameFromTsxPath(key))
    .filter((name): name is string => name !== undefined);

  return parentParams.flatMap((params) =>
    imageNames.flatMap((image) =>
      imageTypes.map((type) => ({
        params: { ...params, __image: image, __type: type },
      }))
    )
  );
}

export {
  getAstroImageBase64,
  configure,
  getConfiguredFonts,
  jsxToBase64,
} from "./image";
export type { AssetLoader } from "./image";
export { FontWrapper } from "./components/FontWrapper";
export type { AssetImageConfig, FontConfig, FontConfiguration } from "./types";
export type { FontWrapperProps } from "./components/FontWrapper";
export { astroAssetsGeneration } from "./integration";
