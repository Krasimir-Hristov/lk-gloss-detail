import { z } from "zod";

import {
	KnowledgeCategorySchema,
	SupportedLocaleSchema,
	type KnowledgeCategory,
	type SupportedLocale,
	type AiKnowledgeStructure,
} from "@/features/admin/schemas/knowledge";

export type { KnowledgeCategory, SupportedLocale, AiKnowledgeStructure };

const NormalizedEmbeddingSchema = z.preprocess((val) => {
	if (typeof val === "string") {
		try {
			return JSON.parse(val);
		} catch {
			return undefined;
		}
	}
	return val;
}, z.array(z.number()).nullish());

export const ChatbotKnowledgeEntrySchema = z.object({
	id: z.string(),
	content: z.string(),
	embedding: NormalizedEmbeddingSchema,
	metadata: z
		.object({
			category: KnowledgeCategorySchema,
			title: z.string().optional(),
			keywords: z.array(z.string()).optional(),
		})
		.passthrough(),
	language: SupportedLocaleSchema,
	created_at: z.string(),
});

export type ChatbotKnowledgeEntry = z.infer<typeof ChatbotKnowledgeEntrySchema>;

export const VectorSearchResultSchema = z.object({
	id: z.string(),
	content: z.string(),
	metadata: z.record(z.string(), z.unknown()),
	language: SupportedLocaleSchema,
	similarity: z.number(),
});

export type VectorSearchResult = z.infer<typeof VectorSearchResultSchema>;
