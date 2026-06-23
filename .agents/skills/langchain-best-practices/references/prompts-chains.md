# Prompts & Chains (prompts-)

## Rule: Use ChatPromptTemplate for Multi-Message Prompts

**Why it matters:** `ChatPromptTemplate` separates system, human, and AI messages clearly. This matches how chat models are trained and produces better results than raw string templates.

### ❌ Incorrect — Raw String

```typescript
const prompt = `You are a helpful assistant. Answer: ${question}`;
// Model doesn't distinguish between instructions and user input
```

### ✅ Correct — ChatPromptTemplate

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts';

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a car detailing expert for LK Gloss & Detail.
Always be professional, friendly, and helpful.
Respond in the same language as the user's question.`,
  ],
  ['human', '{question}'],
]);

const chain = prompt.pipe(model);
const response = await chain.invoke({
  question: 'Was kostet eine Innenreinigung?',
});
```

---

## Rule: Chain Composition with `.pipe()`

**Why it matters:** The `.pipe()` method creates clean, readable, and type-safe chains. Each step's output becomes the next step's input.

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

// Simple chain: prompt → model → string
const chain = prompt.pipe(model).pipe(new StringOutputParser());

// Complex chain: prompt → model → parser → post-processing
const chain2 = prompt
  .pipe(model)
  .pipe(new StringOutputParser())
  .pipe(async (text) => text.trim().replace(/\n{3,}/g, '\n\n'));
```

---

## Rule: RAG Prompt with Context

```typescript
const ragPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a helpful assistant for LK Gloss & Detail, a mobile car detailing service in Neuhausen auf den Fildern, Germany.

Use ONLY the following context to answer the user's question. If the answer is not in the context, say "Entschuldigung, dazu habe ich keine Informationen."

Context:
{context}

Current conversation language: {language}`,
  ],
  ['placeholder', '{history}'], // Previous messages
  ['human', '{question}'],
]);
```

---

## Rule: Few-Shot Prompting for Consistent Output

```typescript
const fewShotPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You classify car detailing inquiries into categories.

Examples:
Input: "Wie viel kostet eine Innenreinigung?"
Output: {{ "category": "pricing", "service": "Innenreinigung" }}

Input: "Ich möchte einen Termin für nächste Woche"
Output: {{ "category": "booking", "service": null }}

Input: "Was ist der Unterschied zwischen Politur und Versiegelung?"
Output: {{ "category": "faq", "service": "Politur" }}`,
  ],
  ['human', '{question}'],
]);
```

---

## Rule: Dynamic Prompt Variables

```typescript
const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `Today is {date}. You are assisting with car detailing services.
Available services: {services}`,
  ],
  ['human', '{question}'],
]);

const services = await getActiveServices();
const serviceList = services.map((s) => `${s.name} (€${s.price})`).join(', ');

const chain = prompt.pipe(model);
const response = await chain.invoke({
  date: new Date().toLocaleDateString('de-DE'),
  services: serviceList,
  question: 'What services do you offer?',
});
```

---

## Rule: Output Parsers

```typescript
import { StringOutputParser } from '@langchain/core/output_parsers';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { StructuredOutputParser } from '@langchain/core/output_parsers';

// Simple string output
const stringChain = prompt.pipe(model).pipe(new StringOutputParser());

// JSON output (less reliable than withStructuredOutput)
const jsonChain = prompt.pipe(model).pipe(new JsonOutputParser());

// Structured with Zod (preferred)
const structuredModel = model.withStructuredOutput(MySchema);
```

---

## References

- https://docs.langchain.com/oss/javascript/langchain/prompts
- https://js.langchain.com/docs/how_to/prompts
- https://docs.langchain.com/oss/javascript/langchain/streaming
