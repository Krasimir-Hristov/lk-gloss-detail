# Streaming & Interrupts (stream-)

## Rule: Use `stream()` for Real-Time State Updates

**Why it matters:** `graph.stream()` yields state after every node execution. This gives real-time visibility into the agent's progress.

```typescript
const config = { configurable: { thread_id: 'assessment_123' } };

// Stream mode "values" — emits full state after each node
for await (const state of await graph.stream(initialState, {
  ...config,
  streamMode: 'values',
})) {
  console.log(`Step: ${state.currentStep}`);
  console.log(
    `Images validated: ${state.images.filter((i) => i.validated).length}/4`,
  );
}
```

---

## Rule: Stream Modes

| Mode       | What You Get                          | When to Use                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `values`   | Full state after each node            | Progress tracking, UI updates       |
| `updates`  | Only the state changes from each node | Minimal data transfer               |
| `custom`   | Data written via `config.writer()`    | Custom streaming (e.g., LLM tokens) |
| `messages` | LLM message tokens                    | Chat UI streaming                   |
| `events`   | All events (nodes, edges, LLM tokens) | Debugging, full observability       |

---

## Rule: Custom Streaming from Nodes

**Why it matters:** Use `config.writer()` to stream custom data (like LLM tokens) from within a node.

```typescript
import { LangGraphRunnableConfig } from '@langchain/langgraph';

const generateSummaryNode = async (
  state: typeof CarAssessmentState.State,
  config: LangGraphRunnableConfig,
) => {
  const prompt = `Generate a summary for a ${state.carSize} car...`;

  const stream = await model.stream(prompt);

  let fullText = '';
  for await (const chunk of stream) {
    const text = chunk.content;
    if (text) {
      fullText += text;
      // Stream each token to the client
      config.writer?.({ type: 'token', content: text });
    }
  }

  return { summaryText: fullText };
};
```

---

## Rule: Human-in-the-Loop with `interrupt()`

**Why it matters:** `interrupt()` pauses graph execution and waits for human input. Perfect for admin approval workflows.

```typescript
import { interrupt } from '@langchain/langgraph';

const humanReviewNode = async (state: typeof CarAssessmentState.State) => {
  // Pause and present info to human
  const approval = interrupt({
    question: 'Approve this price estimate?',
    details: {
      carSize: state.carSize,
      dirtLevel: state.dirtLevel,
      services: state.acceptedServices,
      priceRange: `€${state.priceMin} - €${state.priceMax}`,
    },
  });

  if (!approval.approved) {
    return { errors: [...state.errors, 'Price rejected by admin'] };
  }

  return { currentStep: 'done' };
};

// Client-side: detect interrupt and resume
const stream = await graph.stream(initialState, config);

if (stream.interrupted) {
  const interruptData = stream.interrupts[0].value;
  // Show interruptData to admin, get their response
  const adminResponse = await showApprovalDialog(interruptData);

  // Resume with admin's decision
  const resumedStream = await graph.stream(
    new Command({ resume: adminResponse }),
    config,
  );
}
```

---

## Rule: Streaming with `streamEvents()` for Full Observability

```typescript
// streamEvents gives you every event: node start/end, LLM tokens, tool calls
const events = graph.streamEvents(initialState, {
  ...config,
  version: 'v3',
});

for await (const event of events) {
  switch (event.event) {
    case 'on_chain_start':
      console.log(`Node starting: ${event.name}`);
      break;
    case 'on_chain_end':
      console.log(`Node finished: ${event.name}`);
      break;
    case 'on_chat_model_stream':
      console.log(`LLM token: ${event.data.chunk.content}`);
      break;
    case 'on_tool_start':
      console.log(`Tool calling: ${event.name}`);
      break;
    case 'on_tool_end':
      console.log(`Tool result: ${event.data.output}`);
      break;
  }
}
```

---

## Rule: Next.js API Route for Streaming Graph Execution

```typescript
// app/api/assessment/analyze/route.ts
export async function POST(req: Request) {
  const { images, acceptedServices, locale } = await req.json();

  const config = {
    configurable: { thread_id: `assessment_${Date.now()}` },
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const graphStream = await assessmentGraph.stream(
          { images, acceptedServices, currentStep: 'analyzeVision' },
          { ...config, streamMode: 'custom' },
        );

        for await (const chunk of graphStream) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
          );
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

## References

- https://docs.langchain.com/oss/javascript/langgraph/streaming
- https://docs.langchain.com/oss/javascript/langgraph/interrupts
- https://langchain-ai.github.io/langgraphjs/how-tos/streaming
