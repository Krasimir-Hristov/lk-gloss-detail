# Chat Models & Providers (models-)

## Rule: Initialize Chat Models with Environment Variables

**Why it matters:** Never hardcode API keys. Use environment variables and let the SDK auto-detect them.

### ❌ Incorrect — Hardcoded API Key

```typescript
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
  apiKey: 'sk-...', // ❌ NEVER hardcode keys
  model: 'gpt-4o',
});
```

### ✅ Correct — Environment Variable

```typescript
import { ChatOpenAI } from '@langchain/openai';

// Automatically reads OPENAI_API_KEY from process.env
const model = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0.7,
});
```

---

## Rule: Configure for OpenRouter (Multi-Provider)

**Why it matters:** OpenRouter provides access to multiple models through a single API. Configure the base URL and default headers.

```typescript
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
  model: 'openai/gpt-4o',
  temperature: 0.3,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL,
      'X-Title': 'LK Gloss & Detail',
    },
  },
});
```

---

## Rule: Model Selection by Task

| Task                  | Recommended Model        | Reasoning                        |
| --------------------- | ------------------------ | -------------------------------- |
| Chatbot / Q&A         | `gpt-4o-mini`            | Fast, cheap, good enough for FAQ |
| Vision (car analysis) | `gpt-4o`                 | Best vision capabilities         |
| Embeddings            | `text-embedding-3-small` | 1536 dimensions, cheap           |
| Complex reasoning     | `claude-3.5-sonnet`      | Best for multi-step logic        |
| Structured extraction | `gpt-4o`                 | Reliable JSON output             |

---

## Rule: Temperature Settings

```typescript
// Creative tasks (marketing copy, summaries)
const creative = new ChatOpenAI({ temperature: 0.9 });

// Balanced (chatbot, general Q&A)
const balanced = new ChatOpenAI({ temperature: 0.7 });

// Deterministic (structured extraction, classification)
const precise = new ChatOpenAI({ temperature: 0.0 });

// NEVER use temperature > 0.3 for tool calling or structured output
```

---

## Rule: Bind Tools to Models

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const searchTool = tool(
  async ({ query }) => {
    const results = await searchDatabase(query);
    return results;
  },
  {
    name: 'search_knowledge_base',
    description: 'Search the car detailing knowledge base',
    schema: z.object({
      query: z.string().describe('The search query'),
    }),
  },
);

// Bind tool to model
const modelWithTools = model.bindTools([searchTool]);

// Force tool use
const modelForcedTool = model.bindTools([searchTool], {
  tool_choice: 'search_knowledge_base',
});
```

---

## Rule: Multi-Modal (Vision) Input

```typescript
import { HumanMessage } from '@langchain/core/messages';

const visionModel = new ChatOpenAI({ model: 'gpt-4o' });

const response = await visionModel.invoke([
  new HumanMessage({
    content: [
      {
        type: 'text',
        text: 'Is this a front or rear view of the car?',
      },
      {
        type: 'image_url',
        image_url: { url: 'data:image/jpeg;base64,...' },
      },
    ],
  }),
]);
```

---

## References

- https://docs.langchain.com/oss/javascript/integrations/chat/openai
- https://js.langchain.com/docs/integrations/chat
- https://openrouter.ai/docs
