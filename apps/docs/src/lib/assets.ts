import { configure } from "@bearstudio/astro-assets-generation";
import { diskLoader } from "@bearstudio/astro-assets-generation/disk-loader";

configure({
  debugBackground: "#0a0a0a",
  siteUrl: import.meta.env.SITE ?? "http://localhost:4321",
  isDev: import.meta.env.DEV,
  customFonts: [
    {
      name: "Geist",
      url: "/fonts/Geist.ttf",
      weight: 400,
      style: "normal",
    },
  ],
  // The docs site is fully static: no server runs during prerender, so
  // fonts and images are resolved from disk (`dist/` then `public/`).
  loadAsset: diskLoader(),
});
