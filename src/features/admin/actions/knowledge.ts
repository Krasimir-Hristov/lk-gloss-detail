"use server";

// @ts-expect-error - community module export types
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

import {
	AiAgentInputSchema,
	AiKnowledgeStructureSchema,
	KnowledgeCategorySchema,
	SupportedLocaleSchema,
	type AiAgentInput,
	type AiKnowledgeStructure,
	type SupportedLocale,
} from "@/features/admin/schemas/knowledge";
import {
	ChatbotKnowledgeEntrySchema,
	VectorSearchResultSchema,
	type ChatbotKnowledgeEntry,
	type VectorSearchResult,
} from "@/features/admin/types/knowledge";
import { cosineSimilarity, getOpenRouterEmbeddings } from "@/lib/chatbot/embeddings";
import { createServiceClient } from "@/lib/supabase/service";

// ── 1. Get Knowledge Entries ───────────────────────────────────────────────

export async function getKnowledgeEntriesAction(
	locale: SupportedLocale | "all" = "all",
	category?: string,
): Promise<{ success: boolean; data?: ChatbotKnowledgeEntry[]; error?: string }> {
	try {
		const validLocale = SupportedLocaleSchema.or(z.literal("all")).parse(locale);
		const validCategory =
			category && category !== "all" ? KnowledgeCategorySchema.parse(category) : undefined;

		const supabase = createServiceClient();
		let query = supabase
			.from("chatbot_knowledge")
			.select("*")
			.order("created_at", { ascending: false });

		if (validLocale !== "all") {
			query = query.eq("language", validLocale);
		}

		if (validCategory) {
			query = query.contains("metadata", { category: validCategory });
		}

		const { data, error } = await query;
		if (error) throw error;

		const parsedData = z.array(ChatbotKnowledgeEntrySchema).parse(data || []);

		return { success: true, data: parsedData };
	} catch (error) {
		console.error("Failed to fetch knowledge entries:", error);
		return { success: false, error: "Failed to fetch entries" };
	}
}

// ── 2. Get DB Services for Import ──────────────────────────────────────────

export async function getServicesListAction(): Promise<{
	success: boolean;
	data?: Array<Record<string, unknown>>;
	error?: string;
}> {
	try {
		const supabase = createServiceClient();
		const { data, error } = await supabase
			.from("services")
			.select(
				"id, name, short_description, price_small, price_medium, price_large, price_suv, duration_hours, category",
			)
			.eq("active", true)
			.order("sort_order", { ascending: true });

		if (error) throw error;

		return { success: true, data: data as Array<Record<string, unknown>> };
	} catch (error) {
		console.error("Failed to fetch services:", error);
		return { success: false, error: "Failed to fetch services" };
	}
}

// ── 3. AI Agent Process Action ──────────────────────────────────────────────

export async function aiAgentProcessAction(
	input: AiAgentInput,
	contextData?: string,
): Promise<{ success: boolean; data?: AiKnowledgeStructure; error?: string }> {
	try {
		const validInput = AiAgentInputSchema.parse(input);

		// Initialize Gemini 2.5 Flash via OpenRouter with explicit 45s timeout
		const model = new ChatOpenAI({
			apiKey: process.env.OPENROUTER_API_KEY,
			modelName: "google/gemini-2.5-flash",
			temperature: 0.2,
			timeout: 45000,
			configuration: {
				baseURL: "https://openrouter.ai/api/v1",
			},
		});

		// Use Structured Output to enforce the schema
		const structuredModel = model.withStructuredOutput(AiKnowledgeStructureSchema);

		let systemPrompt = `You are an expert AI assistant for "LK Gloss & Detail", a premium car detailing company.
Your task is to convert the user's input into perfectly structured, self-contained knowledge blocks for a RAG vector database.
You must return a valid JSON object matching the requested schema.
You must translate and formulate the knowledge into three languages: German (de), Greek (el), and English (en).
Make the text factual, concise, and highly semantic (include the business name or context if helpful).
If the user's input is a Service but missing critical info (like price or duration), you may include a 'missingInfoPrompt'.
`;

		if (validInput.mode === "db_import" && contextData) {
			systemPrompt += `\nContext Data from DB Service:\n${contextData}\nIncorporate this data into the knowledge blocks.`;
		}

		const prompt = `${systemPrompt}\n\nUser Input: ${validInput.inputText}`;

		const result = await structuredModel.invoke(prompt);

		return { success: true, data: result };
	} catch (error) {
		console.error("Failed to process with AI Agent:", error);
		return { success: false, error: "AI Agent processing failed. Please try again." };
	}
}

