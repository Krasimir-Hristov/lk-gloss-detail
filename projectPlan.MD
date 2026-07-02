# LK Gloss & Detail — Project Plan

> Mobile Autopflege & Detailing | DE / EN / EL
> Last updated: 2026-06-23

---

## Legend

- `[ ]` Not started
- `[x]` Done
- `[-]` In progress
- `[!]` Blocked / needs info

---

## PHASE 0 — Setup & Tooling

### 0.1 Repository & Dev Environment

- [x] Create GitHub repo `lk-gloss-detail`
- [x] Init Next.js 16 app with `--turbopack` flag
- [x] Configure TypeScript strict mode (`tsconfig.json`)
- [x] Add `.nvmrc` (Node 22 LTS)
- [x] Setup `pnpm` as package manager
- [x] Add `.env.example` with all required keys (no real values)
- [x] Add `.gitignore` (Next.js + secrets)

### 0.2 VS Code Workspace

- [x] Add `.vscode/settings.json` (Copilot, formatting, path aliases)
- [x] Add `.vscode/extensions.json` (recommended extensions)
- [x] Add VS Code Copilot Skills (see `COPILOT_SKILLS/` folder)
- [x] Configure `@workspace` instructions for Copilot

### 0.3 Code Quality

- [x] Add `coderabbit.yaml` (AI code review config)
- [x] Add ESLint flat config (`eslint.config.mjs`) — Next.js + TS rules
- [x] Add Prettier (`.prettierrc`) — tabs 2, single quotes, trailing commas
- [x] Add Husky + lint-staged (pre-commit hooks)
- [x] Add `commitlint` (conventional commits)

### 0.4 Design System Bootstrap

- [x] Install shadcn/ui (`pnpm dlx shadcn@latest init`)
- [x] Configure Tailwind with LK brand tokens (purple palette, black bg)
- [x] Install Framer Motion (`motion`)
- [x] Add global CSS variables from brand color kit
- [x] Generate Stitch design prompts (see `STITCH_PROMPTS.md`)

---

## PHASE 1 — Database & Backend Foundation

### 1.1 Supabase Project Setup

- [x] Create Supabase project (`lk-gloss-detail`)
- [x] Enable `pgvector` extension (`CREATE EXTENSION vector;`)
- [-] Configure Row Level Security (RLS) policies _(per-table, done in Phase 1.2)_
- [x] Add publishable & secret keys to `.env`
- [x] Setup Supabase CLI (`supabase init`)
- [x] Add `supabase/migrations/` folder for version control

### 1.2 Database Schema — Core Tables

- [x] Create `profiles` table (admin user only)
- [x] Create `appointments` table (date, time, client_name, client_email, client_phone, vehicle, status, notes, car_assessment_id)
- [x] Create `blocked_slots` table (date, time, reason) — admin blocks manually
- [x] Create `services` table (JSONB name/description, pricing, duration, multipliers)
- [x] Create `car_assessments` table (images_urls[], ai_result JSONB, selected_services[], final_price_range, vehicle_size, dirt_level)
- [x] Create `gallery_images` table (url, title JSONB, category, before_url, after_url, sort_order)
- [x] Create `contact_submissions` table (name, email, phone, service_interest, message)

### 1.3 Database Schema — RAG Tables

- [x] Create `chatbot_knowledge` table (id, content, embedding vector(1536), metadata JSONB, language)
- [x] Create `service_vectors` table (id, service_id FK, content, embedding vector(1536), metadata JSONB)
- [x] Add `match_chatbot_docs` PostgreSQL function (cosine similarity search)
- [x] Add `match_service_vectors` PostgreSQL function (cosine similarity search)
- [x] Add indexes: `hnsw` on both vector columns (preferred over ivfflat)

### 1.4 Supabase Storage Buckets

- [x] Create `car-assessment-images` bucket (public: false, max 10MB per file)
- [x] Create `gallery` bucket (public: true)
- [x] Configure RLS policies for storage (assessment: admin only, gallery: public read + admin write)

