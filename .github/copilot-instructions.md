# LK Gloss & Detail — Copilot Workspace Instructions

> Auto-generated: 2026-06-23
> Project: Mobile Autopflege & Detailing Service (DE/EN/EL)

---

## 🎯 Project Overview

**LK Gloss & Detail** is a German mobile car detailing service website with AI-powered car assessment. Users upload car photos, AI analyzes condition and estimates pricing, then users book appointments.

- **Production URL**: (TBD — `lkglossanddetail.de`)
- **GitHub**: `Krasimir-Hristov/lk-gloss-detail`
- **Hosting**: Vercel (Frankfurt `fra1`)
- **Database**: Supabase (PostgreSQL + pgvector)

---

## 🧠 AI Assistant Behavior

### Always Follow These Rules

1. **Read skills before coding** — When working with Next.js, LangChain, LangGraph, or Supabase, read the corresponding skill file in `.agents/skills/` first.
2. **Server Components by default** — All components are React Server Components unless they need `use client` (interactivity, state, effects, browser APIs).
3. **TypeScript strict mode** — No `any` types. Use Zod schemas for runtime validation. All props must be typed.
4. **i18n-first** — Every user-facing string goes through `next-intl`. Three locales: `de` (default), `en`, `el`.
5. **Dark mode only** — The app is dark-themed. No light mode toggle needed.
6. **Mobile-first responsive** — Test all components at 320px, 768px, 1280px.
7. **No API routes for mutations** — Use Server Actions (`"use server"`) for form submissions and data mutations.
8. **Stream AI responses** — All LLM responses must be streamed via Server-Sent Events, never blocking.

### Code Style

- **Imports**: Use `@/` path alias for all internal imports
- **Components**: `kebab-case` for files, `PascalCase` for component names
- **Functions**: `camelCase` for utilities, `PascalCase` for components/classes
- **File structure**: Feature-based organization under `src/features/`
- **Exports**: Named exports preferred over default exports for utilities

---

## 📁 Project Structure

```
src/
├── app/
│   ├── [locale]/              # i18n routing (de/en/el)
│   │   ├── layout.tsx         # Root layout (Server Component)
│   │   ├── page.tsx           # Homepage
│   │   ├── services/          # Services listing
│   │   ├── assessment/        # AI car assessment flow
│   │   ├── booking/           # Appointment booking
│   │   ├── gallery/           # Before/after gallery
│   │   ├── contact/           # Contact form
│   │   ├── impressum/         # Legal (DE required)
│   │   └── admin/             # Admin dashboard (protected)
│   ├── api/                   # API routes (only for streaming/chatbot)
│   └── actions/               # Server Actions
├── features/                  # Feature-based modules
│   ├── services/              # Service data & components
│   ├── assessment/            # AI assessment logic
│   ├── booking/               # Booking logic
│   ├── chatbot/               # RAG chatbot
│   └── admin/                 # Admin features
├── components/                # Shared UI components
│   ├── ui/                    # shadcn/ui components
│   ├── layout/                # Navbar, Footer, etc.
│   └── shared/                # Reusable components
├── lib/                       # Utilities & configs
│   ├── supabase/              # Supabase client & helpers
│   ├── ai/                    # LangChain/LangGraph setup
│   └── i18n/                  # next-intl config
└── styles/                    # Global styles
```

---

## 🎨 Design System

### Brand Colors (from Stitch Design)

```css
/* Primary Purple Palette */
--primary: #d1bcff;
--primary-container: #7b2dff;
--on-primary: #3d008f;
--on-primary-container: #ece0ff;

/* Secondary Pink-Purple */
--secondary: #ebb2ff;
--secondary-container: #b303f2;

/* Tertiary Soft Purple */
--tertiary: #dbb8ff;

/* Surfaces (Dark) */
--surface: #131313;
--surface-container: #201f1f;
--surface-container-high: #2a2a2a;
--surface-container-highest: #353534;

/* Text */
--on-surface: #e5e2e1;
--on-surface-variant: #ccc3d9;

/* Brand Gradient */
--gradient-brand: linear-gradient(90deg, #4b0082, #7b2dff, #d8b4fe, #7b2dff);
```

### Typography (from Stitch Design)

- **Headlines**: Montserrat (600-800 weight)
  - Display: 64px / 800
  - Headline LG: 40px / 700
  - Headline MD: 24px / 600
- **Body**: Inter (400 weight)
  - Body LG: 18px
  - Body MD: 16px
- **Labels**: Inter (700 weight, 12px, 0.1em letter-spacing)

### Spacing (8px base)

- Container max-width: 1280px
- Section gap: 120px
- Desktop margin: 64px
- Mobile margin: 16px
- Gutter: 24px

### Component Library

