# 🤝 Developer Onboarding & Contributing Guide

> **Developer Manual**: Engineering Guidelines, Code Style Conventions, Quality Standards, and Git Workflow  
> **Target Audience**: All Human Contributors & AI Engineering Agents  
> **Last Updated**: 2026-09-24

---

## 1. Quick Onboarding Checklist (First 5 Minutes)

1. **Verify Environment**: Ensure Node.js 22 LTS and pnpm 10.33+ are installed.
2. **Install Dependencies**:
   ```bash
   pnpm install
   ```
3. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase and OpenRouter keys (refer to [docs/ENVIRONMENT-SETUP.md](ENVIRONMENT-SETUP.md)).
4. **Verify Database Connectivity**:
   ```bash
   pnpm tsx scripts/test-db.ts
   ```
5. **Start Development Server**:
   ```bash
   pnpm dev
   ```

---

## 2. Non-Negotiable Coding Standards

All code committed to this repository must strictly adhere to the following senior engineering rules:

### 2.1 React 19 & Component Architecture

- **Arrow Function Syntax Only**:
  All React components MUST be declared as arrow functions with explicit TypeScript typing:

  ```typescript
  // ✅ CORRECT
  export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect }) => {
    return <article className="...">...</article>;
  };

  // ❌ FORBIDDEN
  export function ServiceCard(props: ServiceCardProps) {
    return <div>...</div>;
  }
  ```

- **Server Components by Default**:
  Components in `src/app/` are React Server Components (RSC) by default. Add `'use client'` strictly when state, hooks, or DOM listeners are required.
- **Image Optimization**:
  Always use `next/image` (`<Image />`) with explicit `alt`, `width`, `height`, or `fill` and responsive `sizes`. Never use raw `<img>` tags.

### 2.2 Next.js 16 & Edge Proxy Architecture

- **Strict No-Middleware Policy**:
  Do **NOT** create a `middleware.ts` file. In Next.js 16, edge proxy logic is centralized in `src/proxy.ts`.
- **CVE-2025-29927 Mitigation**:
  Any edge proxy modification must preserve the defensive header scrubbing:
  ```typescript
  if (request.headers.has("x-middleware-subrequest")) {
  	safeHeaders.delete("x-middleware-subrequest");
  }
  ```
- **Defense in Depth**:
  Authorization checks must be duplicated in Server Components and Server Actions. Never assume the proxy alone guarantees security.

### 2.3 Strict TypeScript & Robust Code

- **No `any` Type**:
  The use of `any` is strictly prohibited. Use precise interfaces or `unknown` combined with type guards.
- **Mandatory Error Handling**:
  Wrap all asynchronous calls, API endpoints, and Server Actions in `try/catch` blocks.
- **Never Leak Stack Traces**:
  Return user-friendly, localized error strings to client interfaces. Log raw system errors server-side only.

### 2.4 Modular Feature Architecture

- Organize domain logic under `src/features/{feature-name}/`.
- Feature directories should contain their own components, hooks, stores, and schemas:
  ```
  src/features/services/
  ├── components/
  ├── actions/
  ├── hooks/
  ├── schemas/
  └── index.ts         <-- Public API barrel file
  ```
- Cross-feature imports must import exclusively from the feature's `index.ts`.

### 2.5 Tailwind CSS v4 Gradient Syntax

- Tailwind CSS v4 introduces modern gradient syntax. Always use `bg-linear-to-*` instead of deprecated v3 classes:

  ```html
  <!-- ✅ CORRECT (Tailwind v4) -->
  <div class="bg-linear-to-r from-purple-900 to-black">...</div>
  <div class="bg-linear-45 from-purple-500 via-indigo-600 to-black">...</div>

  <!-- ❌ FORBIDDEN (Tailwind v3) -->
  <div class="bg-gradient-to-r from-purple-900 to-black">...</div>
  ```

### 2.6 Semantic HTML & Accessibility (A11y)

- Avoid unsemantic "div soup". Use semantic HTML5 elements: `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<article>`.
- Interactive elements (buttons, icon links, toggles) must include an accessible `aria-label`.

### 2.7 Clean Code & File Limits

- **300-Line Limit**: If any component or utility file approaches or exceeds 300 lines, proactively refactor it into smaller composable sub-modules.
- **Naming Conventions**:
  - Components: `PascalCase.tsx` (e.g. `AppointmentDetailModal.tsx`)
  - Utilities & Hooks: `camelCase.ts` (e.g. `useAssessment.ts`, `imageCompressor.ts`)
  - Schemas & Types: `camelCase.ts` or `kebab-case.ts`

---

## 3. Git Workflow & Safety Guidelines

> [!CAUTION]
> **No Auto-Commits Rule**:
> AI assistants and automated scripts must **never** execute `git commit` or `git push` autonomously. Always seek explicit user approval and instructions before staging, committing, or pushing code.

### 3.1 Branching Strategy

- `main`: Production-ready branch. Deployed automatically to Vercel production.
- Feature branches: `feature/<feature-name>` (e.g. `feature/service-image-upload`)
- Bugfix branches: `fix/<issue-description>` (e.g. `fix/calendar-date-timezone`)
- Documentation branches: `docs/<topic>` (e.g. `docs/api-reference`)

### 3.2 Commit Standards (`commitlint`)

All commits must adhere to Conventional Commits:

- `feat: add WhatsApp floating contact button`
- `fix: prevent appointment double booking race condition`
- `docs: update database schema reference for services`
- `refactor: extract validation graph state schemas`
- `style: apply tailwind v4 gradient syntax`
- `chore: bump dependencies in package.json`

### 3.3 Pre-Pull Request Verification Checklist

Before submitting a pull request, run the following verification sequence:

```bash
# 1. Verify TypeScript types
pnpm typecheck

# 2. Verify ESLint rules
pnpm lint

# 3. Verify code formatting
pnpm format:check

# 4. Run test suites
pnpm test
```

All four checks must exit with code 0 before requesting code review.
