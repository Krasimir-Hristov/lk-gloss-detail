# Changelog

## 1.0.0 — June 2026

### Initial Release

- 8 rule categories covering Next.js 16+ best practices
- Server Components & Data Fetching (data-)
- Caching & Revalidation (cache-)
- Streaming & Partial Prerendering (stream-)
- Server Actions & Forms (actions-)
- Routing & Layout Architecture (routing-)
- Performance & Bundle Optimization (perf-)
- SEO & Metadata (seo-)
- TypeScript & Code Quality (ts-)

### Breaking Changes Documented

- `params` and `searchParams` are Promises in Next.js 16
- `cookies()`, `headers()`, `draftMode()` are async
- Turbopack config is top-level in next.config.ts
- `cacheComponents: true` enables PPR
- Local IP images blocked by default
