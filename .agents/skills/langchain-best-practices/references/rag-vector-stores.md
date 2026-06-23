# RAG & Vector Stores (rag-)

## Rule: Always Chunk Documents Before Embedding

**Why it matters:** Embedding models have token limits. Large documents lose semantic meaning. Chunking with overlap preserves context across boundaries.

### ❌ Incorrect — Embedding Full Documents

```typescript
const docs = await loader.load();
// Document may be 10,000+ tokens — exceeds embedding limit
await vectorStore.addDocuments(docs);
```

### ✅ Correct — Split with Overlap

```typescript
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // ~250 words per chunk
  chunkOverlap: 200, // 20% overlap preserves context
  separators: ['\n\n', '\n', '. ', ' ', ''], // split at natural boundaries
});

const docs = await loader.load();
const chunks = await splitter.splitDocuments(docs);
await vectorStore.addDocuments(chunks);
```

---

## Rule: Metadata is Critical for Retrieval Quality

**Why it matters:** Metadata enables filtering (by language, category, etc.) and provides context to the LLM about where information came from.

```typescript
const chunks = await splitter.splitDocuments(docs);

// Add metadata to each chunk
const enhancedChunks = chunks.map((chunk, i) => ({
  ...chunk,
  metadata: {
    ...chunk.metadata,
    language: 'de', // ISO language code
    category: 'services', // Content category
    source: 'faq.md', // Source document
    chunkIndex: i, // Position in document
    createdAt: new Date().toISOString(),
  },
}));

await vectorStore.addDocuments(enhancedChunks);
```

---

## Rule: Supabase pgvector Integration

**Why it matters:** Supabase with pgvector keeps embeddings and application data in one place. Use the Supabase vector store integration for seamless RAG.

```typescript
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
  dimensions: 1536,
});

const vectorStore = new SupabaseVectorStore(embeddings, {
  client,
  tableName: 'chatbot_knowledge',
  queryName: 'match_chatbot_docs', // PostgreSQL function for similarity search
});
```

---

## Rule: Create Similarity Search Function in PostgreSQL

```sql
-- supabase/migrations/xxx_match_docs.sql
CREATE OR REPLACE FUNCTION match_chatbot_docs(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_language text DEFAULT NULL
)
RETURNS TABLE(
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chatbot_knowledge.id,
    chatbot_knowledge.content,
    chatbot_knowledge.metadata,
    1 - (chatbot_knowledge.embedding <=> query_embedding) AS similarity
  FROM chatbot_knowledge
  WHERE
    1 - (chatbot_knowledge.embedding <=> query_embedding) > match_threshold
    AND (filter_language IS NULL OR chatbot_knowledge.metadata->>'language' = filter_language)
  ORDER BY chatbot_knowledge.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Rule: Retrieval with Reranking

**Why it matters:** Initial vector search is fast but imprecise. Reranking with a cross-encoder improves result quality.

```typescript
// Step 1: Broad retrieval (top 20)
const initialDocs = await vectorStore.similaritySearch(query, 20);

// Step 2: Rerank with LLM
const rerankerPrompt = `Rate how relevant each document is to the query on a scale of 1-10.
Query: ${query}

Documents:
${initialDocs.map((d, i) => `${i + 1}. ${d.pageContent}`).join('\n')}

Return JSON: { "rankings": [{ "index": number, "score": number }] }`;

const rankings = await model
  .withStructuredOutput(
    z.object({
      rankings: z.array(z.object({ index: z.number(), score: z.number() })),
    }),
  )
  .invoke(rerankerPrompt);

// Step 3: Take top 5 reranked
const topDocs = rankings.rankings
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)
  .map((r) => initialDocs[r.index]);
```

---

## Rule: RAG Prompt Template

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts';

const ragPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a helpful assistant for LK Gloss & Detail, a mobile car detailing service.
Answer the user's question based ONLY on the provided context.
If the context doesn't contain the answer, say "I don't have that information."
Always respond in the same language as the user's question.

Context:
{context}`,
  ],
  ['human', '{question}'],
]);
```

---

## References

- https://docs.langchain.com/oss/javascript/langchain/rag
- https://js.langchain.com/docs/integrations/vectorstores/supabase
- https://supabase.com/docs/guides/ai
