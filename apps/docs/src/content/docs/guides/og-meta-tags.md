---
title: Link generated images from your pages
description: Add the Open Graph and Twitter meta tags that make social networks pick up the image.
sidebar:
  order: 6
---

Generating the image is half the job. Crawlers only use it when the HTML page
declares it with an absolute URL.

## Build the absolute URL

Use `Astro.site`, which reflects the `site` value in your Astro config:

```astro
---
const ogImage = new URL(`/blog/${slug}/assets/og-image.png`, Astro.site);
---
```

If your site is served under a base path, prefix it:

```astro
---
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const ogImage = new URL(`${base}/blog/${slug}/assets/og-image.png`, Astro.site);
---
```

## Add the tags in a layout

```astro title="src/layouts/Post.astro"
---
const { title, description, slug } = Astro.props;
const ogImage = new URL(`/blog/${slug}/assets/og-image.png`, Astro.site);
---

<head>
  <meta charset="utf-8" />
  <title>{title}</title>
  <meta property="og:type" content="article" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={ogImage} />
</head>
```

Keep `og:image:width` and `og:image:height` in sync with the template's
`config`.

## Add the tags in a Starlight site

Starlight lets you override its `Head` component. Render the default head, then
append the tags. This site does exactly that:

```astro title="src/components/Head.astro"
---
import Default from "@astrojs/starlight/components/Head.astro";

const slug = Astro.locals.starlightRoute.id || "index";
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const ogImage = new URL(`${base}/og/${slug}/docs.png`, Astro.site);
---

<Default><slot /></Default>
<meta property="og:image" content={ogImage} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content={ogImage} />
```

```javascript title="astro.config.mjs"
starlight({
  components: { Head: "./src/components/Head.astro" },
});
```

The matching route lives at `src/pages/og/[...slug]/` and builds one path per
entry of the `docs` collection.

## Check the tags

Open the page source and confirm the `og:image` URL is absolute and returns
`200`. Then test with a validator such as
[opengraph.xyz](https://www.opengraph.xyz/) after deploying. Social networks
cache the image aggressively: when you change a design, expect the old image
to stick around until their cache expires.
