import {
  apiImageEndpoint,
  getStaticPathsForAssets,
} from "@bearstudio/astro-assets-generation";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import "@/lib/assets";

const modules = import.meta.glob("./_*.tsx", { eager: true });

export const getStaticPaths = async () => {
  const posts = await getCollection("blog");
  return getStaticPathsForAssets(
    modules,
    posts.map((post) => ({ slug: post.id }))
  );
};

export const GET: APIRoute = apiImageEndpoint(modules);
