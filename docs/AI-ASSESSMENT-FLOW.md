# Phase 6.1 — AI Car Assessment: Multi-step Photo Upload Flow

> **TL;DR**: Users upload 4 car photos (front, rear, side, interior). Each photo is validated by Gemini 2.5 Pro via OpenRouter. If valid, data about the car (size, dirt level, description) is stored in Zustand and the wizard advances. If invalid, the user sees a localized error message and can retry.

---

## 🧩 Architecture Overview

```
User clicks "Choose File" or "Take Photo"
        │
        ▼
┌─────────────────────────────────────┐
│     PhotoUploadStep (Client)        │
│  • Reads file → creates preview     │
│  • Detects mobile/tablet for camera │
│  • Calls validatePhoto mutation     │
└──────────────┬──────────────────────┘
               │ POST /api/assessment/validate-photo
               ▼
┌─────────────────────────────────────┐
│  validate-photo/route.ts (API)      │
│  • Parses request with Zod          │
│  • Sends image + prompt to Gemini   │
│  • Returns validated JSON response  │
└──────────────┬──────────────────────┘
               │ response
               ▼
┌─────────────────────────────────────┐
│     AssessmentWizard (Client)       │
│  • Receives AI result               │
│  • Updates Zustand store            │
│  • Advances to next step (if valid) │
│  • Shows error (if invalid)         │
└─────────────────────────────────────┘
```

---

## 📁 File Map

| File | Purpose |
|------|---------|
| `src/features/assessment/schemas/assessment.schema.ts` | All Zod schemas + TypeScript types for the entire assessment flow |
| `src/features/assessment/schemas/photo-validation.schema.ts` | Zod schemas for API request/response validation |
| `src/features/assessment/stores/assessment-store.ts` | Zustand store — manages wizard state, photos, services, result |
| `src/features/assessment/hooks/use-assessment.ts` | TanStack Query hooks (`useValidatePhoto`, `useAnalyzeAssessment`, `useServices`) |
| `src/app/api/assessment/validate-photo/route.ts` | API route that calls Gemini 2.5 Pro via OpenRouter |
| `src/features/assessment/components/assessment-wizard.tsx` | Main orchestrator — controls step flow and data flow |
| `src/features/assessment/components/photo-upload-step.tsx` | Photo upload UI with drag-drop, file picker, and mobile camera |
| `src/features/assessment/components/progress-indicator.tsx` | Visual progress bar (1 → 2 → 3 → 4) with animated lines |
| `src/features/assessment/index.ts` | Barrel exports for clean imports |
| `src/lib/rate-limit.ts` | In-memory rate limiter (10 req/min for validation, 3 req/5min for analysis) |
| `src/proxy.ts` | Next.js proxy that applies rate limiting before forwarding to API routes |
| `src/app/[locale]/assessment/page.tsx` | Assessment page — renders `AssessmentWizard` |

---

## 🔄 Data Flow (Step by Step)

### 1. User Interaction

The user is presented with a step-by-step wizard starting at "Frontansicht" (or equivalent in their locale).

**States:**
- **idle**: Upload area visible (drag-drop zone + buttons)
- **uploading**: Spinner overlay while AI validates
- **valid**: Green checkmark, auto-advance after 1 second
- **invalid**: Red X, error message shown, "Try Again" button

### 2. File Selection

`photo-upload-step.tsx` handles file input via:
- **Drag & drop** — `onDrop` handler
- **Click to browse** — hidden `<input type="file">`
- **Camera** (mobile/tablet only) — `<input capture="environment">` with `isMobile` detection via userAgent + screen width

### 3. AI Validation Request

The component creates a `FileReader` to get base64 data, then calls `useValidatePhoto().mutateAsync()`.

**Request payload:**
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "expectedAngle": "front" | "rear" | "side" | "interior",
  "previousCarDescriptions": ["black Mercedes C-Class", ...],
  "locale": "de" | "en" | "el"
}
```

### 4. API Route Processing

`route.ts` does the following:
1. Parses body with `PhotoValidationRequestSchema` (Zod)
2. Builds a LangChain message array: `SystemMessage` (expert prompt) + `HumanMessage` (with image URL + text instructions)
3. Calls `ChatOpenAI` configured for `google/gemini-2.5-pro` via OpenRouter
4. Extracts JSON from the response using a regex match
5. Validates the response with `PhotoValidationResponseSchema` (Zod)
6. Returns the validated response

**AI Prompt design:**
- **System prompt**: Defines the expected angles, strictness rules, consistency check requirement, and JSON output format
- **Human message**: Includes the locale instruction (`Language for userMessage: ${locale}`) so the AI responds in the correct language
- **Temperature**: 0 (deterministic, no creativity needed)

### 5. AI Response

```json
{
  "valid": true,
  "reason": "Photo clearly shows front of car with headlights and grille",
  "userMessage": "✅ Frontansicht erkannt! Das Foto zeigt die Vorderseite des Fahrzeugs.",
  "carSize": "medium",
  "dirtLevel": "moderate",
  "carDescription": "Black Mercedes C-Class"
}
```

### 6. Store Update

`AssessmentWizard.handlePhotoValidatedAction` calls `setPhotoValidation()` which updates the Zustand store:

```typescript
// Store structure
{
  currentStep: "front" | "rear" | "side" | "interior" | "services" | "analyzing" | "results",
  photos: [{
    id: "uuid",
    angle: "front",
    previewUrl: "data:...",
    validationStatus: "valid",
    carSize: "medium",
    dirtLevel: "moderate",
    carDescription: "Black Mercedes C-Class"
  }, ...],
  services: [],
  result: null,
  isAnalyzing: false,
  error: null
}
```

After updating the store, the wizard auto-advances to the next step after 1 second via `setTimeout(() => nextStep(), 1000)`.

### 7. Car Consistency Check

The AI checks car consistency across photos:
- `previousCarDescriptions` is built from all previously validated photos
- The AI receives these descriptions and verifies the current photo matches (same color, make/model)
- This prevents the user from uploading photos of different cars

---

## 📐 Zod Schemas

### Assessment State (`assessment.schema.ts`)

```typescript
// Core enums
PhotoAngle: "front" | "rear" | "side" | "interior"
PhotoValidationStatus: "idle" | "uploading" | "valid" | "invalid"
WizardStep: PhotoAngle | "services" | "analyzing" | "results"