---

---

## PHASE 2## PHASE 2 — Feature: i18n (Internationalization)

- [x] Install `next-intl`
- [x] Create `messages/de.json` — all German strings
- [x] Create `messages/en.json` — all English strings
- [x] Create `messages/el.json` — all Greek strings
- [x] Configure `i18n.ts` routing (default: `de`, locales: `de/en/el`)
- [x] Add locale switcher component (`LanguageSwitcher`)
- [x] Add `hreflang` meta tags for SEO
- [x] Test all 3 locales on all pages

---

## PHASE 3 — Feature: Layout & Navigation

### 3.1 Layout Shell

- [x] Create root layout (`app/[locale]/layout.tsx`)
- [x] Create `Navbar` component (logo, nav links, language switcher, CTA button)
- [x] Create `Footer` component (links, Impressum link, social, copyright)
- [x] Add mobile hamburger menu (animated with Framer Motion)
- [x] Implement sticky navbar with scroll behavior
- [x] Add `ScrollToTop` button

---

## PHASE 4 — Feature: Homepage (`/`)

- [x] Hero section (headline, subheadline, CTA buttons, animated car graphic)
- [x] Services preview section (3 cards, icons, brief descriptions — from `services` index)
- [x] "Why LK?" section (3 USPs with icons — mobile, professional, AI-powered)
- [x] How it works section (3 steps: upload photos → AI analysis → book appointment)
- [x] B2B & Fleet Management section (fleet discounts, contracts, priority service + contact CTA)
- [x] CTA section (book appointment banner)
- [x] Structured data: LocalBusiness JSON-LD
- [x] Mobile responsive review
- [x] Performance: lazy load images, next/image for all photos

---

## PHASE 5 — Feature: Services Page (`/services`)

- [ ] Create `src/features/services/data/services.index.ts` (array of service objects)
- [ ] Service card component (`ServiceCard`) — icon, title (i18n), description
- [ ] Services grid page layout
- [ ] Individual service detail expandable section (accordion)
- [ ] CTA per service → goes to AI Assessment flow
- [ ] Add service-specific JSON-LD schema

---

## PHASE 6 — Feature: AI Car Assessment (`/assessment`)

### 6.1 Multi-step Photo Upload Flow

- [ ] Create assessment wizard component (`AssessmentWizard`)
- [ ] Step 1: Front photo upload (drag & drop + mobile camera)
- [ ] Step 2: Rear photo upload
- [ ] Step 3: Left side photo upload
- [ ] Step 4: Right side photo upload
- [ ] Step 5: Interior photo upload
- [ ] Between each step: AI photo validation call
- [ ] Photo validation API route (`/api/assessment/validate-photo`)
  - [ ] Send image to vision model (GPT-4o via OpenRouter)
  - [ ] Prompt: classify if image matches expected angle (front/rear/side/interior)
  - [ ] Return: `{ valid: boolean, reason: string }`
- [ ] Error state: show message if wrong photo, allow retry
- [ ] Progress indicator (step 1/4, 2/4, etc.) with animations

### 6.2 Tinder-style Service Cards

- [ ] After all 5 photos pass: show service swipe cards
- [ ] `ServiceSwipeCard` component (service name, description, icon, price hint)
- [ ] Swipe right = accept, swipe left = reject (Framer Motion drag)
- [ ] Also show ✓ / ✗ buttons for mobile non-swipe fallback
- [ ] Track accepted/rejected services in state
- [ ] After last card: trigger AI Agent analysis

### 6.3 AI Agent — Price Estimation

