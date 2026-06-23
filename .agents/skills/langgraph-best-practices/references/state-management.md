# State Management (state-)

## Rule: Define State with `StateSchema` and Zod

**Why it matters:** `StateSchema` provides type safety, runtime validation, and proper reducer behavior. Never use plain TypeScript interfaces for graph state.

### ❌ Incorrect — Plain Interface (No Reducers)

```typescript
interface MyState {
  messages: BaseMessage[]; // ❌ Overwritten on every update, not appended
  priceRange: { min: number; max: number } | null;
}
```

### ✅ Correct — StateSchema with Reducers

```typescript
import {
  StateGraph,
  StateSchema,
  MessagesValue,
  ReducedValue,
} from '@langchain/langgraph';
import { z } from 'zod';

const AssessmentState = new StateSchema({
  // Built-in reducer: appends new messages to existing ones
  messages: MessagesValue,

  // Scalar values: last write wins (standard override)
  carSize: z.enum(['small', 'medium', 'large', 'suv']).default('medium'),
  dirtLevel: z.enum(['light', 'medium', 'heavy']).default('medium'),
  priceMin: z.number().default(0),
  priceMax: z.number().default(0),
  summaryText: z.string().default(''),

  // ReducedValue: append-only arrays
  uploadedImages: new ReducedValue(
    z.array(z.string()).default(() => []),
    { reducer: (existing, incoming) => [...existing, ...incoming] },
  ),
  selectedServices: new ReducedValue(
    z.array(z.string()).default(() => []),
    { reducer: (existing, incoming) => [...existing, ...incoming] },
  ),
  completedSteps: new ReducedValue(
    z.array(z.string()).default(() => []),
    { reducer: (existing, incoming) => [...existing, ...incoming] },
  ),
});
```

---

## Rule: Use Correct Reducers for Different Data Types

| Data Type                       | Reducer Strategy           | When to Use                  |
| ------------------------------- | -------------------------- | ---------------------------- |
| Scalar (string, number, object) | Default (last write wins)  | Status fields, single values |
| Array (append-only)             | `ReducedValue` with concat | Messages, images, logs       |
| Array (deduplicated)            | Custom reducer with Set    | Unique IDs                   |
| Counter                         | `ReducedValue` with sum    | Progress tracking            |

---

## Rule: State Schema for the Car Assessment Workflow

**Why it matters:** This is the exact state shape needed for PHASE 6 of the LK Gloss & Detail project.

```typescript
import { StateSchema, MessagesValue, ReducedValue } from '@langchain/langgraph';
import { z } from 'zod';
import { BaseMessage } from '@langchain/core/messages';

const CarAssessmentState = new StateSchema({
  // Conversation history
  messages: MessagesValue,

  // Uploaded images (base64 or URLs)
  images: new ReducedValue(
    z
      .array(
        z.object({
          angle: z.enum(['front', 'rear', 'side', 'interior']),
          url: z.string(),
          validated: z.boolean().default(false),
        }),
      )
      .default(() => []),
    { reducer: (existing, incoming) => [...existing, ...incoming] },
  ),

  // Vision analysis results
  carSize: z.enum(['small', 'medium', 'large', 'suv']).optional(),
  dirtLevel: z.enum(['light', 'medium', 'heavy']).optional(),
  paintCondition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  detectedIssues: z.array(z.string()).default([]),

  // Service selection
  availableServices: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        basePrice: z.number(),
      }),
    )
    .default([]),
  acceptedServices: z.array(z.string()).default([]),
  rejectedServices: z.array(z.string()).default([]),

  // Final result
  priceMin: z.number().default(0),
  priceMax: z.number().default(0),
  durationHours: z.number().default(0),
  summaryText: z.string().default(''),
  servicesBreakdown: z
    .array(
      z.object({
        serviceId: z.string(),
        name: z.string(),
        price: z.number(),
        included: z.boolean(),
      }),
    )
    .default([]),

  // Workflow tracking
  currentStep: z
    .enum([
      'upload_front',
      'upload_rear',
      'upload_side',
      'upload_interior',
      'select_services',
      'analyze',
      'results',
      'done',
    ])
    .default('upload_front'),
  errors: z.array(z.string()).default([]),
});
```

---

## Rule: State Updates are Partial Merges

**Why it matters:** Nodes only need to return the fields they change. LangGraph automatically merges partial state updates.

```typescript
// Node only updates what it cares about
const analyzeCarNode = async (state: typeof CarAssessmentState.State) => {
  // state has ALL fields, but we only return what we change
  const analysis = await visionModel.invoke(state.images);

  return {
    carSize: analysis.size,
    dirtLevel: analysis.dirt,
    paintCondition: analysis.paint,
    currentStep: 'select_services',
    // messages, images, etc. are unchanged — no need to return them
  };
};
```

---

## References

- https://docs.langchain.com/oss/javascript/langgraph/use-graph-api
- https://docs.langchain.com/oss/javascript/langgraph/thinking-in-langgraph
- https://langchain-ai.github.io/langgraphjs/reference