// Photo object
AssessmentPhoto {
  id: string (uuid)
  angle: PhotoAngle
  previewUrl: string (url)
  uploadedUrl?: string (url)
  validationStatus: "pending" | "validating" | "valid" | "invalid"
  validationReason?: string
  carSize?: "small" | "medium" | "large" | "suv"
  dirtLevel?: "light" | "moderate" | "heavy"
  carDescription?: string
}

// Full store shape
AssessmentState {
  currentStep: WizardStep
  photos: AssessmentPhoto[]
  services: ServiceSelection[]
  result: AssessmentResult | null
  isAnalyzing: boolean
  error: string | null
}
```

### Photo Validation API (`photo-validation.schema.ts`)

```typescript
// Request
PhotoValidationRequest {
  imageBase64: string
  expectedAngle: "front" | "rear" | "side" | "interior"
  previousCarDescriptions?: string[]
  locale?: string
}

// Response
PhotoValidationResponse {
  valid: boolean
  reason: string
  userMessage: string | null    // Localized message for the UI
  carSize: "small" | "medium" | "large" | "suv" | null
  dirtLevel: "light" | "moderate" | "heavy" | null
  carDescription: string | null
}
```

---

## 🎨 UI Component Details

### ProgressIndicator

Shows steps 1–4 with animated connecting lines:
- **Completed step**: Green circle with checkmark + line fully green
- **Current step**: Purple circle (animated pulse at 1.1x scale)
- **Incomplete step**: Dark gray circle + dark gray line
- Lines animate width from 0% to 100% when a step is completed

### PhotoUploadStep

- **Upload area**: Dashed border container with drag-drop support
- **File button**: Always visible, opens system file picker
- **Camera button**: Only on mobile/tablet (`isMobile` detected via userAgent + `window.innerWidth < 1024`), uses `capture="environment"` to open rear camera
- **Preview**: Shows uploaded image with status overlay
- **Error state**: Shows `userMessage` from AI (localized), has "Try Again" button

### AssessmentWizard

- Orchestrates the 4 photo steps + services placeholder
- Uses `AnimatePresence` + `motion.div` for slide transitions between steps
- `previousCarDescriptions` is computed from validated photos and passed to each `PhotoUploadStep`

---

## 🛡️ Rate Limiting

The proxy (`src/proxy.ts`) applies rate limiting to assessment endpoints:

| Endpoint | Limit |
|----------|-------|
| `/api/assessment/validate-photo` | 10 requests per minute |
| `/api/assessment/analyze` | 3 requests per 5 minutes |

The rate limiter is a simple in-memory map keyed by IP address. Exceeding the limit returns a 429 response.

---

## 📝 Logging

Console logs are placed at key points for debugging:

- **`route.ts`**: `[validate-photo] AI Response for ${expectedAngle} (locale: ${locale}):` — shows raw AI response
- **`AssessmentWizard`**: `[AssessmentWizard] Updating store with validated photo:` — shows data written to store
- **`AssessmentWizard`**: `[AssessmentWizard] Photo invalid:` — shows error details
- **`route.ts` error handler**: `[validate-photo] Error:` — catches and logs API errors

---

## 🌐 i18n Strings

All user-facing strings in `messages/{de,en,el}.json` under the `Assessment` key:

- `steps.front`, `steps.rear`, `steps.side`, `steps.interior` — step titles
- `upload.dragDrop`, `upload.orClick`, `upload.chooseFile`, `upload.takePhoto` — upload UI
- `validation.validating`, `validation.valid`, `validation.invalid`, `validation.tryAgain`, `validation.uploadDifferent` — validation states
- `navigation.back`, `navigation.skip` — navigation buttons
- `progress.step`, `progress.of` — progress indicator text

The AI `userMessage` is returned already translated by Gemini (prompted with the `locale` parameter).

---

## 🧪 Testing Checklist

- [ ] Upload a front photo of a car → should validate and advance to step 2
- [ ] Upload a rear photo when step asks for front → should show error in selected language
- [ ] Upload a non-car photo → should be rejected
- [ ] Upload photos from different cars → AI should detect mismatch
- [ ] Test all 3 locales (de, en, el) — both UI text and AI messages
- [ ] Test on mobile — camera button should appear and open camera
- [ ] Test on desktop — camera button should be hidden
- [ ] Test rate limiting — exceed 10 requests/minute → should return 429

---

## 📌 Connection to Next Phases

- **Phase 6.2** (Service Selection): Store's `photos[]` already contains `carSize` and `dirtLevel`. These drive the Tinder-style service cards.
- **Phase 6.3** (AI Agent): The LangGraph agent will receive `carSize`, `dirtLevel`, `carDescription` + selected services → calculates final price.
- **Phase 6.4** (Results): The store's `result` field (to be populated by Phase 6.3) holds the complete assessment output.