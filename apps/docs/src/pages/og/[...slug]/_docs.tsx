import { getEntry } from "astro:content";
import { FontWrapper } from "@bearstudio/astro-assets-generation";
import type { AssetImageConfig } from "@bearstudio/astro-assets-generation";

export const config: AssetImageConfig = {
  width: 1200,
  height: 630,
  debugScale: 0.5,
};

export default async function DocsOgImage({
  params,
}: {
  params: { slug?: string };
}) {
  const slug = params.slug;
  if (!slug) {
    throw new Error("Missing docs slug");
  }

  const doc = await getEntry("docs", slug);
  if (!doc) {
    throw new Error(`Doc not found: ${slug}`);
  }

  const { title, description } = doc.data;

  return (
    <FontWrapper
      fontFamily="Geist"
      style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 64,
          color: "white",
        }}
      >
        <span style={{ fontSize: 24, color: "#94a3b8" }}>
          @bearstudio/astro-assets-generation
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 style={{ fontSize: 64, fontWeight: "bold", lineHeight: 1.1 }}>
            {title}
          </h1>
          {description && (
            <p style={{ fontSize: 28, color: "#cbd5e1", lineHeight: 1.4 }}>
              {description.substring(0, 160)}
            </p>
          )}
        </div>
        <span style={{ fontSize: 20, color: "#64748b" }}>
          Generated at build time with Takumi
        </span>
      </div>
    </FontWrapper>
  );
}
