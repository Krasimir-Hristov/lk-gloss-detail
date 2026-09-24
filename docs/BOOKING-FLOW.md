# 📅 Concurrency-Safe Booking Flow (`/booking`)

> **Executive Summary**: The booking system implements a streamlined 4-step wizard (Client Info $\rightarrow$ Services Selection $\rightarrow$ Date Picker $\rightarrow$ Summary). Appointments represent exclusive full-day bookings. Submissions are processed via Next.js Server Actions with a PostgreSQL `UNIQUE(booking_date)` constraint to eliminate race conditions and guarantee zero double-bookings.

---

## 🧩 Architecture & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as User (Browser)
    participant Wizard as BookingWizard (Client UI)
    participant Store as Zustand (bookingStore)
    participant ServerAction as Server Action (src/actions/booking.ts)
    participant DB as Supabase PostgreSQL
    participant Success as /booking/success?id=... (RSC)

    %% Step 1: Intake & Auto-skip
    Note over Customer, Wizard: Initialization & URL Params
    Customer->>Wizard: Visits /booking?services=uuid1,uuid2
    Wizard->>Store: setPreselectedServices([uuid1, uuid2])
    Note over Wizard: Auto-skips Step 2 when services are preselected!

    %% Step 1: Info Form
    Note over Customer, Wizard: Step 1: Client Information
    Customer->>Wizard: Enters Name, Email, Phone, Car Description, Accepts GDPR
    Wizard->>Store: Validates with step1Schema & stores client info

    %% Step 2: Services
    Note over Customer, Wizard: Step 2: Service Selection (if not skipped)
    Customer->>Wizard: Selects services from database catalog

    %% Step 3: Date Picker
    Note over Customer, Wizard: Step 3: Full-Day Date Selection
    Wizard->>ServerAction: Calls getUnavailableDates()
    ServerAction->>DB: Query confirmed appointments & blocked_dates
    DB-->>ServerAction: Return busy dates array
    ServerAction-->>Wizard: Array of ISO date strings ['2026-10-01', ...]
    Wizard->>Wizard: Renders Calendar; disables past & unavailable dates
    Customer->>Wizard: Selects available future date

    %% Step 4: Summary & Submit
    Note over Customer, Wizard: Step 4: Review & Final Confirmation
    Wizard->>Customer: Displays Glassmorphism Summary Card
    Customer->>Wizard: Clicks "Termin verbindlich buchen"
    Wizard->>ServerAction: Calls createBooking(formData)

    alt Date was taken in race condition (Conflict)
        ServerAction->>DB: INSERT INTO appointments ...
        DB-->>ServerAction: Error 23505 (Unique violation)
        ServerAction-->>Wizard: { success: false, error: 'DATE_ALREADY_BOOKED' }
        Wizard->>Customer: Displays Conflict Notification & prompts new date
    else Successful Booking
        ServerAction->>DB: INSERT INTO appointments ... RETURNING id
        ServerAction->>DB: INSERT INTO appointment_services (appointment_id, service_id)
        ServerAction-->>Wizard: { success: true, appointmentId }
        Wizard->>Success: Redirect to /booking/success?id=<appointmentId>
        Success->>DB: Fetch appointment server-side (Server Component)
        Success->>Customer: Render confirmation screen with booking details
    end
```

---

## 📁 File Map & Component Responsibilities

| File                                                   | Type                           | Responsibility                                                                                        |
| :----------------------------------------------------- | :----------------------------- | :---------------------------------------------------------------------------------------------------- |
| `src/features/booking/components/BookingWizard.tsx`    | Client Component               | Top-level orchestrator; reads `?services=` query params, synchronizes steps, and provides transitions |
| `src/features/booking/components/BookingProgress.tsx`  | Client Component               | 4-step progress indicator with interactive status indicators and glowing purple connectors            |
| `src/features/booking/components/StepClientInfo.tsx`   | Client Component               | **Step 1**: Collects customer contact details and mandatory GDPR consent with Zod validation          |
| `src/features/booking/components/StepServices.tsx`     | Client Component               | **Step 2**: Service checkbox selection from Supabase catalog (auto-skipped if preselected)            |
| `src/features/booking/components/StepDatePicker.tsx`   | Client Component               | **Step 3**: Interactive shadcn Calendar; queries unavailable dates via Server Action                  |
| `src/features/booking/components/StepSummary.tsx`      | Client Component               | **Step 4**: Glassmorphism overview of selected details with Server Action submission trigger          |
| `src/features/booking/components/BookingErrorCard.tsx` | Client Component               | User-friendly error alert card with retry triggers for failed operations                              |
| `src/features/booking/stores/bookingStore.ts`          | Zustand Store                  | Wizard state management (current step, client fields, selected services, selected date, errors)       |
| `src/features/booking/schemas/bookingSchema.ts`        | Zod Schemas                    | Strict runtime validation schemas for each wizard step and submission payloads                        |
| `src/actions/booking.ts`                               | Server Action (`"use server"`) | `getUnavailableDates` and `createBooking` execution with concurrency safeguards                       |
| `src/app/[locale]/booking/page.tsx`                    | Server Component               | Page entry point; handles dynamic metadata generation and Suspense boundary                           |
| `src/app/[locale]/booking/success/page.tsx`            | Server Component               | Post-booking confirmation page; fetches booking summary securely server-side                          |

---

## 🛡️ Concurrency Safeguards & Race Condition Defense

1. **Database Constraint as Primary Shield**:
   Unlike simple client-side checks that can be circumvented during simultaneous checkout attempts, the `appointments` table enforces a strict unique constraint at the database engine level:
   ```sql
   ALTER TABLE appointments ADD CONSTRAINT appointments_booking_date_key UNIQUE (booking_date);
   ```
2. **Atomic Submission Handling (`createBooking`)**:
   - The Server Action first performs a pre-check query against `appointments` and `blocked_dates`.
   - If an edge-case race condition occurs where another customer completes checkout milliseconds prior, the database rejects the duplicate `INSERT` with PostgreSQL error code `23505` (`unique_violation`).
   - The Server Action catches this violation and cleanly returns:
     ```json
     {
     	"success": false,
     	"error": "This date was just reserved by another customer. Please choose another date."
     }
     ```
   - Step 4 displays this message immediately, allowing the customer to return to Step 3 and select an alternative date without losing their entered contact information.
3. **Orphaned Record Cleanup**:
   If inserting junction records into `appointment_services` fails after the parent appointment has been inserted, the Server Action automatically rolls back by deleting the newly created appointment record, preventing orphaned entries.

---

## 🔒 Privacy & Server-Side Security

- **No PII in URLs**: When redirecting to the success page, the application routes to:
  ```
  /booking/success?id=<appointmentId>
  ```
  Customer names, phone numbers, and emails are never passed as URL parameters or logged in browser history.
- **Server Component Authorization**: The `/booking/success` page runs entirely as a React Server Component. It queries the database using an internal service client to retrieve the appointment confirmation by ID, rendering the details securely without exposing database queries to the client bundle.
