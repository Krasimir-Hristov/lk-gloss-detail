import type {
	KnowledgeCategory,
	SupportedLocale,
	AiKnowledgeStructure,
} from "../schemas/knowledge";
export type { SupportedLocale, AiKnowledgeStructure };

export interface ChatbotKnowledgeEntry {
	id: string;
	content: string;
	embedding?: number[];
	metadata: {
		category: KnowledgeCategory;
		title: string;
		keywords: string[];
		[key: string]: unknown;
	};
	language: SupportedLocale;
	created_at: string;
}

export interface VectorSearchResult {
	id: string;
	content: string;
	metadata: Record<string, unknown>;
	language: SupportedLocale;
	similarity: number;
}
