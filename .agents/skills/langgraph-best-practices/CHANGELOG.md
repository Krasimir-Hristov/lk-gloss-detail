# Changelog

## 1.0.0 — June 2026

### Initial Release

- 7 rule categories covering LangGraph.js best practices
- State Management (state-)
- Graph Architecture (graph-)
- Node Design (nodes-)
- Checkpointing & Persistence (checkpoint-)
- Streaming & Interrupts (stream-)
- Parallel Execution — Send API (parallel-)
- Subgraphs & Composition (subgraph-)

### Key Patterns Documented

- `StateSchema` with Zod and `ReducedValue` for append-only arrays
- Complete `CarAssessmentState` schema for LK Gloss & Detail
- Conditional edges vs Command-based routing
- Retry policies for unreliable nodes
- Human-in-the-loop with `interrupt()`
- Orchestrator-Worker pattern with Send API
- Map-Reduce pattern for parallel processing
- Subgraph composition and state mapping
- Production checkpointing with Supabase PostgreSQL
- SSE streaming from Next.js API routes
