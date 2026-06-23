# Streaming & Callbacks (stream-)

## Rule: Always Stream User-Facing Responses

**Why it matters:** Streaming provides instant feedback. Users see tokens appear in real-time instead of waiting for the full response. This dramatically improves perceived performance.

### ❌ Incorrect — Blocking Invoke

```typescript
// User waits 5+ seconds with no feedback
const response = await model.invoke('Tell me about car detailing services');
return response.content;
```

### ✅ Correct — Streaming

```typescript
const stream = await model.stream('Tell me about car detailing services');

for await (const chunk of stream) {
  // Send each token to the client immediately
  console.log(chunk.content); // or write to Response stream
}
```

---

## Rule: Streaming with Tool Calls

**Why it matters:** When the model calls tools, you need to handle both text chunks and tool call chunks in the stream.

```typescript
const stream = await model.stream('What services do you offer for SUVs?');

for await (const chunk of stream) {
  for (const block of chunk.contentBlocks) {
    if (block.type === 'text') {
      // Regular text token
      console.log(block.text);
    } else if (block.type === 'tool_call_chunk') {
      // Tool call being built
      console.log(`Tool call: ${block.name}`, block.args);
    } else if (block.type === 'reasoning') {
      // Model's reasoning (for reasoning models)
      console.log(`Reasoning: ${block.reasoning}`);
    }
  }
}
```

---

## Rule: SSE (Server-Sent Events) for API Routes

**Why it matters:** Next.js API routes should use SSE to stream LLM responses to the browser.

```typescript
// app/api/chatbot/message/route.ts
export async function POST(req: Request) {
  const { message, history } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const modelStream = await model.stream([
          new SystemMessage(systemPrompt),
          ...history,
          new HumanMessage(message),
        ]);

        for await (const chunk of modelStream) {
          const text = chunk.content;
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: error.message })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

---

## Rule: Client-Side SSE Consumption

```typescript
// hooks/useChatStream.ts
export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  async function sendMessage(text: string) {
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsStreaming(true);

    const response = await fetch('/api/chatbot/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: messages }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = '';

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk
        .split('\n')
        .filter((line) => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          setIsStreaming(false);
          return;
        }

        const { text } = JSON.parse(data);
        assistantMessage += text;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: assistantMessage,
          };
          return updated;
        });
      }
    }
  }

  return { messages, isStreaming, sendMessage };
}
```

---

## Rule: LangSmith Tracing for Debugging

```typescript
// Enable tracing by setting environment variables:
// LANGCHAIN_TRACING_V2=true
// LANGCHAIN_API_KEY=your_key
// LANGCHAIN_PROJECT=lk-gloss-detail

// Or programmatically:
import { Client } from 'langsmith';

const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
});

// All LangChain calls are automatically traced
// View traces at: https://smith.langchain.com
```

---

## References

- https://docs.langchain.com/oss/javascript/langchain/streaming
- https://docs.langchain.com/oss/javascript/langgraph/streaming
- https://docs.smith.langchain.com
