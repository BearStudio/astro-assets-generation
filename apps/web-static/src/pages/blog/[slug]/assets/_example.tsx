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
        tw="flex flex-col w-full h-full p-16"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <h1 tw="text-white text-7xl font-bold">My Blog Post</h1>
        <p tw="text-white text-2xl">Post: {params.slug}</p>
      </div>
    </FontWrapper>
  );
}
