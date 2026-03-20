import { getEmojiDataUri } from "@/emoji";

// Component to display an emoji in a template
export function Emoji({ emoji, size = 36 }: { emoji: string; size?: number }) {
  const src = getEmojiDataUri(emoji);
  if (!src) return null;

  return (
    <img
      src={src}
      style={{
        display: "inline",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    />
  );
}
