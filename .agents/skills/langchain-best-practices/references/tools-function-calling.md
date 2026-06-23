# Tools & Function Calling (tools-)

## Rule: Always Use Zod for Tool Schemas

**Why it matters:** Zod provides runtime validation, automatic TypeScript types, and clear descriptions that the LLM uses to understand how to call your tools.

### ❌ Incorrect — No Schema or Plain Object

```typescript
const badTool = tool(
  async (input: any) => {
    // No schema — LLM doesn't know what parameters to pass
    return searchDatabase(input.query);
  },
  { name: 'search', description: 'Search the database' },
);
```

### ✅ Correct — Zod Schema with Descriptions

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const searchTool = tool(
  async ({ query, category, limit }) => {
    const results = await searchDatabase(query, { category, limit });
    return JSON.stringify(results);
  },
  {
    name: 'search_knowledge_base',
    description:
      'Search the LK Gloss & Detail knowledge base for information about car detailing services, prices, and policies.',
    schema: z.object({
      query: z.string().describe("The search query in the user's language"),
      category: z
        .enum(['services', 'pricing', 'faq', 'policies'])
        .optional()
        .describe('Filter by content category'),
      limit: z
        .number()
        .min(1)
        .max(10)
        .default(5)
        .describe('Maximum number of results to return'),
    }),
  },
);
```

---

## Rule: Tool Response Format

**Why it matters:** Tools should return structured, informative responses. The `responseFormat` option controls how the output is consumed.

```typescript
// Default: content only
const simpleTool = tool(
  async ({ query }) => {
    return `Found 3 results for "${query}"`;
  },
  {
    name: 'simple_search',
    schema: z.object({ query: z.string() }),
  },
);

// With artifacts: content + raw data
const artifactTool = tool(
  async ({ query }) => {
    const docs = await vectorStore.similaritySearch(query, 3);
    const serialized = docs
      .map((d) => `Source: ${d.metadata.source}\nContent: ${d.pageContent}`)
      .join('\n\n');
    return [serialized, docs]; // [content, artifacts]
  },
  {
    name: 'search_with_artifacts',
    schema: z.object({ query: z.string() }),
    responseFormat: 'content_and_artifact',
  },
);
```

---

## Rule: Tool Design Best Practices

1. **Name**: Use `snake_case`, be descriptive (`search_knowledge_base`, not `search`)
2. **Description**: Write for the LLM — explain WHEN to use it, not just WHAT it does
3. **Schema descriptions**: Every field needs `.describe()` — the LLM reads these
4. **Error handling**: Always return meaningful error messages, never throw
5. **Idempotency**: Read tools should be truly idempotent

```typescript
const calculatePrice = tool(
  async ({ serviceIds, carSize, dirtLevel }) => {
    try {
      const services = await getServices(serviceIds);
      const basePrice = services.reduce((sum, s) => sum + s.basePrice, 0);
      const sizeMultiplier = { small: 0.8, medium: 1.0, large: 1.3, suv: 1.5 }[
        carSize
      ];
      const dirtMultiplier = { light: 1.0, medium: 1.3, heavy: 1.7 }[dirtLevel];
      const price = Math.round(basePrice * sizeMultiplier * dirtMultiplier);
      return `Estimated price: €${price}`;
    } catch (error) {
      return `Error calculating price: ${error.message}`;
    }
  },
  {
    name: 'calculate_price',
    description:
      'Calculate the estimated price for car detailing services based on selected services, car size, and dirt level. Use this when the user wants a price estimate.',
    schema: z.object({
      serviceIds: z.array(z.string()).describe('List of selected service IDs'),
      carSize: z
        .enum(['small', 'medium', 'large', 'suv'])
        .describe('Size category of the car'),
      dirtLevel: z
        .enum(['light', 'medium', 'heavy'])
        .describe('How dirty the car is'),
    }),
  },
);
```

---

## Rule: Parallel Tool Calls

**Why it matters:** When the LLM needs to call multiple independent tools, enable parallel execution to reduce latency.

```typescript
// Bind multiple tools — LLM can call them in parallel
const modelWithTools = model.bindTools([
  searchKnowledgeBase,
  calculatePrice,
  checkAvailability,
]);

// The LLM will automatically parallelize independent calls
const response = await modelWithTools.invoke([
  new HumanMessage(
    'How much for a full detail on an SUV, and when are you available next week?',
  ),
]);
// LLM calls calculatePrice AND checkAvailability in parallel
```

---

## References

- https://docs.langchain.com/oss/javascript/langchain/tools
- https://docs.langchain.com/oss/javascript/integrations/tools
- https://js.langchain.com/docs/how_to/tool_calling
