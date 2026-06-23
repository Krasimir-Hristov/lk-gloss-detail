# SEO & Metadata (seo-)

## Rule: Export Metadata from Layouts and Pages

**Why it matters:** The Metadata API generates `<title>`, `<meta>`, `<link>`, and OpenGraph tags automatically. It merges from parent layouts — child pages override parent fields.

```tsx
// app/layout.tsx — global defaults
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | LK Gloss & Detail',
    default: 'LK Gloss & Detail — Professionelle Autopflege',
  },
  description: 'Mobile Autopflege & Detailing in Neuhausen auf den Fildern',
  metadataBase: new URL('https://lkglossanddetail.de'),
};
```

```tsx
// app/services/page.tsx — page-specific
export const metadata: Metadata = {
  title: 'Unsere Leistungen',
  description:
    'Professionelle Autopflege-Dienstleistungen von Lulezim Kodhimaj',
};
// Result: <title>Unsere Leistungen | LK Gloss & Detail</title>
```

---

## Rule: Dynamic OG Images

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LK Gloss & Detail';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(90deg, #4b0082, #7b2dff)',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 64,
        fontFamily: 'Inter',
      }}
    >
      LK Gloss & Detail
    </div>,
    { width: 1200, height: 630 },
  );
}
```

---

## Rule: Sitemap Generation

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['de', 'en', 'el'];
  const pages = ['', '/services', '/gallery', '/contact', '/booking'];

  return locales.flatMap((locale) =>
    pages.map((page) => ({
      url: `https://lkglossanddetail.de/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'weekly' : ('monthly' as const),
      priority: page === '' ? 1 : 0.8,
    })),
  );
}
```

---

## Rule: Robots Configuration

```tsx
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://lkglossanddetail.de/sitemap.xml',
  };
}
```

---

## Rule: JSON-LD Structured Data

```tsx
// components/json-ld.tsx
export function LocalBusinessJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'LK Gloss & Detail',
    description: 'Mobile Autopflege & Detailing',
    telephone: '+49-XXX-XXXXXXX',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Neuhausen auf den Fildern',
      addressCountry: 'DE',
    },
  };

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Use in layout
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <LocalBusinessJsonLd />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Rule: `hreflang` for i18n SEO

```tsx
// app/[locale]/layout.tsx
export async function generateMetadata({ params }) {
  const { locale } = await params;

  return {
    alternates: {
      languages: {
        de: `/de`,
        en: `/en`,
        el: `/el`,
      },
    },
  };
}
```

---

## References

- https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
