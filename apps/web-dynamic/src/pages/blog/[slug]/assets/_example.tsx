// src/pages/blog/[slug]/assets/_og-image.tsx
import { FontWrapper } from "@bearstudio/astro-assets-generation";
import type { AssetImageConfig } from "@bearstudio/astro-assets-generation";

export const config: AssetImageConfig = {
  width: 1200,
  height: 630,
  debugScale: 0.5, // Optional: for debug view
};

export default function OgImage({ params }: { params: { slug: string } }) {
  return (
    <FontWrapper fontFamily="Geist">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: 64,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <h1 style={{ color: "white", fontSize: 72, fontWeight: "bold" }}>
          My Blog Post
        </h1>
        <p style={{ color: "white", fontSize: 24 }}>Post: {params.slug}</p>
      </div>
    </FontWrapper>
  );
}
