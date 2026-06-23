---
name: langchain-best-practices
description: LangChain.js TypeScript best practices for building LLM-powered applications. Use when writing, reviewing, or optimizing LangChain code involving chat models, embeddings, vector stores, RAG chains, tools, agents, streaming, structured output, and prompt templates.
license: MIT
metadata:
  author: lk-gloss-detail
  version: '1.0.0'
  date: June 2026
  abstract: Comprehensive LangChain.js best practices guide covering chat models, embeddings, vector stores, RAG patterns, tool calling, agents, streaming, structured output, and prompt engineering. Each rule includes detailed explanations, incorrect vs. correct code examples, and specific guidance for the LK Gloss & Detail AI features.
---

# LangChain.js Best Practices

Comprehensive guide for building LLM-powered applications with LangChain.js, maintained for the LK Gloss & Detail project. Contains rules across 7 categories, prioritized by impact.

## When to Apply

Reference these guidelines when:

- Setting up chat models (OpenAI, OpenRouter, etc.)
- Implementing RAG (Retrieval-Augmented Generation) pipelines
- Creating and managing vector stores with embeddings
- Building tool-calling agents
- Implementing streaming responses
- Using structured output for type-safe LLM responses
- Writing prompt templates and chains
- Integrating LangChain with LangGraph

## Rule Categories by Priority

| Priority | Category                 | Impact      | Prefix        |
| -------- | ------------------------ | ----------- | ------------- |
| 1        | Chat Models & Providers  | CRITICAL    | `models-`     |
| 2        | RAG & Vector Stores      | CRITICAL    | `rag-`        |
| 3        | Tools & Function Calling | HIGH        | `tools-`      |
| 4        | Agents                   | HIGH        | `agents-`     |
| 5        | Streaming & Callbacks    | MEDIUM-HIGH | `stream-`     |
| 6        | Structured Output        | MEDIUM      | `structured-` |
| 7        | Prompts & Chains         | MEDIUM      | `prompts-`    |

## How to Use

Read individual rule files for detailed explanations and code examples:

```
references/models-providers.md
references/rag-vector-stores.md
references/tools-function-calling.md
references/agents.md
references/streaming-callbacks.md
references/structured-output.md
references/prompts-chains.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect pattern with explanation
- Correct pattern with explanation
- Performance considerations
- Additional context and references

## Core Principles

**1. Use `createAgent` for simple agents, LangGraph for complex workflows.**
LangChain's `createAgent` is the recommended high-level API for most agent use cases. Only drop down to LangGraph when you need fine-grained control over state, branching, or human-in-the-loop.

**2. Always use Zod schemas for tool definitions.**
Zod provides runtime validation and automatic TypeScript type inference. Every tool should have a Zod schema defining its input parameters.

**3. Prefer `.pipe()` for chain composition.**
The `.pipe()` method creates clean, readable chains. Avoid deeply nested `RunnableSequence` constructors.

**4. Use `withStructuredOutput()` for type-safe LLM responses.**
When you need the LLM to return structured data (JSON), use `.withStructuredOutput()` with a Zod schema. This ensures the output matches your expected type.

**5. Stream by default for better UX.**
Always stream LLM responses when the user is waiting. Use `for await...of` loops with `.stream()` for real-time token delivery.

**6. Tag your vector store documents with metadata.**
Always include `source`, `language`, and relevant metadata when embedding documents. This enables filtering and better retrieval quality.

**7. Handle errors gracefully — LLMs are non-deterministic.**
Always wrap LLM calls in try/catch. Implement retry logic for transient failures. Validate structured outputs even when using `withStructuredOutput()`.

## References

- https://docs.langchain.com/oss/javascript
- https://reference.langchain.com/javascript
- https://js.langchain.com/docs
- https://docs.langchain.com/oss/javascript/langchain/rag
