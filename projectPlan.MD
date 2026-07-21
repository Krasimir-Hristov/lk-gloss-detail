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

- [x] Create `src/features/services/data/services.index.ts` (array of service objects)
- [x] Service card component (`ServiceCard`) — icon, title (i18n), description
- [x] Services grid page layout
- [x] Individual service detail expandable section (accordion)
- [x] CTA per service → goes to AI Assessment flow
- [x] Add service-specific JSON-LD schema
- [ ] Refactor services page to fetch services dynamically from Supabase DB
- [ ] Render service images loaded from Supabase Storage instead of static local imports

---

## PHASE 6 — Feature: Ephemeral AI Car Assessment (`/assessment`)

### 6.1 Multi-step Photo Upload Flow (Stream & Forget)

- [x] **Privacy-First Validation API (`/api/assessment/validate-photo`)**
  - [x] Accept raw image as `base64` string in the payload.
  - [x] Stream base64 directly to gemini via OpenRouter without saving it anywhere (No DB, No Storage, No Local Logs).
  - [x] **Node: `validate_image_angle`**
    - [x] Prompt model to verify the angle (front/rear/side/interior).
    - [x] Return: `{ valid: boolean, reason: string }`.
- [x] **Frontend Step Management**
  - [x] Keep images strictly in the browser's temporary memory (`RAM`) via Zustand during the 4 steps.
  - [x] If a step fails validation, allow the user to overwrite that specific base64 slot.

### 6.2 Tinder-style Service Cards

- [x] **Fetch Active Catalog**
  - [x] Retrieve available services (IDs, icons, localized strings) from the Supabase `services` table to render cards.
- [x] **Swipe Interaction**
  - [x] Swipe right = push service ID into frontend Zustand array.
  - [x] Swipe left = skip.

### 6.3 AI Agent — Stateless Estimation (LangGraph Node Workflow)

- [x] **API Endpoint `/api/assessment/analyze`**
  - [x] Receives: `base64_images[]`, `accepted_service_ids[]`, `locale`.
- [x] **Stateless LangGraph Implementation**
  - [x] **Node 1: `vision_car_analysis`** — Pass the 4 base64 images to GPT-4o in a single query.
    - [x] Extract structured JSON only: `car_size` (small/medium/large), `dirty_level` (low/medium/high), `brand`.
    - [x] _Immediate Action:_ Drop the base64 data from backend memory as soon as this node completes.
  - [x] **Node 2: `fetch_db_pricing`** — Query Supabase `services` table using `.in('id', accepted_service_ids)` to get raw pricing configurations.
  - [x] **Node 3: `deterministic_calculator`** — Pure TypeScript logic. Map extracted `car_size` to the database prices. Scale `duration_hours` using the extracted `dirty_level` as a multiplier.
  - [x] **Node 4: `generate_localized_summary`** — Use LLM to output 1-2 punchy CTA sentences based on the computed metrics and user `locale` (`de`/`en`/`el`).
- [x] **Return Clean Payload**
  - [x] Return finalized schema: `{ car_size, dirty_level, brand, price_min, price_max, duration_hours_min, duration_hours_max, summary_text }`.

### 6.4 Results Display — AI Analysis Report

- [x] **Design-Faithful Report Component**
  - [x] Header with "Analysis Report" title, brand/vehicle info, and sparkle icon
  - [x] AI Diagnostics section — 3-5 structured findings (title + description) from LLM
  - [x] Expert Verdict section — styled quote box with purple accent
  - [x] Investment card — price range €X – €Y with gradient background
  - [x] Timeline card — estimated duration in hours
  - [x] "Book Appointment" CTA button with gradient + hover glow effect
- [x] **No Car Image Display** (explicitly excluded per design)
- [x] **No PDF Export Button** (explicitly excluded per design)
- [x] **Wipe Browser Memory**
  - [x] Purge the base64 images from the frontend Zustand store entirely upon mounting the results page to guarantee complete data destruction.
- [x] **Data-Light Booking Link**
  - [x] "Book Appointment" CTA routes to `/booking`.
- [x] **Structured LLM Output**
  - [x] Updated LangGraph `generate_localized_summary` node to produce JSON: `{ summaryText, diagnostics[], expertVerdict }`
  - [x] Added `AssessmentDiagnostic` schema (title + description) to Zod validation
  - [x] Added `diagnostics` and `expertVerdict` fields to `AssessmentResultSchema`
- [x] **i18n** — Added `report.*` and `result.carSizes.*` keys to de/en/el messages

## PHASE 7 — Feature: Direct Booking (/booking)

> Simplified flow: no email verification, no Resend, no double opt-in.
> Booking is written directly to `appointments`. User sees a success screen
> with the message that we will contact them on the provided email/phone.