- **shadcn/ui** with Tailwind CSS v4
- **Framer Motion** for animations
- Dark theme only (Material Design 3 color system)
- Rounded corners: `ROUND_FOUR` (medium)

---

## 🗄️ Database (Supabase)

### Core Tables

- `profiles` — Admin user
- `appointments` — Client bookings
- `blocked_slots` — Admin time blocks
- `services` — Service catalog with pricing
- `car_assessments` — AI assessment results
- `gallery_images` — Before/after photos
- `contact_submissions` — Contact form entries

### RAG Tables (pgvector)

- `chatbot_knowledge` — FAQ embeddings (vector 1536)
- `service_vectors` — Service description embeddings (vector 1536)

### Storage Buckets

- `car-assessment-images` (private)
- `gallery` (public)

### Key Rules

- **Always use RLS policies** — Never expose tables without Row Level Security
- **Use Supabase SSR client** — `@supabase/ssr` for Next.js App Router
- **Migrations via Supabase CLI** — `supabase migration new`

---

## 🤖 AI Stack

### LangChain.js

- Chat models via OpenRouter (GPT-4o, Claude)
- Embeddings for RAG (OpenRouter embedding model)
- Tools with Zod schemas for function calling
- Streaming with `for await...of`

### LangGraph.js

- StateGraph for multi-step workflows
- Checkpointing via PostgreSQL (Supabase)
- Human-in-the-loop with `interrupt()`
- Custom streaming with `config.writer()`

### Key AI Features

1. **Photo Validation** — Vision model checks if uploaded photo matches expected angle
2. **Car Assessment** — Multi-step agent: vision analysis → RAG lookup → price calculation → summary
3. **RAG Chatbot** — Cosine similarity search on `chatbot_knowledge` + streaming LLM response

---

## 📦 Key Dependencies

```json
{
  "next": "16.x",
  "react": "19.x",
  "typescript": "5.x",
  "tailwindcss": "4.x",
  "framer-motion": "latest",
  "next-intl": "latest",
  "@supabase/supabase-js": "latest",
  "@supabase/ssr": "latest",
  "@langchain/core": "latest",
  "@langchain/langgraph": "latest",
  "@langchain/openai": "latest",
  "zod": "latest",
  "react-hook-form": "latest",
  "resend": "latest",
  "@react-email/components": "latest"
}
```

---

## 🔗 Available Skills

When working with specific technologies, read the corresponding skill:

| Skill                    | Path                                                       | When to Use                   |
| ------------------------ | ---------------------------------------------------------- | ----------------------------- |
| Next.js Best Practices   | `.agents/skills/nextjs-best-practices/SKILL.md`            | Any Next.js code              |
| LangChain Best Practices | `.agents/skills/langchain-best-practices/SKILL.md`         | LLM chains, tools, RAG        |
| LangGraph Best Practices | `.agents/skills/langgraph-best-practices/SKILL.md`         | Agent workflows, state graphs |
| Supabase                 | `.agents/skills/supabase/SKILL.md`                         | Database, auth, storage       |
| Supabase Postgres        | `.agents/skills/supabase-postgres-best-practices/SKILL.md` | SQL queries, schema design    |

---

## 🚫 Never Do This

- ❌ Use `any` type in TypeScript
- ❌ Create API routes for form submissions (use Server Actions)
- ❌ Block the main thread with AI calls (always stream)
- ❌ Hardcode strings — use i18n keys
- ❌ Skip RLS policies on Supabase tables
- ❌ Use Pages Router (`/pages`) — App Router only
- ❌ Import `use client` unnecessarily — Server Components first
- ❌ Forget to handle loading/error states
- ❌ Use `fetch` directly for Supabase — use the Supabase client

---

## ✅ Always Do This

- ✅ Read relevant skill file before writing framework-specific code
- ✅ Use Zod schemas for all form validation and API inputs
- ✅ Add loading skeletons for async components
- ✅ Add error boundaries for client components
- ✅ Use `next/image` for all images (with `priority` for above-fold)
- ✅ Add `hreflang` tags for i18n pages
- ✅ Test on mobile viewport (320px minimum)
- ✅ Use semantic HTML (`<main>`, `<nav>`, `<article>`, `<section>`)
- ✅ Add structured data (JSON-LD) for SEO

---

## 📋 Current Phase

**Phase 0 — Setup & Tooling** (in progress)

- ✅ GitHub repo created
- ✅ Dependencies installed
- ✅ VS Code Copilot Skills created
- ✅ Stitch design exported
- 🔄 `@workspace` instructions (this file)
- ⬜ ESLint, Prettier, Husky
- ⬜ shadcn/ui init with brand tokens

---

_This file is referenced by GitHub Copilot as `@workspace` context. Update it as the project evolves._