// ── 4. Save & Vectorize Knowledge (Batch) ───────────────────────────────────

export async function saveBatchKnowledgeAction(
	structure: AiKnowledgeStructure,
): Promise<{ success: boolean; error?: string }> {
	try {
		const validStructure = AiKnowledgeStructureSchema.parse(structure);
		const supabase = createServiceClient();
		const embeddings = getOpenRouterEmbeddings();

		const docsToInsert: Document[] = [];

		for (const locale of ["de", "el", "en"] as const) {
			const entry = validStructure.entries[locale];
			if (!entry) continue;

			// Perform explicit delete / replacement by title & language to prevent duplicate vectors
			await supabase
				.from("chatbot_knowledge")
				.delete()
				.eq("language", locale)
				.contains("metadata", { title: entry.title });

			docsToInsert.push(
				new Document({
					pageContent: entry.content,
					metadata: {
						category: validStructure.category,
						title: entry.title,
						keywords: entry.keywords,
						language: locale,
						source: "admin_ai_wizard",
					},
				}),
			);
		}

		const vectorStore = new SupabaseVectorStore(embeddings, {
			client: supabase,
			tableName: "chatbot_knowledge",
			queryName: "match_chatbot_docs",
		});

		await vectorStore.addDocuments(docsToInsert);

		return { success: true };
	} catch (error) {
		console.error("Failed to vectorise and save knowledge:", error);
		return { success: false, error: "Failed to save to database." };
	}
}

// ── 5. Delete Knowledge Entry ───────────────────────────────────────────────

export async function deleteKnowledgeEntryAction(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const validId = z.string().uuid().parse(id);
		const supabase = createServiceClient();
		const { error } = await supabase.from("chatbot_knowledge").delete().eq("id", validId);
		if (error) throw error;
		return { success: true };
	} catch (error) {
		console.error("Failed to delete knowledge entry:", error);
		return { success: false, error: "Failed to delete entry." };
	}
}

// ── 6. Test Semantic Search (RAG Simulator) ─────────────────────────────────

export async function testSemanticSearchAction(
	query: string,
	locale: SupportedLocale,
): Promise<{ success: boolean; data?: VectorSearchResult[]; error?: string }> {
	try {
		const validQuery = z.string().min(1).parse(query);
		const validLocale = SupportedLocaleSchema.parse(locale);

		const supabase = createServiceClient();
		const embeddings = getOpenRouterEmbeddings();

		// 1. Generate vector embedding for user query
		const queryEmbedding = await embeddings.embedQuery(validQuery);

		// 2. Fetch knowledge rows from database
		let dbQuery = supabase
			.from("chatbot_knowledge")
			.select("id, content, metadata, language, embedding");

		if (validLocale && (validLocale as string) !== "all") {
			dbQuery = dbQuery.eq("language", validLocale);
		}

		const { data: rows, error } = await dbQuery;
		if (error) throw error;
		if (!rows || rows.length === 0) {
			return { success: true, data: [] };
		}

		// 3. Calculate exact Cosine Similarity
		const rawResults = rows
			.map(
				(row: {
					id: string;
					content: string;
					metadata?: Record<string, unknown>;
					language: string;
					embedding: unknown;
				}) => {
					let vec: number[] | null = null;

					if (Array.isArray(row.embedding)) {
						vec = row.embedding as number[];
					} else if (typeof row.embedding === "string") {
						try {
							vec = JSON.parse(row.embedding);
						} catch {
							vec = null;
						}
					}

					const similarity = vec ? cosineSimilarity(queryEmbedding, vec) : 0;

					return {
						id: row.id,
						content: row.content,
						metadata: (row.metadata as Record<string, unknown>) || {},
						language: row.language,
						similarity,
					};
				},
			)
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, 5);

		const parsedResults = z.array(VectorSearchResultSchema).parse(rawResults);

		return { success: true, data: parsedResults };
	} catch (error: unknown) {
		console.error("Failed to test semantic search:", error);
		return { success: false, error: (error as Error)?.message || "Search simulation failed." };
	}
}