### 7.1 Database Migrations (Supabase)

- [x] Create `blocked_dates` table:
  - `id` (uuid, primary key)
  - `blocked_date` (date, UNIQUE, not null)
  - `reason` (text)
  - `created_at` (timestamptz)

- [x] Create `appointments` table:
  - `id` (uuid, primary key)
  - `first_name` (text, not null)
  - `last_name` (text, not null)
  - `email` (text, not null)
  - `phone` (text, not null)
  - `car_description` (text)
  - `booking_date` (date, UNIQUE, not null) — one full-day appointment per date
  - `status` (text, default 'confirmed')
  - `created_at` (timestamptz)

- [x] Create `appointment_services` junction table:
  - `appointment_id` (uuid, FK → appointments ON DELETE CASCADE)
  - `service_id` (uuid, FK → services ON DELETE CASCADE)
  - PK: (`appointment_id`, `service_id`)

- [x] RLS policies:
  - `blocked_dates`: public read, admin full access
  - `appointments`: public read + insert, admin full access
  - `appointment_services`: public insert, admin full access

- [x] Indexes:
  - `idx_appointments_booking_date`
  - `idx_blocked_dates_blocked_date`

### 7.2 Frontend State & Form (Zustand + Zod)

- [x] Setup `useBookingStore` Zustand store:
  - Holds multi-step form state and selected service IDs
  - Validates each step before allowing forward navigation
  - Reads `?services=` query param from assessment report to pre-select services

- [x] Step 1 — Client Info & Car Notes:
  - Fields: first name, last name, email, phone, car description
  - Checkbox: GDPR / Terms acceptance (required `true`)
  - Strict Zod validation

- [x] Step 2 — Services Selection:
  - Fetch active services from existing `services` table
  - Multi-select checkboxes
  - Pre-select services passed from assessment report via URL query params

- [x] Step 3 — Date Picker:
  - shadcn Calendar component
  - Disable unavailable dates from `appointments` + `blocked_dates`
  - Full-day selection only

- [x] Step 4 — Summary & Submit:
  - Review all data
  - Button "Termin verbindlich buchen" → calls `createBooking` Server Action

### 7.3 Backend Logic (Next.js API)

- [x] `GET /api/booking/unavailable-dates`
  - Returns merged unavailable dates from `appointments` and `blocked_dates`

- [x] `POST /api/booking/create`
  - Zod validation
  - Check if date is already booked or blocked
  - Race-condition-safe INSERT using `booking_date` UNIQUE constraint
  - Insert selected services into `appointment_services`
  - Return 201 with created appointment or 409 if date was just taken

### 7.4 Success Screen

- [x] `/booking/success` page:
  - "Termin erfolgreich gebucht!"
  - "Wir werden uns in Kürze bei Ihnen melden."
  - Display provided email and phone
  - CTA back to homepage

### 7.5 i18n

- [x] Add `Booking.*` keys to `messages/de.json`, `messages/en.json`, `messages/el.json`
  - Step labels, form fields, validation errors, success/error messages

### 7.6 Integration with Assessment Report

- [x] Update `assessment-report.tsx` "Book Appointment" CTA:
  - Pass accepted service IDs via `?services=id1,id2,id3` query params
  - Booking wizard pre-selects those services in Step 2

## PHASE 8 — Feature: RAG Chatbot (`/` — floating widget)

### 8.1 Chatbot UI

- [x] Floating chat button (bottom right, animated)
- [x] Chat drawer/modal component
- [x] Message list with user/assistant bubbles
- [x] Input field + send button
- [x] Typing indicator animation
- [x] Language: auto-detect from current locale

### 8.2 Chatbot Backend

- [x] API route `POST /api/chatbot/message`
- [x] Embed user question (OpenRouter embedding model)
- [x] Query `chatbot_knowledge` table (cosine similarity, top 5 results)
- [x] Build prompt: system + context chunks + conversation history (last 6 messages)
- [x] Stream response from LLM (OpenRouter, Deepseek or similar)
- [x] Return streamed text chunks (Server-Sent Events)

### 8.3 Chatbot Knowledge Base (Admin seeding)

- [x] Script: `scripts/seed-chatbot.ts` — seed initial Q&A data
- [x] Initial knowledge: services, prices, location, FAQ, contact info
- [ ] Admin can add/view/delete entries from Admin Dashboard

---

## PHASE 9 — Feature: Contact Page (`/contact`)

- [x] Contact form (name, email, phone, message) — React Hook Form + Zod validation
- [x] API route `POST /api/contact` → save to DB + email notification to Lulezim
- [x] Google Maps embed (region: Neuhausen auf den Fildern)
- [x] Contact details card (phone, email, WhatsApp link)
- [x] WhatsApp floating button (wa.me link with pre-filled message)

