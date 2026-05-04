import { getEntry } from "astro:content";
import {
  getAstroImageBase64,
  FontWrapper,
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
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {tags.length > 0 && (
            <div
              style={{ display: "flex", flexWrap: "wrap", marginBottom: 24 }}
            >
              {tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 20,
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderRadius: 9999,
                    marginRight: 12,
                    background: "rgba(99, 102, 241, 0.3)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(99, 102, 241, 0.5)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <h1
            style={{
              fontWeight: "bold",
              marginBottom: 8,
              fontSize: 56,
              lineHeight: 1.2,
              color: "#f1f5f9",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 16,
            }}
          >
            {title}
          </h1>

          {description && (
            <p
              style={{
                fontSize: 30,
                color: "#94a3b8",
                lineHeight: 1.4,
              }}
            >
              {description.substring(0, 150)}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 32,
            borderTop: "1px solid rgba(99, 102, 241, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {author && (
              <div style={{ display: "flex", alignItems: "center" }}>
                {authorImageBase64 && (
                  <img
                    src={authorImageBase64}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 9999,
                      marginRight: 16,
                      objectFit: "cover",
                      border: "2px solid rgba(99, 102, 241, 0.5)",
                    }}
                  />
                )}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 24, color: "#e2e8f0" }}>
                    {author.data.name}
                  </span>
                  <span style={{ fontSize: 20, color: "#64748b" }}>
                    Blog Post
                  </span>
                </div>
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            {date && (
              <span style={{ fontSize: 20, color: "#64748b" }}>
                {new Date(date).toLocaleDateString("en-US", {
                  dateStyle: "medium",
                })}
              </span>
            )}
            <span style={{ fontSize: 16, color: "#4f46e5" }}>
              Generated on-demand
            </span>
          </div>
        </div>
      </div>
    </FontWrapper>
  );
}