- [ ] Create API route `/api/assessment/analyze`
- [ ] Agent receives: car images (as base64 or URLs), accepted services list
- [ ] Agent Step 1: Vision analysis — car size, dirt level, paint condition
- [ ] Agent Step 2: RAG lookup — query `service_vectors` for each accepted service
- [ ] Agent Step 3: Calculate price range using structured service data + dirt multiplier
- [ ] Agent Step 4: Generate friendly summary text (de/en/el based on locale)
- [ ] Return: `{ price_min, price_max, duration_hours, summary_text, services_breakdown }`
- [ ] Implement with LangChain + LangGraph (StateGraph with 4 nodes)
- [ ] Add LangSmith tracing

### 6.4 Results Display

- [ ] Results card component (price range, duration, summary text)
- [ ] Services breakdown accordion (what's included, what was skipped)
- [ ] Animated counter for price reveal
- [ ] CTA button → `/booking` (carry assessment ID in state/URL)
- [ ] Save assessment result to `car_assessments` table

---

## PHASE 7 — Feature: Booking / Appointments (`/booking`)

### 7.1 Booking Flow

- [ ] Step 1: Client info form (name, email, phone) — shadcn Form + React Hook Form + Zod
- [ ] Step 2: Date picker (calendar) — show only available dates
- [ ] Step 3: Time slot picker — show only available slots (not blocked)
- [ ] Step 4: Confirmation summary (selected service, date, time, price estimate)
- [ ] Step 5: Submit → create appointment in DB

### 7.2 Availability Logic

- [ ] API route `GET /api/booking/slots?date=YYYY-MM-DD`
  - [ ] Query `appointments` table for date (status != cancelled)
  - [ ] Query `blocked_slots` table for date
  - [ ] Return available hours (default: 08:00–18:00, every hour)
- [ ] API route `POST /api/booking/create`
  - [ ] Validate slot still free (race condition check)
  - [ ] Create appointment record
  - [ ] Send confirmation email via Resend
  - [ ] Return appointment ID + confirmation

### 7.3 Email Confirmation (Resend)

- [ ] Install `resend` package
- [ ] Create React Email template (`AppointmentConfirmation.tsx`)
- [ ] Template includes: date, time, services, estimated price, contact info
- [ ] Send to: client email + BCC to Lulezim's Gmail
- [ ] Setup Resend account (free tier: 3000 emails/month)

---

## PHASE 8 — Feature: RAG Chatbot (`/` — floating widget)

### 8.1 Chatbot UI

- [ ] Floating chat button (bottom right, animated)
- [ ] Chat drawer/modal component
- [ ] Message list with user/assistant bubbles
- [ ] Input field + send button
- [ ] Typing indicator animation
- [ ] Language: auto-detect from current locale

### 8.2 Chatbot Backend

- [ ] API route `POST /api/chatbot/message`
- [ ] Embed user question (OpenRouter embedding model)
- [ ] Query `chatbot_knowledge` table (cosine similarity, top 5 results)
- [ ] Build prompt: system + context chunks + conversation history (last 6 messages)
- [ ] Stream response from LLM (OpenRouter, Deepseek or similar)
- [ ] Return streamed text chunks (Server-Sent Events)

### 8.3 Chatbot Knowledge Base (Admin seeding)

- [ ] Script: `scripts/seed-chatbot.ts` — seed initial Q&A data
- [ ] Initial knowledge: services, prices, location, FAQ, contact info
- [ ] Admin can add/view/delete entries from Admin Dashboard

---

## PHASE 9 — Feature: Gallery (`/gallery`)

- [ ] Gallery grid layout (masonry or CSS grid)
- [ ] Before/After slider component (two images, draggable divider)
- [ ] Category filter tabs (Interior / Exterior / Paint Correction / etc.)
- [ ] Lightbox for full-size view
- [ ] Images loaded from `gallery` Supabase bucket
- [ ] Lazy loading + blur placeholder (next/image)
- [ ] Admin can upload/delete gallery images from dashboard

---

## PHASE 10 — Feature: Contact Page (`/contact`)

- [ ] Contact form (name, email, phone, message) — React Hook Form + Zod validation
- [ ] API route `POST /api/contact` → save to DB + email notification to Lulezim
- [ ] Google Maps embed (region: Neuhausen auf den Fildern)
- [ ] Contact details card (phone, email, WhatsApp link)
- [ ] WhatsApp floating button (wa.me link with pre-filled message)

---

## PHASE 11 — Feature: Impressum Page (`/impressum`)

- [ ] Static page with all legally required DE Impressum fields
  - [ ] Name des Diensteanbieters (Lulezim Kodhimaj)
  - [ ] Anschrift (to be filled when available)
  - [ ] Kontakt (Tel, Email)
  - [ ] Steuernummer / USt-IdNr. (to be filled)
  - [ ] Berufsbezeichnung (Autopflege / Fahrzeugaufbereitung)
  - [ ] Aufsichtsbehörde (if applicable)
  - [ ] EU-Streitschlichtung disclaimer
  - [ ] Haftung für Inhalte + Links disclaimer
  - [ ] Urheberrecht notice
- [ ] Add Datenschutzerklärung (GDPR Privacy Policy) as separate section or page
  - [ ] Cookie notice
  - [ ] Data processing info (contact form, booking)
  - [ ] Hosting provider info
  - [ ] AI processing disclosure (assessment feature)
- [ ] Cookie consent banner (required by DSGVO for DE)
  - [ ] Accept / Decline
  - [ ] Store preference in localStorage
  - [ ] Only load analytics if accepted

---

## PHASE 12 — Feature: Admin Dashboard (`/admin`)

### 12.1 Auth

- [ ] Supabase Auth — email/password for admin only
- [ ] Middleware: protect `/admin/*` routes
- [ ] Login page (`/admin/login`)
- [ ] Logout button

### 12.2 Appointments View

- [ ] Calendar view of all appointments (week/month toggle)
- [ ] List view with filters (date, status)
- [ ] Appointment detail modal (client info, services, AI estimate, car photos)
- [ ] Status update (pending → confirmed → completed / cancelled)
- [ ] Manual slot blocking: pick date + time → add to `blocked_slots`
- [ ] Delete/cancel appointment

### 12.3 Services Management

- [ ] List all services from DB
- [ ] Edit service (price ranges, duration, multipliers) — inline JSON editor
- [ ] Add new service
- [ ] Toggle service active/inactive (show/hide on site)

### 12.4 RAG Knowledge Base Management

- [ ] **Chatbot KB tab**: list all `chatbot_knowledge` entries (content + metadata)
- [ ] Add new entry (textarea → auto-embed → save)
- [ ] Delete entry (with confirmation modal)
- [ ] View embedding metadata

- [ ] **Service Vectors tab**: list all `service_vectors` entries
- [ ] Add new vector (structured form → auto-embed → save)
- [ ] Delete entry
- [ ] Trigger re-embed existing entry

### 12.5 Gallery Management

- [ ] Upload new gallery image (drag & drop)
- [ ] Set title (de/en/el) and category
- [ ] Delete image (removes from bucket + DB)
- [ ] Reorder images (drag to reorder)

### 12.6 Dashboard Overview

- [ ] Today's appointments widget
- [ ] Upcoming appointments (next 7 days)
- [ ] Total assessments this month
- [ ] Quick actions: block slot, add knowledge entry

---

## PHASE 13 — Feature: SEO & Performance

### 13.1 SEO Global Config

- [ ] Add `opengraph-image.tsx` (dynamic OG image generation)
- [ ] Add `robots.ts` (allow all, sitemap URL)
- [ ] Add `sitemap.ts` (all pages × 3 locales)
- [ ] Add `manifest.ts` (PWA manifest with LK favicon/icons)
- [ ] Add `<JsonLd>` component for LocalBusiness schema markup

### 13.2 Performance & Audits

- [ ] Audit Lighthouse score (target: 95+ all categories)
- [ ] Add `loading="lazy"` + `sizes` to all images
- [ ] Implement ISR for static-ish pages (gallery, services)
- [ ] Add structured data for every page type
- [ ] Verify `sitemap.xml` covers all locales × pages
- [ ] Submit sitemap to Google Search Console (when domain ready)
- [ ] Test Core Web Vitals (LCP < 2.5s, CLS < 0.1, FID < 100ms)
- [ ] Add `<link rel="preconnect">` for Supabase + OpenRouter

---

## PHASE 14 — Testing

- [ ] Unit tests: Zod schemas, price calculation logic
- [ ] Integration tests: booking slot availability API
- [ ] E2E tests (Playwright): assessment flow, booking flow, admin login
- [ ] Test all 3 locales manually
- [ ] Test mobile (iOS Safari, Android Chrome)
- [ ] Test photo validation AI (correct/incorrect photos)

---

## PHASE 15 — Deployment

- [ ] Deploy to Vercel (import from GitHub)
- [ ] Set all env variables in Vercel dashboard
- [ ] Configure Vercel regions (Frankfurt `fra1` — closest to DE users)
- [ ] Test production build
- [ ] Setup Vercel Analytics + Speed Insights
- [ ] Add domain when available (`lkglossanddetail.de` recommended)
- [ ] Configure Supabase auth redirect URLs for production domain
- [ ] Final Lighthouse audit on production

---

## DEPENDENCIES MAP

```
Phase 0 → Phase 1 → Phase 2 → Phase 3
                              ↓
                    Phase 4 (Homepage needs: 3)
                    Phase 5 (Services needs: 1.2, 2)
                    Phase 6 (Assessment needs: 1.2, 1.3, 1.4, 5)
                    Phase 7 (Booking needs: 1.2, 6)
                    Phase 8 (Chatbot needs: 1.3)
                    Phase 9 (Gallery needs: 1.4)
                    Phase 10 (Contact needs: 1.2)
                    Phase 11 (Impressum needs: 2, 3)
                    Phase 12 (Admin needs: ALL above)
                              ↓
                    Phase 13 → Phase 14 → Phase 15
```

---

## TECH STACK SUMMARY

| Layer               | Technology                             |
| ------------------- | -------------------------------------- |
| Frontend            | Next.js 16 (App Router, Turbopack)     |
| UI Components       | shadcn/ui + Tailwind CSS v4            |
| Animations          | Framer Motion (motion)                 |
| Forms               | React Hook Form + Zod                  |
| Client State        | Zustand (typed stores, Zod schemas)    |
| Server State        | TanStack Query (fetch/cache/refetch)   |
| i18n                | next-intl                              |
| Backend / DB        | Supabase (PostgreSQL + pgvector)       |
| Auth                | Supabase Auth                          |
| Storage             | Supabase Storage                       |
| AI Provider         | OpenRouter (vision + embeddings + LLM) |
| AI Framework        | LangChain + LangGraph                  |
| AI Tracing          | LangSmith                              |
| Transactional Email | Resend + React Email                   |
| Deployment          | Vercel (Frankfurt region)              |
| Code Review         | CodeRabbit                             |
| Analytics           | Vercel Analytics                       |

---

## BRAND COLORS (from ChatGPT brand kit)

```css
/* Μωβ Metallic Gradient */
--color-purple-dark: #4b0082;
--color-purple-base: #7b2dff;
--color-purple-medium: #a855f7;
--color-purple-highlight: #d8b4fe;

/* Backgrounds */
--color-bg-black: #000000;
--color-bg-dark: #121212;

/* Text */
--color-text-white: #ffffff;
--color-text-silver: #e5e7eb;

/* Neon Glow */
--color-glow-purple: #c026ff;
--color-glow-light: #e879f9;

/* Gradients */
--gradient-logo: linear-gradient(90deg, #4b0082, #7b2dff, #d8b4fe, #7b2dff);
--gradient-lines: linear-gradient(90deg, #7b2dff, #c026ff, #e879f9);
```
