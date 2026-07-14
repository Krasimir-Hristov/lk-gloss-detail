-- ============================================
-- LK Gloss & Detail — Chatbot Knowledge Base (Phase 8.2)
-- Idempotent: safe to run multiple times.
-- ============================================

-- Chatbot knowledge table with vector embeddings
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  language TEXT NOT NULL DEFAULT 'de',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chatbot_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read chatbot knowledge" ON chatbot_knowledge;
CREATE POLICY "Anyone can read chatbot knowledge"
  ON chatbot_knowledge FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage chatbot knowledge" ON chatbot_knowledge;
CREATE POLICY "Only admins can manage chatbot knowledge"
  ON chatbot_knowledge FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- HNSW index on embedding column for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_embedding
  ON chatbot_knowledge
  USING hnsw (embedding vector_cosine_ops);

-- Index on language for filtering
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_language
  ON chatbot_knowledge(language);

-- Cosine similarity search function
CREATE OR REPLACE FUNCTION match_chatbot_docs(
  query_embedding VECTOR(1536),
  match_count INTEGER DEFAULT 5,
  filter_language TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  metadata JSONB,
  language TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SET search_path = 'extensions, public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ck.id,
    ck.content,
    ck.metadata,
    ck.language,
    1 - (ck.embedding <=> query_embedding) AS similarity
  FROM public.chatbot_knowledge ck
  WHERE
    (filter_language IS NULL OR ck.language = filter_language)
  ORDER BY ck.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;