---
title: API route
description: apiImageEndpoint(), getStaticPathsForAssets(), the URL scheme and the responses.
sidebar:
  order: 4
---

The route file exposes templates as URLs. Its name is fixed.

## File name

```
src/pages/<any path>/[__image].[__type].ts
```

Two underscores before `image` and `type`. Any dynamic segments in the parent
path (`[slug]`, `[...path]`) become regular params.

## URL scheme

```
/<parent path>/<template name>.<type>
```

| `<type>` | Response                                     |
| -------- | -------------------------------------------- |
| `png`    | `image/png`                                  |
| `jpg`    | `image/jpeg`                                 |
| `jpeg`   | `image/jpeg`                                 |
| `debug`  | `text/html; charset=utf-8` preview page      |

## `apiImageEndpoint(modules)`

```typescript
import { apiImageEndpoint } from "@bearstudio/astro-assets-generation";

export const GET: APIRoute = apiImageEndpoint(
  import.meta.glob("./_*.tsx", { eager: true }),
);
```

| Parameter | Type                      | Description                                                             |
| --------- | ------------------------- | ----------------------------------------------------------------------- |
| `modules` | `Record<string, unknown>` | Result of an eager `import.meta.glob` over the template files.          |

Returns an Astro `APIRoute`. On each request the handler:

1. Finds the module whose file name, minus `_` and `.tsx`, equals
   `params.__image`.
2. Calls its default export with the request context (see
   [Template props](../templates/#props)).
3. Renders the result in the format given by `params.__type`.

### Responses

| Status | When                                                              | Body                        |
| ------ | ----------------------------------------------------------------- | --------------------------- |
| 200    | Render succeeded                                                  | Image bytes or HTML         |
| 404    | No template matches `__image`                                     | empty, status text `Asset not found` |
| 404    | Template threw `NotFoundAssetError`                               | empty, status text `Asset not found` |
| 404    | `__type` is not `png`, `jpg`, `jpeg` or `debug`                   | empty                       |
| 500    | Template or renderer threw any other error                        | `Failed to generate asset`  |

No `Cache-Control` header is set. Add one by wrapping the handler; see the
[dynamic tutorial](../../tutorials/dynamic-og-images/#6-add-cache-headers).

### Logging

The handler writes to the console:

```
[API] Request: <image>/<type>
[API] Rendering template: _<image>.tsx
[API] Template not found: _<image>.tsx
[API] Error: <error>
```

## `getStaticPathsForAssets(modules, parentParams, imageTypes?)`

```typescript
import { getStaticPathsForAssets } from "@bearstudio/astro-assets-generation";

export const getStaticPaths = async () => {
  const posts = await getCollection("blog");
  return getStaticPathsForAssets(
    modules,
    posts.map((post) => ({ slug: post.id })),
    ["png", "jpg"],
  );
};
```

| Parameter      | Type                             | Default           | Description                                                      |
| -------------- | -------------------------------- | ----------------- | ---------------------------------------------------------------- |
| `modules`      | `Record<string, unknown>`        | required          | Same glob result passed to `apiImageEndpoint`.                   |
| `parentParams` | `Array<Record<string, string>>`  | required          | One object per parent route, for example `{ slug: "hello" }`. Use `[{}]` when the route has no parent params. |
| `imageTypes`   | `string[]`                       | `["png", "jpg"]`  | Types to generate. May include `"debug"`.                        |

Returns an array of `{ params }` objects, one for every combination of parent
params × template × image type, ready to return from `getStaticPaths`.

In dev, Astro only serves the paths in this list. A URL for a type or template
that is not listed returns 404.

## `NotFoundAssetError`

```typescript
import { NotFoundAssetError } from "@bearstudio/astro-assets-generation";

throw new NotFoundAssetError();
```

Error class (`name: "NotFoundAssetError"`, message `Asset not found`). Thrown
from a template, it turns the response into a 404.

## Prerendered versus on-demand

| Setting                              | Behaviour                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `export const getStaticPaths = …`    | Images rendered during `astro build` and written to `dist/`. No adapter needed. |
| `export const prerender = false`     | Images rendered per request. Requires a server adapter.                     |

Do not export both from the same file.
