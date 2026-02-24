import {
  defineCollection,
  reference,
  z,
  type SchemaContext,
} from "astro:content";
import { glob } from "astro/loaders";

const zPost = () =>
  z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: reference("author"),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  });

const zAuthor = ({ image }: SchemaContext) =>
  z.object({
    name: z.string(),
    image: image(),
  });

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
    schema: zPost,
  }),
  author: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/authors" }),
    schema: zAuthor,
  }),
};
