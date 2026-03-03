import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

function loadEmojiData(): Record<string, string> {
  const candidates = [
    join(dirname(fileURLToPath(import.meta.url)), "emoji-data.json"),
    resolve(
      process.cwd(),
      "node_modules/@bearstudio/astro-assets-generation/dist/emoji-data.json"
    ),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, "utf-8"));
    }
  }
  throw new Error(
    `[astro-assets-generation] emoji-data.json not found. Tried: ${candidates.join(", ")}`
  );
}

const emojiData = loadEmojiData();

function emojiToCodePoint(emoji: string) {
  return [...emoji].map((c) => c.codePointAt(0)!.toString(16)).join("-");
}

const emojiCache = new Map<string, string>();

// Get the emoji image uri from the emoji code
export function getEmojiDataUri(emoji: string) {
  if (emojiCache.has(emoji)) return emojiCache.get(emoji)!;

  const code = emojiToCodePoint(emoji);
  const encoded = emojiData[code];

  if (!encoded) return null;

  const uri = `data:image/svg+xml;base64,${encoded}`;
  emojiCache.set(emoji, uri);
  return uri;
}

// helper function to extract emoji from a string (from a mdx for example) and use the Emoji component after
export function extractEmoji(input: string) {
  const emojiRegex = /\p{Extended_Pictographic}/gu;

  const emojis = input.match(emojiRegex) ?? [];
  const text = input.replace(emojiRegex, "").trim();

  return {
    text,
    emojis,
  };
}
