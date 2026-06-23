# Streaming & Partial Prerendering (stream-)

## Rule: Use Suspense Boundaries Strategically

**Why it matters:** Suspense boundaries control the granularity of streaming. Without them, the entire page waits for the slowest component. With them, fast content renders immediately while slow content streams in.

### ❌ Incorrect — No Suspense, Everything Blocks

```tsx
export default async function Page() {
  const slowData = await fetchSlowData(); // 3 seconds
  const fastData = await fetchFastData(); // 50ms

  return (
    <div>
      <SlowSection data={slowData} />
      <FastSection data={fastData} />
    </div>
  );
}
// User waits 3 seconds for ANY content
```

### ✅ Correct — Suspense Boundaries

```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <FastSection /> {/* renders immediately */}
      <Suspense fallback={<SlowSectionSkeleton />}>
        <SlowSection /> {/* streams in when ready */}
      </Suspense>
    </div>
  );
}

async function FastSection() {
  const data = await fetchFastData(); // 50ms
  return <div>{data}</div>;
}

async function SlowSection() {
  const data = await fetchSlowData(); // 3 seconds
  return <div>{data}</div>;
}
```

---

## Rule: Skeleton Fallbacks, Not Spinners

**Why it matters:** Skeleton screens reduce perceived latency and prevent layout shift (CLS). Spinners cause layout jumps when content loads.

### ❌ Incorrect — Spinner Fallback

```tsx
<Suspense fallback={<div>Loading...</div>}>
  <ProductGrid />
</Suspense>
```

### ✅ Correct — Skeleton Fallback

```tsx
<Suspense fallback={<ProductGridSkeleton />}>
  <ProductGrid />
</Suspense>;

// ProductGridSkeleton.tsx
export function ProductGridSkeleton() {
  return (
    <div className='grid grid-cols-3 gap-4 animate-pulse'>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className='h-48 bg-gray-200 rounded-lg' />
      ))}
    </div>
  );
}
```

---

## Rule: PPR — Static Shell + Dynamic Islands

**Why it matters:** Partial Prerendering serves a static shell instantly from the edge, then streams dynamic content. This gives the best of static and dynamic rendering.

```tsx
// Enable in next.config.ts
// cacheComponents: true

// page.tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      {/* Static shell — prerendered at build time */}
      <header>
        <Logo />
        <Nav />
      </header>

      {/* Dynamic island — streamed on request */}
      <Suspense fallback={<CartSkeleton />}>
        <Cart />
      </Suspense>

      {/* Static footer */}
      <Footer />
    </div>
  );
}
```

---

## Rule: `loading.tsx` is a Route-Level Suspense Boundary

```tsx
// app/products/loading.tsx
export default function Loading() {
  return <ProductGridSkeleton />;
}

// app/products/page.tsx
export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductGrid products={products} />;
}
```

The `loading.tsx` file automatically wraps `page.tsx` in a Suspense boundary. Use it for route-level loading states; use inline `<Suspense>` for component-level granularity.

---

## References

- https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering
- https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
- https://react.dev/reference/react/Suspense
