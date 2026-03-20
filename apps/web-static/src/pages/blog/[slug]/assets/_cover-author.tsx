import { getEntry } from "astro:content";
import {
  getAstroImageBase64,
  FontWrapper,
  TextWithEmoji,
} from "@bearstudio/astro-assets-generation";

interface PostImageParams {
  params: { slug?: string };
  site?: URL;
  url: URL;
}

export const config = {
  width: 1200,
  height: 630,
  debugScale: 0.5,
};

export default async function CoverAuthorOGImage({ params }: PostImageParams) {
  const slug = params.slug;

  if (!slug) {
    throw new Error("Missing post slug");
  }

  const post = await getEntry("blog", slug);

  if (!post) {
    throw new Error(`Post not found: ${slug}`);
  }

  const { title, description, tags = [], author: authorId, date } = post.data;
  const author = await getEntry("author", authorId.id);

  const authorImageBase64 = author?.data.image
    ? await getAstroImageBase64(author.data.image)
    : null;

  return (
    <FontWrapper
      fontFamily="Geist"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div tw="flex flex-col w-full h-full p-16">
        <div tw="flex flex-col flex-1 justify-center">
          {tags.length > 0 && (
            <div tw="flex flex-wrap mb-6">
              {tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  tw="text-xl px-4 py-2 rounded-full mr-3 text-white"
                  style={{ background: "rgba(255, 255, 255, 0.2)" }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <h1
            tw="flex items-center gap-4 font-bold leading-[1.2] text-white mb-2"
            style={{ fontSize: 56 }}
          >
            <TextWithEmoji>{title}</TextWithEmoji>
          </h1>

          {description && (
            <p
              tw="text-3xl leading-[1.4]"
              style={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              {description.substring(0, 150)}
            </p>
          )}
        </div>

        <div
          tw="flex justify-between items-center pt-8 border-t"
          style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
        >
          <div tw="flex items-center">
            {author && (
              <div tw="flex items-center">
                {authorImageBase64 && (
                  <img
                    src={authorImageBase64}
                    tw="w-16 h-16 rounded-full mr-4"
                    style={{
                      objectFit: "cover",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                    }}
                  />
                )}
                <div tw="flex flex-col">
                  <span
                    tw="text-2xl"
                    style={{ color: "rgba(255, 255, 255, 0.9)" }}
                  >
                    {author.data.name}
                  </span>
                  <span
                    tw="text-xl"
                    style={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    Blog Post
                  </span>
                </div>
              </div>
            )}
          </div>
          <div tw="flex flex-col items-end">
            {date && (
              <span tw="text-xl" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                {new Date(date).toLocaleDateString("en-US", {
                  dateStyle: "medium",
                })}
              </span>
            )}
            <span tw="text-base" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
              Generated at build time
            </span>
          </div>
        </div>
      </div>
    </FontWrapper>
  );
}
