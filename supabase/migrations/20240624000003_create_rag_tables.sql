-- ============================================
-- LK Gloss & Detail — RAG Tables (Phase 1.3)
-- ============================================

-- 1. Chatbot Knowledge Base
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB,
  language TEXT DEFAULT 'de',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chatbot_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chatbot knowledge"
  ON chatbot_knowledge FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage chatbot knowledge"
  ON chatbot_knowledge FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()));

-- 2. Service Vectors
CREATE TABLE IF NOT EXISTS service_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB,
  language TEXT DEFAULT 'de',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE service_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read service vectors"
  ON service_vectors FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage service vectors"
  ON service_vectors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()));

-- 3. Cosine Similarity Search Functions

CREATE OR REPLACE FUNCTION match_chatbot_docs(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_language TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  language TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    chatbot_knowledge.id,
    chatbot_knowledge.content,
    chatbot_knowledge.metadata,
    chatbot_knowledge.language,
    1 - (chatbot_knowledge.embedding <=> query_embedding) AS similarity
  FROM chatbot_knowledge
  WHERE
    chatbot_knowledge.embedding IS NOT NULL
    AND (1 - (chatbot_knowledge.embedding <=> query_embedding)) > match_threshold
    AND (filter_language IS NULL OR chatbot_knowledge.language = filter_language)
  ORDER BY chatbot_knowledge.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_service_vectors(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_language TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  service_id UUID,
  content TEXT,
  metadata JSONB,
  language TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    service_vectors.id,
    service_vectors.service_id,
    service_vectors.content,
    service_vectors.metadata,
    service_vectors.language,
    1 - (service_vectors.embedding <=> query_embedding) AS similarity
  FROM service_vectors
  WHERE
    service_vectors.embedding IS NOT NULL
    AND (1 - (service_vectors.embedding <=> query_embedding)) > match_threshold
    AND (filter_language IS NULL OR service_vectors.language = filter_language)
  ORDER BY service_vectors.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 4. HNSW Indexes (pgvector 0.5.0+)
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_embedding
  ON chatbot_knowledge
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);

CREATE INDEX IF NOT EXISTS idx_service_vectors_embedding
  ON service_vectors
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);
