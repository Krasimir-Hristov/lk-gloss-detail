# Server Components & Data Fetching (data-)

## Rule: Server Components by Default

**Why it matters:** Every `'use client'` directive adds JavaScript to the client bundle. Keeping components as Server Components reduces bundle size, improves FCP/LCP, and enables direct database/API access without exposing secrets.

### ❌ Incorrect — Unnecessary Client Component

```tsx
'use client';

import { useState, useEffect } from 'react';

export function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

**Problem:** Client-side fetch exposes API endpoint, adds waterfall (mount → fetch → render), increases bundle size.

### ✅ Correct — Async Server Component

```tsx
import { db } from '@/db';

export async function ProductList() {
  const products = await db.query('SELECT id, name FROM products');

  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

**Why:** Direct DB access, no API route needed, data fetched during SSR, zero client JS for this component.

---

## Rule: Co-locate Data Fetching

**Why it matters:** Fetching data in the component that needs it (not a parent) enables automatic request deduplication and parallel fetching by React.

### ❌ Incorrect — Prop Drilling Data

```tsx
// page.tsx — fetches ALL data
export default async function Page() {
  const user = await getUser();
  const products = await getProducts();
  const promotions = await getPromotions();

  return (
    <div>
      <UserHeader user={user} />
      <ProductGrid products={products} />
      <PromoBanner promotions={promotions} />
    </div>
  );
}
```

### ✅ Correct — Each Component Fetches Own Data

```tsx
// page.tsx — no data fetching, just composition
import { Suspense } from 'react'
import { UserHeader } from './user-header'
import { ProductGrid, ProductGridSkeleton } from './product-grid'
import { PromoBanner } from './promo-banner'

export default function Page() {
  return (
    <div>
      <UserHeader />
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
      <PromoBanner />
    </div>
  )
}

// user-header.tsx
export async function UserHeader() {
  const user = await getUser()
  return <header>{user.name}</header>
}

// product-grid.tsx
export async function ProductGrid() {
  const products = await getProducts()
  return <div>{products.map(...)}</div>
}
```

**Why:** React automatically deduplicates identical fetch requests. Components fetch in parallel. Suspense boundaries control loading granularity.

---

## Rule: Async Params in Next.js 16

**Why it matters:** In Next.js 16, `params`, `searchParams`, `cookies()`, and `headers()` are all Promises. Forgetting to `await` them causes runtime errors.

### ❌ Incorrect — Synchronous Access (Next.js 15 pattern)

```tsx
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params; // ❌ params is a Promise in Next.js 16
  return <div>Post: {slug}</div>;
}
```

### ✅ Correct — Async Access (Next.js 16)

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ✅ await the Promise
  return <div>Post: {slug}</div>;
}
```

---

## Rule: Fetch Caching Strategies

### Static (default — cached indefinitely)

```tsx
const data = await fetch('https://api.example.com/data');
// Same as: fetch(url, { cache: 'force-cache' })
```

### Dynamic (no cache — fresh every request)

```tsx
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});
```

### Time-based Revalidation (ISR)

```tsx
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }, // seconds
});
```

### On-demand Revalidation (after mutation)

```tsx
'use server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function updatePost(id: string) {
  await db.posts.update(id, data);
  revalidateTag(`post-${id}`); // revalidate specific tag
  revalidatePath('/blog'); // revalidate entire path
}
```

---

## References

- https://nextjs.org/docs/app/building-your-application/data-fetching
- https://nextjs.org/docs/app/building-your-application/rendering/server-components
- https://nextjs.org/docs/app/building-your-application/upgrading/version-16
