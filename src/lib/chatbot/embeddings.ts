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

/**
 * Computes exact Cosine Similarity (dot product for normalized vectors)
 * between two embedding vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
	if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
		return 0;
	}
	const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
	return Math.max(0, Math.min(1, dotProduct));
}
