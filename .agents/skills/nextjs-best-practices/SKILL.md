---
name: nextjs-best-practices
description: Next.js 16+ App Router best practices and performance optimization. Use when writing, reviewing, or optimizing Next.js applications with React Server Components, Server Actions, streaming, caching, routing, and TypeScript patterns.
license: MIT
metadata:
  author: lk-gloss-detail
  version: '1.0.0'
  date: June 2026
  abstract: Comprehensive Next.js 16+ best practices guide covering App Router patterns, React Server Components, Server Actions, streaming/PPR, caching strategies, routing, performance optimization, and TypeScript conventions. Each rule includes detailed explanations, incorrect vs. correct code examples, and specific guidance for automated code generation.
---

# Next.js 16+ Best Practices

Comprehensive performance and architecture guide for Next.js 16+ App Router, maintained for the LK Gloss & Detail project. Contains rules across 8 categories, prioritized by impact to guide automated code generation and review.

## When to Apply

Reference these guidelines when:

- Writing Next.js pages, layouts, or components
- Implementing Server Actions or API routes
- Configuring caching, revalidation, or streaming
- Designing routing patterns (parallel, intercepted, dynamic)
- Optimizing images, fonts, or bundle size
- Setting up internationalization (i18n)
- Reviewing performance or SEO issues
- Migrating from older Next.js versions

## Rule Categories by Priority

| Priority | Category                          | Impact      | Prefix     |
| -------- | --------------------------------- | ----------- | ---------- |
| 1        | Server Components & Data Fetching | CRITICAL    | `data-`    |
| 2        | Caching & Revalidation            | CRITICAL    | `cache-`   |
| 3        | Streaming & Partial Prerendering  | CRITICAL    | `stream-`  |
| 4        | Server Actions & Forms            | HIGH        | `actions-` |
| 5        | Routing & Layout Architecture     | HIGH        | `routing-` |
| 6        | Performance & Bundle Optimization | MEDIUM-HIGH | `perf-`    |
| 7        | SEO & Metadata                    | MEDIUM      | `seo-`     |
| 8        | TypeScript & Code Quality         | MEDIUM      | `ts-`      |

## How to Use

Read individual rule files for detailed explanations and code examples:

```
references/data-server-components.md
references/cache-revalidation.md
references/stream-ppr.md
references/actions-forms.md
references/routing-patterns.md
references/perf-optimization.md
references/seo-metadata.md
references/ts-patterns.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect pattern with explanation
- Correct pattern with explanation
- Performance metrics or trade-offs
- Additional context and references
- Next.js 16-specific notes (when applicable)

## Core Principles

**1. Server Components by default, Client Components only when needed.**
In Next.js 16 App Router, all components are React Server Components (RSC) by default. Only add `'use client'` when you need interactivity (event handlers, hooks, browser APIs). This minimizes client-side JavaScript and improves performance.

**2. Fetch data where it's needed — no prop drilling.**
Each Server Component can be `async` and fetch its own data directly. Avoid fetching all data in a parent and passing it down through props. This enables automatic request deduplication and parallel data fetching.

**3. Use Server Actions for mutations, not API routes.**
For form submissions and data mutations, prefer Server Actions over traditional API routes. They provide progressive enhancement, work without JavaScript, and integrate with React's `useActionState` and `useOptimistic` hooks.

**4. Streaming is the default rendering model.**
Next.js 16 uses streaming by default. Use `<Suspense>` boundaries to control loading states and enable Partial Prerendering (PPR) for instant static shells with dynamic content streamed in.

**5. Cache strategically, revalidate precisely.**
Use `cache: 'force-cache'` for static data, `next: { revalidate }` for time-based revalidation, and `revalidateTag()` / `revalidatePath()` for on-demand invalidation after mutations.

**6. Next.js 16 Breaking Changes Awareness.**

- `params` and `searchParams` are now Promises — always `await` them.
- `cookies()`, `headers()`, and `draftMode()` are now async — must be awaited.
- Turbopack config is now top-level in `next.config.ts`, not under `experimental`.
- `cacheComponents: true` enables Partial Prerendering (PPR).
- Local IP images are blocked by default — use `images.dangerouslyAllowLocalIP` only for private networks.

## References

- https://nextjs.org/docs
- https://nextjs.org/docs/app/building-your-application
- https://nextjs.org/docs/app/api-reference
- https://react.dev/reference/rsc/server-components
- https://nextjs.org/docs/app/building-your-application/upgrading/version-16
