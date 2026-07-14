/* eslint-disable no-console */
/**
 * Fixes match_chatbot_docs to include extensions in search_path.
 * Run: pnpm tsx -r dotenv/config scripts/fix-match-function.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SECRET_KEY!,
	{ auth: { persistSession: false } },
);

const SQL = `
CREATE OR REPLACE FUNCTION public.match_chatbot_docs(
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
`;

const main = async () => {
	// Try via SQL API
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { error } = await supabase.rpc("__exec_sql", { sql: SQL } as any);

	if (error) {
		console.log("RPC __exec_sql not available. Please run this SQL in Supabase SQL Editor:");
		console.log("─".repeat(60));
		console.log(SQL);
		console.log("─".repeat(60));
		process.exit(1);
	}

	console.log("✅ match_chatbot_docs recreated with extensions search_path!");
};

main().catch(console.error);
