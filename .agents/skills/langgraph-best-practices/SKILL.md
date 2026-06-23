---
name: langgraph-best-practices
description: LangGraph.js TypeScript best practices for building stateful, multi-step agent workflows. Use when writing, reviewing, or optimizing LangGraph code involving StateGraph, nodes, conditional edges, checkpoints, streaming, human-in-the-loop, subgraphs, parallel execution, and Command-based routing.
license: MIT
metadata:
  author: lk-gloss-detail
  version: '1.0.0'
  date: June 2026
  abstract: Comprehensive LangGraph.js best practices guide covering state management, graph architecture, node design, checkpointing, streaming, human-in-the-loop patterns, parallel execution with Send API, and Command-based routing. Each rule includes detailed explanations, incorrect vs. correct code examples, and specific guidance for the LK Gloss & Detail AI assessment workflow.
---

# LangGraph.js Best Practices

Comprehensive guide for building stateful agent workflows with LangGraph.js, maintained for the LK Gloss & Detail project. Contains rules across 7 categories, prioritized by impact.

## When to Apply

Reference these guidelines when:

- Designing multi-step agent workflows
- Implementing state management with `StateGraph`
- Setting up checkpointing and persistence
- Building human-in-the-loop approval flows
- Implementing parallel agent execution (Send API)
- Streaming from agents with tool calls
- Creating orchestrator-worker patterns
- Debugging graph execution and state transitions

## Rule Categories by Priority

| Priority | Category                      | Impact      | Prefix        |
| -------- | ----------------------------- | ----------- | ------------- |
| 1        | State Management              | CRITICAL    | `state-`      |
| 2        | Graph Architecture            | CRITICAL    | `graph-`      |
| 3        | Node Design                   | HIGH        | `nodes-`      |
| 4        | Checkpointing & Persistence   | HIGH        | `checkpoint-` |
| 5        | Streaming & Interrupts        | MEDIUM-HIGH | `stream-`     |
| 6        | Parallel Execution (Send API) | MEDIUM      | `parallel-`   |
| 7        | Subgraphs & Composition       | MEDIUM      | `subgraph-`   |

## How to Use

Read individual rule files for detailed explanations and code examples:

```
references/state-management.md
references/graph-architecture.md
references/node-design.md
references/checkpointing-persistence.md
references/streaming-interrupts.md
references/parallel-execution.md
references/subgraphs-composition.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect pattern with explanation
- Correct pattern with explanation
- Performance considerations
- LK Gloss & Detail-specific examples where applicable

## Core Principles

**1. State is the single source of truth.**
Every node reads from and writes to the shared state. Never store intermediate results in external variables. Use `StateSchema` with proper reducers for append-only fields.

**2. Nodes are pure functions.**
A node function takes state, returns state updates. Side effects (API calls, DB writes) go inside nodes but the state transition is always `(state) => partialState`. Use `Command` for dynamic routing.

**3. Conditional edges control flow, not nodes.**
Nodes should not decide where to go next. Use `addConditionalEdges()` with a router function that reads state and returns the next node name or `END`.

**4. Always compile with a checkpointer for production.**
`MemorySaver` is for development only. Use `AsyncPostgresSaver` or `AsyncSqliteSaver` for production persistence. This enables fault tolerance, human-in-the-loop, and time travel debugging.

**5. Stream from graphs, not individual nodes.**
Use `graph.stream()` or `graph.streamEvents()` to get real-time updates. This gives you visibility into every state transition and node execution.

**6. Use Send API for dynamic parallelism.**
When you don't know how many parallel workers you need at compile time, use `Send` in conditional edge routers to dynamically spawn worker nodes.

**7. Prefer Command-based routing for complex graphs.**
Instead of separate conditional edge functions, nodes can return `new Command({ goto: "nextNode" })` or `new Command({ resume: value })` for cleaner, more maintainable graphs.

## References

- https://docs.langchain.com/oss/javascript/langgraph
- https://langchain-ai.github.io/langgraphjs
- https://docs.langchain.com/oss/javascript/langgraph/use-graph-api
- https://docs.langchain.com/oss/javascript/langgraph/streaming
