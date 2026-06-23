# Structured Output (structured-)

## Rule: Use `withStructuredOutput()` for Type-Safe Responses

**Why it matters:** Instead of parsing JSON from raw text, `withStructuredOutput()` guarantees the response matches your schema. The model is constrained to output valid JSON matching your Zod schema.

### ❌ Incorrect — Manual JSON Parsing

```typescript
const response = await model.invoke(
  "Extract name and price from: 'Full Detail €299'",
);

// Fragile — model might return "Name: Full Detail, Price: 299" or invalid JSON
const parsed = JSON.parse(response.content);
// 💥 Runtime error if model doesn't return valid JSON
```

### ✅ Correct — Structured Output with Zod

```typescript
import { z } from 'zod';

const ServiceExtraction = z.object({
  name: z.string().describe('The name of the service'),
  price: z.number().describe('The price in euros'),
  currency: z.literal('EUR'),
});

const structuredModel = model.withStructuredOutput(ServiceExtraction, {
  name: 'extract_service',
  strict: true, // model MUST conform to schema
});

const result = await structuredModel.invoke([
  new HumanMessage("Extract service info: 'Full Detail €299'"),
]);

// result is typed as { name: string; price: number; currency: "EUR" }
console.log(result.name); // "Full Detail"
console.log(result.price); // 299
```

---

## Rule: Multiple Structured Outputs with `toolStrategy`

**Why it matters:** `toolStrategy` lets the agent choose which schema to use. The agent retries automatically if it picks the wrong one.

```typescript
import { createAgent, toolStrategy } from 'langchain';

const ContactInfo = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
});

const BookingRequest = z.object({
  service: z.string(),
  preferredDate: z.string(),
  carModel: z.string(),
});

const agent = createAgent({
  model: 'openai/gpt-4o',
  tools: [],
  responseFormat: toolStrategy([ContactInfo, BookingRequest]),
});

const result = await agent.invoke({
  messages: [
    new HumanMessage(
      "I'm John (john@email.com). I want a full detail for my BMW on July 15th.",
    ),
  ],
});
// Agent automatically selects BookingRequest schema
console.log(result.structuredResponse);
// { service: "Full Detail", preferredDate: "2026-07-15", carModel: "BMW" }
```

---

## Rule: Nested and Complex Schemas

```typescript
const CarAssessmentResult = z.object({
  exterior_condition: z.object({
    paint_quality: z.enum(['excellent', 'good', 'fair', 'poor']),
    scratches: z.array(
      z.object({
        location: z.string(),
        severity: z.enum(['light', 'medium', 'deep']),
      }),
    ),
    dirt_level: z.enum(['light', 'medium', 'heavy']),
  }),
  interior_condition: z.object({
    cleanliness: z.enum(['clean', 'moderate', 'dirty']),
    odors: z.boolean(),
    stains: z.array(z.string()),
  }),
  recommended_services: z.array(
    z.object({
      service_id: z.string(),
      reason: z.string(),
      priority: z.enum(['required', 'recommended', 'optional']),
    }),
  ),
  confidence_score: z.number().min(0).max(1),
});

const analyzerModel = model.withStructuredOutput(CarAssessmentResult, {
  name: 'analyze_car_condition',
});
```

---

## Rule: Handling Structured Output Errors

```typescript
try {
  const result = await structuredModel.invoke(messages);
  return { success: true, data: result };
} catch (error) {
  if (error.message?.includes('structured output')) {
    // Model failed to produce valid output — retry with clearer prompt
    const retryResult = await structuredModel.invoke([
      ...messages,
      new AIMessage(
        "I'll provide the information in the exact format requested.",
      ),
    ]);
    return { success: true, data: retryResult };
  }
  return { success: false, error: error.message };
}
```

---

## References

- https://docs.langchain.com/oss/javascript/langchain/structured-output
- https://docs.langchain.com/oss/javascript/integrations/chat/openai#structured-output
- https://zod.dev
