import { FontConfig } from "./types";

export const DEFAULT_FONTS = [
  {
    name: "NotoSans",
    url: "./fonts/NotoSans-Regular.ttf",
    weight: 400,
    style: "normal",
  },
  {
    name: "Thai",
    url: "./fonts/NotoSansThai-Regular.ttf",
    weight: 400,
    style: "normal",
  },
  {
    name: "Jap",
    url: "./fonts/NotoSansJP-Regular.ttf",
    weight: 400,
    style: "normal",
  },
  {
    name: "KR",
    url: "./fonts/NotoSansKR-Regular.ttf",
    weight: 400,
    style: "normal",
  },
  {
    name: "Arabic",
    url: "./fonts/NotoSansArabic-Regular.ttf",
    weight: 400,
    style: "normal",
  },
] satisfies FontConfig[];

export const DEFAULT_COLORS = {
  debugBackground: "#0a0a0a",
} as const;
