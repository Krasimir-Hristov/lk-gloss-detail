import { OpenAIEmbeddings } from "@langchain/openai";

/**
 * Shared OpenRouter embedding model.
 * Used by both the seed script and the chatbot API route
 * so search and index embeddings stay identical.
 */
export function getOpenRouterEmbeddings(): OpenAIEmbeddings {
	return new OpenAIEmbeddings({
		apiKey: process.env.OPENROUTER_API_KEY,
		modelName: "openai/text-embedding-3-small",
		configuration: {
			baseURL: "https://openrouter.ai/api/v1",
		},
	});
}
