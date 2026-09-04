# docs

Documentation website for `@bearstudio/astro-assets-generation`, built with
[Starlight](https://starlight.astro.build) and deployed to GitHub Pages at
https://bearstudio.github.io/astro-assets-generation/ by
`.github/workflows/deploy-docs.yml` on every push to `main`.

The site dogfoods the library: `src/pages/og/[...slug]/` generates an
Open Graph image for every docs page, and `src/components/Head.astro`
injects it into the page head.

## Commands

| Command        | Action                                   |
| :------------- | :--------------------------------------- |
| `pnpm dev`     | Start the dev server at `localhost:4321` |
| `pnpm build`   | Build the site to `./dist/`              |
| `pnpm preview` | Preview the production build locally     |

Run `pnpm turbo run build --filter=docs` from the repo root to build the
library first, as CI does.
