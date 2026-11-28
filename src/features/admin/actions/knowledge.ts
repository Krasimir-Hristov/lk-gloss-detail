"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
	ChatbotKnowledgeListItemSchema,
	DeleteKnowledgeEntrySchema,
	KnowledgeCategorySchema,
	SaveKnowledgeEntrySchema,
	SemanticSearchInputSchema,
	VectorSearchResultSchema,
	type ChatbotKnowledgeListItem,
	type SaveKnowledgeEntryFormInput,
	type VectorSearchResult,
} from "@/features/admin/schemas/knowledge";
import { routing } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getOpenRouterEmbeddings } from "@/lib/chatbot/embeddings";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

const KNOWLEDGE_LIST_SELECT = "id, content, metadata, language, created_at";

interface MatchChatbotDocsRpcClient {
	rpc: (
		fn: "match_chatbot_docs",
		args: {
			query_embedding: number[];
			match_count: number;
			filter_language: string | null;
		},
	) => Promise<{ data: unknown; error: { message: string } | null }>;
}

const revalidateKnowledgePaths = (): void => {
	for (const loc of routing.locales) {
		try {
			revalidatePath(`/${loc}/admin/chatbot-kb`);
		} catch {
			// Ignore if outside request context
		}
	}
};

export const getKnowledgeEntriesAction = async (
	category?: string,
): Promise<ActionResult<ChatbotKnowledgeListItem[]>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		let validCategory: z.infer<typeof KnowledgeCategorySchema> | undefined;
		if (category && category !== "all") {
			const parsedCategory = KnowledgeCategorySchema.safeParse(category);
			if (!parsedCategory.success) {
				return { success: false, error: "Invalid knowledge category" };
			}
			validCategory = parsedCategory.data;
		}

		let query = auth.supabase
			.from("chatbot_knowledge")
			.select(KNOWLEDGE_LIST_SELECT)
			.order("created_at", { ascending: false });

		if (validCategory) {
			query = query.contains("metadata", { category: validCategory });
		}

		const { data, error } = await query;
		if (error) {
			console.error("[getKnowledgeEntriesAction] DB error:", error.message);
			return { success: false, error: "Failed to fetch knowledge entries" };
		}

		const parsedRows = z.array(ChatbotKnowledgeListItemSchema).safeParse(data ?? []);
		if (!parsedRows.success) {
			console.error("[getKnowledgeEntriesAction] Validation error:", parsedRows.error.flatten());
			return { success: false, error: "Invalid knowledge records in database" };
		}

		return { success: true, data: parsedRows.data };
	} catch (err: unknown) {
		console.error("[getKnowledgeEntriesAction] Unexpected error:", err);
		return { success: false, error: "Failed to fetch entries" };
	}
};

export const saveKnowledgeEntryAction = async (
	input: SaveKnowledgeEntryFormInput,
): Promise<ActionResult<ChatbotKnowledgeListItem>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsed = SaveKnowledgeEntrySchema.safeParse(input);
		if (!parsed.success) {
			return {
				success: false,
				error: parsed.error.issues[0]?.message ?? "Invalid knowledge entry input",
			};
		}

		const { id, title, content, category, keywords } = parsed.data;
		const embeddings = getOpenRouterEmbeddings();
		const embedding = await embeddings.embedQuery(`${title}\n\n${content}`);

		const payload = {
			content,
			embedding,
			language: "any",
			metadata: {
				category,
				title,
				keywords,
				source: "admin_manual",
			},
		};

		const query = id
			? auth.supabase
					.from("chatbot_knowledge")
					.update(payload)
					.eq("id", id)
					.select(KNOWLEDGE_LIST_SELECT)
					.single()
			: auth.supabase
					.from("chatbot_knowledge")
					.insert(payload)
					.select(KNOWLEDGE_LIST_SELECT)
					.single();

		const { data, error } = await query;
		if (error || !data) {
			console.error("[saveKnowledgeEntryAction] DB error:", error?.message ?? "No data returned");
			return { success: false, error: "Failed to save knowledge entry" };
		}

		const parsedItem = ChatbotKnowledgeListItemSchema.safeParse(data);
		if (!parsedItem.success) {
			console.error("[saveKnowledgeEntryAction] Validation error:", parsedItem.error.flatten());
			return { success: false, error: "Saved entry failed validation" };
		}

		revalidateKnowledgePaths();
		return { success: true, data: parsedItem.data };
	} catch (err: unknown) {
		console.error("[saveKnowledgeEntryAction] Unexpected error:", err);
		return { success: false, error: "Failed to save to database" };
	}
};

export const deleteKnowledgeEntryAction = async (id: string): Promise<ActionResult<void>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsed = DeleteKnowledgeEntrySchema.safeParse({ id });
		if (!parsed.success) {
			return { success: false, error: "Invalid knowledge entry ID" };
		}

		const { error } = await auth.supabase
			.from("chatbot_knowledge")
			.delete()
			.eq("id", parsed.data.id);

		if (error) {
			console.error("[deleteKnowledgeEntryAction] DB error:", error.message);
			return { success: false, error: "Failed to delete entry" };
		}

		revalidateKnowledgePaths();
		return { success: true, data: undefined };
	} catch (err: unknown) {
		console.error("[deleteKnowledgeEntryAction] Unexpected error:", err);
		return { success: false, error: "Failed to delete entry" };
	}
};

export const testSemanticSearchAction = async (
	query: string,
): Promise<ActionResult<VectorSearchResult[]>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsed = SemanticSearchInputSchema.safeParse({ query });
		if (!parsed.success) {
			return { success: false, error: "Search query is required" };
		}

		const embeddings = getOpenRouterEmbeddings();
		const queryEmbedding = await embeddings.embedQuery(parsed.data.query);

		const rpcClient = auth.supabase as unknown as MatchChatbotDocsRpcClient;
		const { data, error } = await rpcClient.rpc("match_chatbot_docs", {
			query_embedding: queryEmbedding,
			match_count: 10,
			filter_language: null,
		});

		if (error) {
			console.error("[testSemanticSearchAction] RPC error:", error.message);
			return { success: false, error: "Search test failed" };
		}

		const parsedResults = z.array(VectorSearchResultSchema).safeParse(data ?? []);
		if (!parsedResults.success) {
			console.error("[testSemanticSearchAction] Validation error:", parsedResults.error.flatten());
			return { success: false, error: "Invalid search results" };
		}

		return { success: true, data: parsedResults.data };
	} catch (err: unknown) {
		console.error("[testSemanticSearchAction] Unexpected error:", err);
		return { success: false, error: "Search test failed" };
	}
};
