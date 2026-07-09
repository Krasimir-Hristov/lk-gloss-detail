# Phase 7 — Full-Day Booking (`/booking`)

> **TL;DR**: 4-step wizard (Client Info → Services → Date → Summary). Direct booking to Supabase with UNIQUE constraint on `booking_date` — one confirmed booking per day. No email confirmation.

---

## 📁 File Map — What Every File Does

| File                                                           | What it does                                                                                                                                                                                                                      |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/booking/schemas/booking.schema.ts`               | Zod schemas for validating each wizard step (`step1Schema`, `step2Schema`) and the API request body (`createBookingSchema`). Error messages are i18n keys.                                                                        |
| `src/features/booking/stores/booking-store.ts`                 | Zustand store holding all wizard state: step number, client info fields, selected service IDs, booking date, submit state, field errors. `setPreselectedServices()` reads `?services=` from URL and auto-skips Step 2.            |
| `src/features/booking/components/booking-wizard.tsx`           | **Outer:** `<Suspense>` wrapper (required because `useSearchParams()` triggers CSR bailout). **Inner:** `BookingWizardContent` reads `?services=` URL param, preselects services, renders current step with animated transitions. |
| `src/features/booking/components/booking-progress.tsx`         | 4-step progress bar (User → Wrench → Calendar → Clipboard). Current step glows purple, completed steps show green checkmarks. Lines animate with Framer Motion.                                                                   |
| `src/features/booking/components/step-client-info.tsx`         | **Step 1.** Form with firstName, lastName, email, phone, carDescription (optional), GDPR checkbox. Local `formData` state for performance. Validates with `step1Schema` — field errors shown as red text.                         |
| `src/features/booking/components/step-services.tsx`            | **Step 2.** Fetches services from `/api/services` via TanStack Query. Renders checkbox cards. Validates at least 1 selected. Shows loading/error states. **Skipped if `?services=` was provided.**                                |
| `src/features/booking/components/step-date-picker.tsx`         | **Step 3.** Fetches unavailable dates from `GET /api/booking/unavailable-dates`. Renders shadcn `<Calendar>`. Disables past dates + unavailable dates.                                                                            |
| `src/features/booking/components/step-summary.tsx`             | **Step 4.** 3 glass-morphism cards: client data, selected services (fetches names), date. Submit sends `POST /api/booking/create`. Handles 409 (date taken), 201 (success → redirect).                                            |
| `src/features/booking/index.ts`                                | Barrel file re-exporting `BookingWizard` for clean imports.                                                                                                                                                                       |
| `src/app/[locale]/booking/page.tsx`                            | Next.js page component. Server-rendered with `generateMetadata`. Renders `<BookingWizard />`.                                                                                                                                     |
| `src/app/[locale]/booking/success/page.tsx`                    | Success page. Server component with purple checkmark icon, success message, contact info, "Back to Home" button.                                                                                                                  |
| `src/app/api/booking/unavailable-dates/route.ts`               | `GET` API. Queries `appointments.booking_date` and `blocked_dates.blocked_date` in parallel. Maps to ISO strings, deduplicates, returns JSON array.                                                                               |
| `src/app/api/booking/create/route.ts`                          | `POST` API. Zod validation, pre-check date availability, INSERT with UNIQUE constraint (race condition guard), INSERT junction records.                                                                                           |
| `supabase/migrations/20240709000001_create_booking_tables.sql` | Migration creating 4 tables: `profiles`, `blocked_dates`, `appointments`, `appointment_services` with RLS policies and indexes.                                                                                                   |

---

## 🔄 Full User Flow

1. **Entry**: User arrives from Assessment Report → URL is `/booking?services=uuid1,uuid2`
2. **Wizard reads URL**: `BookingWizardContent` via `useSearchParams()` calls `setPreselectedServices()` → skips Step 2
3. **Step 1** — Client fills: name, email, phone, car description, checks GDPR → Next
4. **Step 2** — If no `?services=`, user selects from checkbox cards. If preselected, auto-skipped.
5. **Step 3** — Calendar shows available dates. Unavailable dates (booked + admin-blocked) are disabled. User picks a date → Next
6. **Step 4** — Summary shows all data. User clicks "Termin verbindlich buchen" → POST to API
7. **Success** → Redirect to `/booking/success` with email and phone
8. **Error** → If date was taken (409), error message shown in Step 4

---

## 🗄️ Database Tables

### `profiles` — Admin identification

`id` (UUID PK → auth.users), `role` (TEXT, default 'admin'), `created_at`

### `blocked_dates` — Admin blocks whole days

`id`, `blocked_date` (DATE UNIQUE), `reason`, `created_at`

### `appointments` — Confirmed bookings

`id`, `first_name`, `last_name`, `email`, `phone`, `car_description`, **`booking_date` (DATE UNIQUE)**, `status` (default 'confirmed'), `created_at`

### `appointment_services` — Junction table

Composite PK `(appointment_id, service_id)`, both FK with ON DELETE CASCADE

---

## 🌐 i18n

All strings under `Booking.*` in `messages/{de,en,el}.json`: title, subtitle, progress step labels, form labels, validation messages, success page, error states.

---

## 🔗 Integration

- **Phase 6 (Assessment)**: `assessment-report.tsx` reads `useAssessmentStore().services`, builds `/booking?services=...` link
- **Phase 11 (Admin Dashboard)**: Will manage `appointments` and `blocked_dates`
