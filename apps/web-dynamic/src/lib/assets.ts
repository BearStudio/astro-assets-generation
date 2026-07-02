import { configure } from "@bearstudio/astro-assets-generation";
import type { FontConfig } from "@bearstudio/astro-assets-generation";

const customFonts: FontConfig[] = [
  {
    name: "Geist",
    url: "/fonts/Geist.ttf",
    weight: 400,
    style: "normal",
  },
  {
    name: "GravitasOne",
    url: "/fonts/GravitasOne-Regular.ttf",
    weight: 400,
    style: "normal",
  },
];

configure({
  debugBackground: "#0a0a0a",
  siteUrl: import.meta.env.SITE ?? "http://localhost:4321",
  isDev: import.meta.env.DEV,
  customFonts,
  emoji: "twemoji",
});
