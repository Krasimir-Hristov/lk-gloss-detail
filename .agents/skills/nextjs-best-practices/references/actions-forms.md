# Server Actions & Forms (actions-)

## Rule: Server Actions for Mutations, Not API Routes

**Why it matters:** Server Actions provide progressive enhancement — forms work before JavaScript loads. They integrate natively with React's `useActionState` and `useOptimistic` for pending states and optimistic updates.

### ❌ Incorrect — API Route + Client Fetch

```tsx
'use client';

export function SignupForm() {
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // ...
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### ✅ Correct — Server Action

```tsx
// app/actions/auth.ts
'use server';

export async function signup(prevState: any, formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  const result = schema.safeParse({ email, password });
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await createUser(email, password);
  revalidatePath('/dashboard');
  return { success: true };
}

// app/signup/page.tsx
('use client');
import { useActionState } from 'react';
import { signup } from '@/app/actions/auth';

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {});

  return (
    <form action={action}>
      <input name='email' type='email' required />
      {state.errors?.email && <p>{state.errors.email}</p>}
      <input name='password' type='password' required />
      {state.errors?.password && <p>{state.errors.password}</p>}
      <button disabled={pending}>
        {pending ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

---

## Rule: `useActionState` Signature in Next.js 16

**Why it matters:** Server Actions used with `useActionState` must accept `prevState` as the first parameter.

```tsx
// ✅ Correct signature
'use server';
export async function myAction(prevState: any, formData: FormData) {
  // prevState is the previous return value from useActionState
  // formData is the submitted form data
  return { message: 'Done' };
}

// ❌ Incorrect — missing prevState
('use server');
export async function myAction(formData: FormData) {
  // This works for direct form action={myAction} but NOT with useActionState
}
```

---

## Rule: Optimistic Updates with `useOptimistic`

```tsx
'use client';
import { useOptimistic } from 'react';
import { toggleTodo } from './actions';

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, id: string) =>
      state.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  );

  async function handleToggle(id: string) {
    addOptimistic(id); // instant UI update
    await toggleTodo(id); // server sync
  }

  return optimisticTodos.map((todo) => (
    <div key={todo.id} onClick={() => handleToggle(todo.id)}>
      {todo.done ? '✅' : '⬜'} {todo.text}
    </div>
  ));
}
```

---

## Rule: Revalidate After Mutation

Always revalidate affected data after a Server Action mutation:

```tsx
'use server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function createPost(formData: FormData) {
  await db.posts.create({ title: formData.get('title') });

  // Revalidate the list page
  revalidatePath('/posts');

  // Or revalidate specific tags
  revalidateTag('posts');
}
```

---

## Rule: Error Handling in Server Actions

```tsx
'use server';

export async function deletePost(id: string) {
  try {
    await db.posts.delete(id);
    revalidateTag('posts');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Unauthorized' };
    }
    return { error: 'Failed to delete post' };
  }
}
```

---

## References

- https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- https://react.dev/reference/react/useActionState
- https://react.dev/reference/react/useOptimistic
