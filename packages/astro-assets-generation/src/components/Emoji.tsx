import { getEmojiDataUri } from "@/emoji";

// Component to display an emoji in a template
export function Emoji({ emoji, size = 4 }: { emoji: string; size?: number }) {
  const src = getEmojiDataUri(emoji);
  if (!src) return null;

  return (
    <img
      src={src}
      width={size}
      height={size}
      style={{
        display: "inline",
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        maxWidth: size,
        maxHeight: size,
        flexShrink: 0,
      }}
    />
  );
}
