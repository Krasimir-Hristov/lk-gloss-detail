# Checkpointing & Persistence (checkpoint-)

## Rule: Always Use a Checkpointer in Production

**Why it matters:** Checkpointers save graph state after every node execution. This enables fault tolerance (resume after crash), human-in-the-loop (pause and resume), and time-travel debugging.

### ❌ Incorrect — No Checkpointer

```typescript
const graph = workflow.compile();
// ❌ State is lost on crash, no HITL, no debugging
```

### ✅ Correct — With Checkpointer

```typescript
import { MemorySaver } from '@langchain/langgraph';

// Development: in-memory
const memoryCheckpointer = new MemorySaver();
const graph = workflow.compile({ checkpointer: memoryCheckpointer });

// Production: PostgreSQL (via Supabase)
// import { AsyncPostgresSaver } from "@langchain/langgraph-checkpoint-postgres"
// const checkpointer = await AsyncPostgresSaver.fromConnString(
//   process.env.DATABASE_URL!
// )
```

---

## Rule: Thread IDs for Conversation Isolation

**Why it matters:** Each conversation/session needs a unique `thread_id`. The checkpointer uses this to store and retrieve state per conversation.

```typescript
// Each user session gets a unique thread_id
const config = {
  configurable: {
    thread_id: `assessment_${userId}_${Date.now()}`,
  },
};

// First invocation — creates new state
await graph.invoke(initialState, config);

// Subsequent invocations with same thread_id — resumes from checkpoint
await graph.invoke({ images: [newImage] }, config);

// Different thread_id — completely separate conversation
await graph.invoke(initialState, {
  configurable: { thread_id: `assessment_${otherUserId}_${Date.now()}` },
});
```

---

## Rule: Checkpoint Structure

```typescript
// What gets saved in each checkpoint:
interface Checkpoint {
  v: number; // Version
  id: string; // Checkpoint ID
  ts: string; // Timestamp (ISO)
  channel_values: {
    // Full state at this point
    messages: BaseMessage[];
    carSize: string;
    dirtLevel: string;
    // ... all state fields
  };
  channel_versions: Record<string, number>; // Version per channel
  versions_seen: Record<string, Record<string, number>>;
  pending_sends: Send[]; // Pending parallel tasks
}

// Access checkpoint history
const history = [];
for await (const state of graph.getStateHistory(config)) {
  history.push(state);
}
console.log(`Graph has ${history.length} checkpoints`);
```

---

## Rule: Resume After Interruption

```typescript
import { Command } from '@langchain/langgraph';

// Graph pauses at interrupt point
const stream = await graph.stream(initialState, config);

// Check if interrupted
if (stream.interrupted) {
  const interruptInfo = stream.interrupts[0].value;
  console.log('Graph paused:', interruptInfo);

  // Get human input (e.g., admin approval)
  const humanDecision = await getHumanInput(interruptInfo);

  // Resume with Command
  const resumedStream = await graph.stream(
    new Command({ resume: humanDecision }),
    config,
  );
}
```

---

## Rule: Time Travel — Replay from Previous State

```typescript
// Get state at a specific checkpoint
const history = [];
for await (const state of graph.getStateHistory(config)) {
  history.push(state);
}

// Replay from 3 checkpoints ago
const previousState = history[2];
const replayConfig = {
  ...config,
  configurable: {
    ...config.configurable,
    checkpoint_id: previousState.config.configurable.checkpoint_id,
  },
};

// Graph replays from that checkpoint
const result = await graph.invoke(null, replayConfig);
```

---

## Rule: Production Checkpointer with Supabase

```typescript
// For production, use PostgreSQL checkpointer backed by Supabase
import { AsyncPostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

const checkpointer = await AsyncPostgresSaver.fromConnString(
  process.env.DATABASE_URL!, // Supabase Postgres connection string
);

const graph = workflow.compile({ checkpointer });

// Checkpoints are automatically stored in Supabase Postgres
// Survives server restarts and deployments
```

---

## References

- https://docs.langchain.com/oss/javascript/langgraph/checkpointers
- https://docs.langchain.com/oss/javascript/langgraph/interrupts
- https://langchain-ai.github.io/langgraphjs/how-tos/persistence
