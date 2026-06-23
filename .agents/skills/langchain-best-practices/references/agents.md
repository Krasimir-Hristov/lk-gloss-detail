# Agents (agents-)

## Rule: Prefer `createAgent` for Simple Agents

**Why it matters:** `createAgent` is the recommended high-level API. It handles tool calling, conversation history, and error recovery automatically. Only use LangGraph for complex workflows.

### ✅ Correct — Simple Agent with `createAgent`

```typescript
import { createAgent } from 'langchain';
import { SystemMessage } from '@langchain/core/messages';

const systemPrompt = new SystemMessage(
  `You are a helpful assistant for LK Gloss & Detail.
You have access to tools for searching the knowledge base and calculating prices.
Always respond in the user's language (German, English, or Greek).
If you don't know something, say so honestly.`,
);

const agent = createAgent({
  model: 'openai/gpt-4o-mini',
  tools: [searchKnowledgeBase, calculatePrice, checkAvailability],
  systemPrompt,
});

// Invoke with conversation history
const result = await agent.invoke({
  messages: [
    new HumanMessage(
      'Was kostet eine komplette Fahrzeugaufbereitung für einen SUV?',
    ),
  ],
});

console.log(result.messages[result.messages.length - 1].content);
```

---

## Rule: Agent with Structured Response

**Why it matters:** Force the agent to return data in a specific format for downstream processing.

```typescript
import { createAgent, toolStrategy } from 'langchain';
import { z } from 'zod';

const AssessmentResult = z.object({
  car_condition: z.enum(['good', 'fair', 'poor']),
  detected_issues: z.array(z.string()),
  recommended_services: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

const agent = createAgent({
  model: 'openai/gpt-4o',
  tools: [analyzeCarImage, searchServices],
  systemPrompt: new SystemMessage(
    'You analyze car images and recommend services.',
  ),
  responseFormat: toolStrategy(AssessmentResult),
});

const result = await agent.invoke({
  messages: [
    new HumanMessage({
      content: [
        { type: 'text', text: "Analyze this car's condition." },
        { type: 'image_url', image_url: { url: carImageUrl } },
      ],
    }),
  ],
});

// Type-safe access to structured response
console.log(result.structuredResponse.recommended_services);
```

---

## Rule: Agent Error Recovery

**Why it matters:** Agents can fail in many ways — invalid tool calls, model errors, rate limits. Implement retry logic.

```typescript
async function invokeAgentWithRetry(
  agent: ReturnType<typeof createAgent>,
  input: Parameters<typeof agent.invoke>[0],
  maxRetries = 3,
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await agent.invoke(input);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      if (error.message?.includes('rate_limit')) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (error.message?.includes('tool_call')) {
        // Add error feedback to conversation
        input.messages.push(
          new ToolMessage({
            content: `Error: ${error.message}. Please try a different approach.`,
            tool_call_id: 'error',
          }),
        );
        continue;
      }

      throw error;
    }
  }
}
```

---

## Rule: Agent vs LangGraph Decision Guide

| Scenario                           | Use                                      |
| ---------------------------------- | ---------------------------------------- |
| Single-turn Q&A                    | `createAgent`                            |
| Multi-turn conversation with tools | `createAgent`                            |
| Structured output extraction       | `createAgent` + `toolStrategy`           |
| Multi-step workflow with branching | LangGraph `StateGraph`                   |
| Parallel agent execution           | LangGraph `StateGraph`                   |
| Human-in-the-loop approval         | LangGraph `StateGraph`                   |
| Stateful, long-running agent       | LangGraph `StateGraph` with checkpointer |

---

## References

- https://docs.langchain.com/oss/javascript/langchain/agents
- https://docs.langchain.com/oss/javascript/langchain/rag
- https://docs.langchain.com/oss/javascript/langgraph
