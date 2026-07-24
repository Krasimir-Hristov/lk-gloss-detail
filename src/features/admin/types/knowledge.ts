import { z } from "zod";

import {
	KnowledgeCategorySchema,
	SupportedLocaleSchema,
	type KnowledgeCategory,
	type SupportedLocale,
	type AiKnowledgeStructure,
} from "@/features/admin/schemas/knowledge";

export type { KnowledgeCategory, SupportedLocale, AiKnowledgeStructure };

export const ChatbotKnowledgeEntrySchema = z.object({
	id: z.string(),
	content: z.string(),
	embedding: z.array(z.number()).optional(),
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
