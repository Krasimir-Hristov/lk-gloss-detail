# TypeScript & Code Quality (ts-)

## Rule: Strict TypeScript Configuration

**Why it matters:** Strict mode catches bugs at compile time. Enable all strict checks for maximum type safety.

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## Rule: Type-Safe Route Params

```tsx
// app/blog/[slug]/page.tsx
interface PageProps {
  params: Promise<{ slug: string }>; // Next.js 16: params is Promise
  searchParams: Promise<{ page?: string }>; // Next.js 16: searchParams is Promise
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  // ...
}
```

---

## Rule: Type-Safe Server Actions

```tsx
'use server';

import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  published: z.boolean().default(false),
});

type CreatePostInput = z.infer<typeof CreatePostSchema>;
type ActionState = { errors?: Record<string, string[]>; success?: boolean };

export async function createPost(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const result = CreatePostSchema.safeParse(raw);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await db.posts.create(result.data);
  revalidatePath('/posts');
  return { success: true };
}
```

---

## Rule: Path Aliases for Clean Imports

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/features/*": ["./src/features/*"]
    }
  }
}
```

```tsx
// ✅ Clean imports
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getServices } from '@/features/services/data';

// ❌ Relative path hell
import { Button } from '../../../components/ui/button';
```

---

## Rule: `satisfies` for Config Objects

```tsx
import type { Metadata } from 'next';

// ✅ satisfies ensures the object matches Metadata type
export const metadata = {
  title: 'Services',
  description: 'Our services',
} satisfies Metadata;
```

---

## Rule: Discriminated Unions for Async States

```tsx
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Usage in Server Components
export default async function Page() {
  try {
    const data = await fetchData();
    return <DataView data={data} />;
  } catch (error) {
    return <ErrorView message='Failed to load data' />;
  }
}
```

---

## Rule: ESLint Flat Config (Next.js 16)

```js
// eslint.config.mjs
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
```

---

## References

- https://nextjs.org/docs/app/building-your-application/configuring/typescript
- https://nextjs.org/docs/app/api-reference/config/eslint
- https://www.typescriptlang.org/tsconfig#strict
