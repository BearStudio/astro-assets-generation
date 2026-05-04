import { createRequire } from "node:module";
import { FontConfig } from "./types";

const cjsRequire = createRequire(import.meta.url);

export const DEFAULT_FONTS = [
  {
    name: "Thai",
    url: cjsRequire.resolve(
      "@fontsource/noto-sans-thai/files/noto-sans-thai-thai-400-normal.woff2"
    ),
    weight: 400,
    style: "normal",
  },
  {
    name: "Jap",
    url: cjsRequire.resolve(
      "@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff2"
    ),
    weight: 400,
    style: "normal",
  },
  {
    name: "KR",
    url: cjsRequire.resolve(
      "@fontsource/noto-sans-kr/files/noto-sans-kr-korean-400-normal.woff2"
    ),
    weight: 400,
    style: "normal",
  },
  {
    name: "Arabic",
    url: cjsRequire.resolve(
      "@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff2"
    ),
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