---

## PHASE 10 — Feature: Impressum Page (`/impressum`)

- [x] Static page with all legally required DE Impressum fields
  - [x] Name des Diensteanbieters (Lulezim Kodhimaj)
  - [x] Anschrift (to be filled when available)
  - [x] Kontakt (Tel, Email)
  - [x] Steuernummer / USt-IdNr. (to be filled)
  - [x] Berufsbezeichnung (Autopflege / Fahrzeugaufbereitung)
  - [x] Aufsichtsbehörde (if applicable)
  - [x] EU-Streitschlichtung disclaimer
  - [x] Haftung für Inhalte + Links disclaimer
  - [x] Urheberrecht notice
- [x] Add Datenschutzerklärung (GDPR Privacy Policy) as separate section or page
  - [x] Cookie notice
  - [x] Data processing info (contact form, booking)
  - [x] Hosting provider info
  - [x] AI processing disclosure (assessment feature)
- [x] Cookie consent banner (required by DSGVO for DE)
  - [x] Accept / Decline
  - [x] Store preference in localStorage
  - [x] Only load analytics if accepted

---

## PHASE 11 — Feature: Admin Dashboard (`/admin`)

### 11.1 Auth

- [x] Supabase Auth — email/password for admin only
- [x] Proxy.ts: protect `/admin/*` routes
- [x] Login page (`/admin/login`)
- [x] Logout button only visible on /admin/\* pages

### 11.2 Appointments View

- [x] Calendar view of all appointments (week/month toggle)
- [x] List view with filters (date, status)
- [x] Appointment detail modal (client info, services)
- [x] Status update (pending → confirmed → completed / cancelled)
- [x] Manual date blocking: select date → add to `blocked_dates`
- [x] Delete/cancel/edit appointment.

### 11.3 Services Management full CRUD operations

- [x] List all services from DB
- [x] Edit service (price ranges, duration, multipliers) — inline JSON editor
- [x] Add new service
- [x] Toggle service active/inactive (show/hide on site)
- [x] Set up Supabase Storage bucket for service images
- [x] Add image upload / delete functionality to Add/Edit service forms (saving to Supabase Storage)
- [x] Support deletion of service (including its images from storage)

### 11.4 RAG Knowledge Base Management

- [ ] **Chatbot KB tab**: list all `chatbot_knowledge` entries (content + metadata)
- [ ] Add new entry (textarea → auto-embed → save)
- [ ] Delete entry (with confirmation modal)
- [ ] View embedding metadata

- [ ] **Service Vectors tab**: list all `service_vectors` entries
- [ ] Add new vector (structured form → auto-embed → save)
- [ ] Delete entry
- [ ] Trigger re-embed existing entry

### 11.6 Dashboard Overview

- [ ] Today's appointments widget
- [ ] Upcoming appointments (next 7 days)
- [ ] Total assessments this month
- [ ] Quick actions: block slot, add knowledge entry

---

## PHASE 12 — Feature: SEO & Performance

### 12.1 SEO Global Config

- [ ] Add `opengraph-image.tsx` (dynamic OG image generation)
- [ ] Add `robots.ts` (allow all, sitemap URL)
- [ ] Add `sitemap.ts` (all pages × 3 locales)
- [ ] Add `manifest.ts` (PWA manifest with LK favicon/icons)
- [ ] Add `<JsonLd>` component for LocalBusiness schema markup

### 12.2 Performance & Audits

- [ ] Audit Lighthouse score (target: 95+ all categories)
- [ ] Add `loading="lazy"` + `sizes` to all images
- [ ] Implement ISR for static-ish pages (gallery, services)
- [ ] Add structured data for every page type
- [ ] Verify `sitemap.xml` covers all locales × pages
- [ ] Submit sitemap to Google Search Console (when domain ready)
- [ ] Test Core Web Vitals (LCP < 2.5s, CLS < 0.1, FID < 100ms)
- [ ] Add `<link rel="preconnect">` for Supabase + OpenRouter

---

## PHASE 13 — Testing

- [ ] Unit tests: Zod schemas, price calculation logic
- [ ] Integration tests: booking slot availability API
- [ ] E2E tests (Playwright): assessment flow, booking flow, admin login
- [ ] Test all 3 locales manually
- [ ] Test mobile (iOS Safari, Android Chrome)
- [ ] Test photo validation AI (correct/incorrect photos)

---

## PHASE 14 — Deployment

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
                     Phase 9 (Contact needs: 1.2)
                     Phase 10 (Impressum needs: 2, 3)
                     Phase 11 (Admin needs: ALL above)
                               ↓
                     Phase 12 (SEO needs: ALL above)
                               ↓
                     Phase 13 → Phase 14
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
