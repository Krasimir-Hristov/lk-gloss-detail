# Routing & Layout Architecture (routing-)

## Rule: Layout Nesting — Shared UI Without Remounting

**Why it matters:** Layouts persist across navigations and don't remount. Put shared UI (nav, footer, sidebars) in layouts, not pages.

```
app/
├── layout.tsx          ← Root layout (html, body, global providers)
├── [locale]/
│   ├── layout.tsx      ← Locale layout (navbar, footer, i18n provider)
│   ├── page.tsx        ← Homepage
│   ├── services/
│   │   ├── layout.tsx  ← Services section layout (sidebar, breadcrumbs)
│   │   └── page.tsx    ← Services listing
│   └── admin/
│       ├── layout.tsx  ← Admin layout (admin nav, auth check)
│       └── page.tsx    ← Admin dashboard
```

---

## Rule: Parallel Routes for Slot-Based Layouts

**Why it matters:** Parallel routes (`@slot` convention) render multiple pages in the same layout simultaneously — perfect for dashboards with sidebars.

```
app/
├── layout.tsx
├── @sidebar/
│   └── page.tsx        ← Renders in the sidebar slot
├── @main/
│   └── page.tsx        ← Renders in the main slot
└── page.tsx            ← Default (children slot)
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  sidebar,
  main,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  main: React.ReactNode;
}) {
  return (
    <div className='flex'>
      {sidebar}
      {main}
      {children}
    </div>
  );
}
```

---

## Rule: Intercepting Routes for Modals

**Why it matters:** Intercepting routes render content from another route within the current layout — perfect for photo lightboxes, login modals, or detail views.

```
app/
├── gallery/
│   ├── page.tsx              ← Gallery grid
│   └── [id]/
│       └── page.tsx          ← Full photo page (direct navigation)
├── @modal/
│   ├── default.tsx           ← Empty (no modal by default)
│   └── (.)gallery/
│       └── [id]/
│           └── page.tsx      ← Photo modal (intercepted from gallery)
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
```

---

## Rule: Route Groups for Organization

**Why it matters:** Route groups `(folder)` organize routes without affecting the URL structure.

```
app/
├── (marketing)/
│   ├── page.tsx          ← /
│   ├── about/
│   │   └── page.tsx      ← /about
│   └── layout.tsx        ← Marketing layout (different from app)
├── (dashboard)/
│   ├── page.tsx          ← / (dashboard home)
│   ├── settings/
│   │   └── page.tsx      ← /settings
│   └── layout.tsx        ← Dashboard layout (sidebar, auth)
```

---

## Rule: Middleware for i18n Routing

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['de', 'en', 'el'];
const defaultLocale = 'de';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = locales.every(
    (locale) =>
      !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  if (pathnameIsMissingLocale) {
    // Detect from Accept-Language header or default
    const locale = defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Rule: Dynamic Routes with `generateStaticParams`

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // Next.js 16: params is a Promise
  const post = await getPost(slug);
  return <article>{post.content}</article>;
}
```

---

## References

- https://nextjs.org/docs/app/building-your-application/routing
- https://nextjs.org/docs/app/building-your-application/routing/parallel-routes
- https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes
