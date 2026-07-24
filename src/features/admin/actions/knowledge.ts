"use server";

import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import { ChatOpenAI } from "@langchain/openai";
// @ts-expect-error - community module export types

import { getOpenRouterEmbeddings } from "@/lib/chatbot/embeddings";
import { createServiceClient } from "@/lib/supabase/service";

import {
	AiKnowledgeStructureSchema,
	type AiAgentInput,
	type SupportedLocale,
	type AiKnowledgeStructure,
} from "../schemas/knowledge";

import type { ChatbotKnowledgeEntry, VectorSearchResult } from "../types/knowledge";

// ── 1. Get Knowledge Entries ───────────────────────────────────────────────

export async function getKnowledgeEntriesAction(
	locale: SupportedLocale | "all" = "all",
	category?: string,
): Promise<{ success: boolean; data?: ChatbotKnowledgeEntry[]; error?: string }> {
	try {
		const supabase = createServiceClient();
		let query = supabase
			.from("chatbot_knowledge")
			.select("*")
			.order("created_at", { ascending: false });

		if (locale !== "all") {
			query = query.eq("language", locale);
		}

		if (category && category !== "all") {
			query = query.contains("metadata", { category });
		}

		const { data, error } = await query;
		if (error) throw error;

		return { success: true, data: data as ChatbotKnowledgeEntry[] };
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

		return { success: true, data };
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
		// Initialize Gemini 2.5 Flash via OpenRouter
		const model = new ChatOpenAI({
			apiKey: process.env.OPENROUTER_API_KEY,
			modelName: "google/gemini-2.5-flash",
			temperature: 0.2, // Low temperature for factual structuring
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

		if (input.mode === "db_import" && contextData) {
			systemPrompt += `\nContext Data from DB Service:\n${contextData}\nIncorporate this data into the knowledge blocks.`;
		}

		const prompt = `${systemPrompt}\n\nUser Input: ${input.inputText}`;

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
		const supabase = createServiceClient();
		const embeddings = getOpenRouterEmbeddings();

		// Create LangChain VectorStore integration
		const vectorStore = new SupabaseVectorStore(embeddings, {
			client: supabase,
			tableName: "chatbot_knowledge",
			queryName: "match_chatbot_docs",
		});

		const docsToInsert: Document[] = [];

		// Create a Document for each language
		for (const locale of ["de", "el", "en"] as const) {
			const entry = structure.entries[locale];
			if (!entry) continue;

			docsToInsert.push(
				new Document({
					pageContent: entry.content,
					metadata: {
						category: structure.category,
						title: entry.title,
						keywords: entry.keywords,
						language: locale,
						source: "admin_ai_wizard",
					},
				}),
			);
		}

		// Automatically embed and insert!
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
		const supabase = createServiceClient();
		const { error } = await supabase.from("chatbot_knowledge").delete().eq("id", id);
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
		const supabase = createServiceClient();
		const embeddings = getOpenRouterEmbeddings();

		// 1. Generate vector embedding for user query
		const queryEmbedding = await embeddings.embedQuery(query);

		// 2. Fetch knowledge rows from database
		let dbQuery = supabase
			.from("chatbot_knowledge")
			.select("id, content, metadata, language, embedding");

		if (locale && (locale as string) !== "all") {
			dbQuery = dbQuery.eq("language", locale);
		}

		const { data: rows, error } = await dbQuery;
		if (error) throw error;
		if (!rows || rows.length === 0) {
			return { success: true, data: [] };
		}

		// 3. Calculate exact Cosine Similarity (Dot Product)
		const results: VectorSearchResult[] = rows
			.map(
				(row: {
					id: string;
					content: string;
					metadata?: Record<string, unknown>;
					language: string;
					embedding: unknown;
				}) => {
					let sim = 0;
					let vec: number[] | null = null;

					if (Array.isArray(row.embedding)) {
						vec = row.embedding;
					} else if (typeof row.embedding === "string") {
						try {
							vec = JSON.parse(row.embedding);
						} catch {
							vec = null;
						}
					}

					if (vec && vec.length === queryEmbedding.length) {
						sim = vec.reduce((acc, v, i) => acc + v * queryEmbedding[i], 0);
					}

					return {
						id: row.id,
						content: row.content,
						metadata: row.metadata || {},
						language: row.language,
						similarity: Math.max(0, Math.min(1, sim)),
					};
				},
			)
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, 5);

		return { success: true, data: results };
	} catch (error: unknown) {
		console.error("Failed to test semantic search:", error);
		return { success: false, error: (error as Error)?.message || "Search simulation failed." };
	}
}
