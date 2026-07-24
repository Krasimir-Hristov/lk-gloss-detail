import { z } from "zod";

export const KnowledgeCategorySchema = z.enum([
	"interior",
	"exterior",
	"paint_correction",
	"headlights_special",
	"company_policy",
	"general",
]);

export type KnowledgeCategory = z.infer<typeof KnowledgeCategorySchema>;

export const LocaleSchema = z.enum(["de", "el", "en"]);
export type SupportedLocale = z.infer<typeof LocaleSchema>;

export const AiStructuredKnowledgeEntrySchema = z.object({
	title: z.string().describe("Short, descriptive title in the target language"),
	content: z
		.string()
		.describe("Dense, self-contained semantic knowledge text in the target language"),
	keywords: z.array(z.string()).describe("List of keywords related to this entry"),
});

export const AiKnowledgeStructureSchema = z.object({
	category: KnowledgeCategorySchema,
	suggestedTitle: z.string().describe("Short descriptive title of this knowledge block"),
	missingInfoPrompt: z
		.string()
		.optional()
		.describe("If crucial information is missing in the input, ask the user to clarify"),
	entries: z.object({
		de: AiStructuredKnowledgeEntrySchema,
		el: AiStructuredKnowledgeEntrySchema,
		en: AiStructuredKnowledgeEntrySchema,
	}),
});

export type AiKnowledgeStructure = z.infer<typeof AiKnowledgeStructureSchema>;

export const AiAgentInputSchema = z.object({
	inputText: z.string().min(1, "Input text is required"),
	mode: z.enum(["free_form", "db_import", "form"]),
});

export type AiAgentInput = z.infer<typeof AiAgentInputSchema>;
