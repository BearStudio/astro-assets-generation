import {
  apiImageEndpoint,
  getStaticPathsForAssets,
} from "@bearstudio/astro-assets-generation";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import "@/lib/assets";

// Every `_*.tsx` file next to this route is an image template.
const modules = import.meta.glob("./_*.tsx", { eager: true });

export const getStaticPaths = async () => {
  const docs = await getCollection("docs");
  return getStaticPathsForAssets(
    modules,
    docs.map((doc) => ({ slug: doc.id })),
    // `.debug` is only reachable when listed here, so expose it in dev only.
    import.meta.env.DEV ? ["png", "debug"] : ["png"],
  );
};

export const GET: APIRoute = apiImageEndpoint(modules);
