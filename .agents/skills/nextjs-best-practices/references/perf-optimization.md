# Performance & Bundle Optimization (perf-)

## Rule: `next/image` for All Images

**Why it matters:** `next/image` provides automatic WebP/AVIF conversion, lazy loading, responsive sizes, and blur placeholders. Native `<img>` tags miss all of these.

### ❌ Incorrect — Native img

```tsx
<img src='/hero.jpg' alt='Hero' width={1200} height={600} />
```

### ✅ Correct — next/image

```tsx
import Image from 'next/image';

<Image
  src='/hero.jpg'
  alt='Hero'
  width={1200}
  height={600}
  priority // above the fold — no lazy loading
  sizes='(max-width: 768px) 100vw, 1200px'
/>;
```

---

## Rule: `priority` for Above-the-Fold Images

**Why it matters:** Images marked with `priority` skip lazy loading and get preloaded. This directly improves LCP (Largest Contentful Paint).

```tsx
<Image
  src='/hero.jpg'
  alt='Hero'
  width={1200}
  height={600}
  priority // ✅ preloaded, no lazy loading
/>
```

---

## Rule: Font Optimization with `next/font`

**Why it matters:** `next/font` self-hosts Google Fonts (no external requests), removes layout shift with automatic `size-adjust`, and subsets fonts for smaller downloads.

```tsx
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang='de' className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Rule: Dynamic Imports for Heavy Components

```tsx
import dynamic from 'next/dynamic';

// Lazy load heavy component — only when needed
const HeavyChart = dynamic(() => import('./chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // skip SSR if it uses browser APIs
});

export default function Page() {
  return (
    <div>
      <h1>Analytics</h1>
      <HeavyChart />
    </div>
  );
}
```

---

## Rule: Turbopack Configuration (Next.js 16)

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack is now top-level (not under experimental)
  turbopack: {
    // Turbopack-specific options
  },
};

export default nextConfig;
```

---

## Rule: Bundle Analysis

```bash
# Install
npm install -D @next/bundle-analyzer

# Run analysis
ANALYZE=true npm run build
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer(nextConfig);
```

---

## Rule: Script Loading Strategies

```tsx
import Script from 'next/script'

// Critical scripts (before page interactive)
<Script src="..." strategy="beforeInteractive" />

// Default (after page interactive)
<Script src="..." />

// Defer to idle
<Script src="..." strategy="lazyOnload" />

// Web workers
<Script src="..." strategy="worker" />
```

---

## References

- https://nextjs.org/docs/app/building-your-application/optimizing/images
- https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
- https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
