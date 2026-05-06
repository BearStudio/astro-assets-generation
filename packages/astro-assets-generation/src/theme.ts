import { FontConfig } from "./types";

const FONTS_CDN = "https://cdn.jsdelivr.net/npm";

export const DEFAULT_FONTS = [
  {
    name: "Thai",
    url: `${FONTS_CDN}/@fontsource/noto-sans-thai@5.2.8/files/noto-sans-thai-thai-400-normal.woff2`,
    weight: 400,
    style: "normal",
  },
  {
    name: "Jap",
    url: `${FONTS_CDN}/@fontsource/noto-sans-jp@5.2.8/files/noto-sans-jp-japanese-400-normal.woff2`,
    weight: 400,
    style: "normal",
  },
  {
    name: "KR",
    url: `${FONTS_CDN}/@fontsource/noto-sans-kr@5.2.8/files/noto-sans-kr-korean-400-normal.woff2`,
    weight: 400,
    style: "normal",
  },
  {
    name: "Arabic",
    url: `${FONTS_CDN}/@fontsource/noto-sans-arabic@5.2.8/files/noto-sans-arabic-arabic-400-normal.woff2`,
    weight: 400,
    style: "normal",
  },
] satisfies FontConfig[];

export function getAllFonts(customFonts: FontConfig[] = []): FontConfig[] {
  return [...customFonts, ...DEFAULT_FONTS];
}

export const DEFAULT_COLORS = {
  debugBackground: "#0a0a0a",
} as const;
