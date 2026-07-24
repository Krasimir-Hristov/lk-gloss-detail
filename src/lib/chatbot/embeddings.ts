import { OpenAIEmbeddings } from "@langchain/openai";
import { z } from "zod";

export const VectorEmbeddingSchema = z.array(z.number()).min(1);

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
	const validA = VectorEmbeddingSchema.safeParse(vecA);
	const validB = VectorEmbeddingSchema.safeParse(vecB);

	if (!validA.success || !validB.success || validA.data.length !== validB.data.length) {
		return 0;
	}
	const dotProduct = validA.data.reduce((acc, val, i) => acc + val * validB.data[i], 0);
	return Math.max(0, Math.min(1, dotProduct));
}
