import { z } from "zod";

export const KnowledgeCategorySchema = z.enum([
	"company_policy",
	"booking_process",
	"mobile_service",
	"b2b",
	"faq",
	"general",
]);

export type KnowledgeCategory = z.infer<typeof KnowledgeCategorySchema>;

export const SaveKnowledgeEntrySchema = z.object({
	id: z.string().uuid().optional(),
	title: z
		.string()
		.trim()
		.min(2, "Title must be at least 2 characters")
		.max(160, "Title must be at most 160 characters"),
	content: z
		.string()
		.trim()
		.min(10, "Content must be at least 10 characters")
		.max(4000, "Content must be at most 4000 characters"),
	category: KnowledgeCategorySchema,
	keywords: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
});

export type SaveKnowledgeEntryInput = z.infer<typeof SaveKnowledgeEntrySchema>;
export type SaveKnowledgeEntryFormInput = z.input<typeof SaveKnowledgeEntrySchema>;

export const DeleteKnowledgeEntrySchema = z.object({
	id: z.string().uuid(),
});

export type DeleteKnowledgeEntryInput = z.infer<typeof DeleteKnowledgeEntrySchema>;

export const SemanticSearchInputSchema = z.object({
	query: z.string().trim().min(1, "Search query is required").max(500),
});

export type SemanticSearchInput = z.infer<typeof SemanticSearchInputSchema>;

export const ChatbotKnowledgeListItemSchema = z.object({
	id: z.string(),
	content: z.string(),
	metadata: z
		.object({
			category: KnowledgeCategorySchema.catch("general"),
			title: z.string().optional(),
			keywords: z.array(z.string()).optional(),
		})
		.passthrough(),
	language: z.string(),
	created_at: z.string(),
});

export type ChatbotKnowledgeListItem = z.infer<typeof ChatbotKnowledgeListItemSchema>;

export const VectorSearchResultSchema = z.object({
	id: z.string(),
	content: z.string(),
	metadata: z.record(z.string(), z.unknown()),
	language: z.string(),
	similarity: z.number(),
});

export type VectorSearchResult = z.infer<typeof VectorSearchResultSchema>;
