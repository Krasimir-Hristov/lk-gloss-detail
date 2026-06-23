# Caching & Revalidation (cache-)

## Rule: Understand the Four Cache Layers

Next.js 16 has four caching mechanisms:

1. **Request Memoization** — Deduplicates same fetch in one render pass (automatic, React-level)
2. **Data Cache** — Persists fetch results across requests/deployments
3. **Full Route Cache** — Static HTML/RSC payload at build or revalidation time
4. **Router Cache** — Client-side cache of RSC payloads for 30s (navigation)

---

## Rule: Use `cacheComponents: true` for PPR

**Why it matters:** Partial Prerendering (PPR) combines static and dynamic content. The static shell is served instantly; dynamic content streams in.

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true, // enables PPR in Next.js 16
};

export default nextConfig;
```

---

## Rule: Tag-based Revalidation is Preferred

**Why it matters:** `revalidateTag()` is more granular than `revalidatePath()`. Tag what you fetch, revalidate what you mutate.

### ❌ Incorrect — Path-based only

```tsx
// fetch
const data = await fetch('https://api.example.com/posts');

// mutate
export async function deletePost(id: string) {
  await db.posts.delete(id);
  revalidatePath('/blog'); // revalidates EVERYTHING on /blog
}
```

### ✅ Correct — Tag-based

```tsx
// fetch — tag the request
const data = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },
});

// mutate — revalidate only what changed
export async function deletePost(id: string) {
  await db.posts.delete(id);
  revalidateTag('posts'); // only revalidates requests tagged 'posts'
}
```

---

## Rule: `revalidateTag` with `max` for Stale-While-Revalidate

**Why it matters:** In Next.js 16, `revalidateTag(tag, 'max')` shows stale data while revalidating in background — no loading spinners.

```tsx
'use server';
import { revalidateTag } from 'next/cache';

export async function updateArticle(articleId: string) {
  await db.articles.update(articleId, data);
  // Users see stale data while new data revalidates in background
  revalidateTag(`article-${articleId}`, 'max');
}
```

---

## Rule: Opt Out of Caching for Dynamic Data

```tsx
// Option 1: Per-request opt-out
const data = await fetch(url, { cache: 'no-store' });

// Option 2: Segment-level opt-out
export const dynamic = 'force-dynamic';

// Option 3: Route-level opt-out (layout/page)
export const revalidate = 0;
```

---

## References

- https://nextjs.org/docs/app/building-your-application/caching
- https://nextjs.org/docs/app/api-reference/functions/revalidateTag
- https://nextjs.org/docs/app/api-reference/functions/revalidatePath
