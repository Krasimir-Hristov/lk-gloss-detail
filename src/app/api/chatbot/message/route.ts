import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getOpenRouterEmbeddings } from "@/lib/chatbot/embeddings";
import { createServiceClient } from "@/lib/supabase/service";

import type { NextRequest } from "next/server";

// ── Request Schema ──────────────────────────────────────────────────────────

const ChatbotRequestSchema = z.object({
	message: z.string().min(1, "Message is required").max(2000, "Message too long"),
	locale: z.enum(["de", "en", "el"]).default("de"),
	history: z
		.array(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string(),
			}),
		)
		.max(20)
		.default([]),
});

// ── Types ───────────────────────────────────────────────────────────────────

interface MatchDoc {
	id: string;
	content: string;
	metadata: Record<string, unknown>;
	language: string;
	similarity: number;
}

// ── Shared embedding model (OpenRouter via LangChain) ───────────────────────

const embeddings = getOpenRouterEmbeddings();

async function getEmbedding(text: string): Promise<number[]> {
	return embeddings.embedQuery(text);
}

// ── Stream from OpenRouter LLM ──────────────────────────────────────────────

async function streamLLMResponse(
	messages: Array<{ role: string; content: string }>,
): Promise<ReadableStream<Uint8Array>> {
	const model = new ChatOpenAI({
		apiKey: process.env.OPENROUTER_API_KEY,
		modelName: "deepseek/deepseek-v4-flash",
		temperature: 0.7,
		maxTokens: 1000,
		streaming: true,
		configuration: {
			baseURL: "https://openrouter.ai/api/v1",
		},
	});

	const stream = await model.stream(
		messages.map((m) => {
			if (m.role === "system") return new SystemMessage(m.content);
			if (m.role === "assistant") return new AIMessage(m.content);
			return new HumanMessage(m.content);
		}),
	);

	const encoder = new TextEncoder();

	return new ReadableStream({
		async start(controller) {
			try {
				for await (const chunk of stream) {
					const content = typeof chunk.content === "string" ? chunk.content : "";
					if (content) {
						const sseData = `data: ${JSON.stringify({ content })}\n\n`;
						controller.enqueue(encoder.encode(sseData));
					}
				}
				controller.enqueue(encoder.encode("data: [DONE]\n\n"));
				controller.close();
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Stream error";
				controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
				controller.close();
			}
		},
	});
}

// ── System Prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(locale: string, contextChunks: string[]): string {
	const localeInstructions: Record<string, string> = {
		de: "Antworte IMMER auf Deutsch. Sei freundlich, professionell und hilfreich.",
		en: "ALWAYS respond in English. Be friendly, professional, and helpful.",
		el: "Πάντα να απαντάς στα Ελληνικά. Να είσαι φιλικός, επαγγελματίας και εξυπηρετικός.",
	};

	const contextSection =
		contextChunks.length > 0
			? `\n\nRelevante Informationen über LK Gloss & Detail (nutze diese, um die Frage zu beantworten):\n${contextChunks.map((c, i) => `[${i + 1}] ${c}`).join("\n")}\n\nWenn die obigen Informationen die Frage nicht beantworten, sage ehrlich, dass du es nicht weißt, und schlage vor, das Kontaktformular zu nutzen oder direkt anzurufen. Erfinde keine Informationen.`
			: "";

	return `Du bist Lulezim Kodhimaj AI, der virtuelle Assistent von LK Gloss & Detail, einem mobilen Auto-Detailing-Service in Deutschland (Neuhausen auf den Fildern).

LK Gloss & Detail bietet professionelle mobile Autopflege und Fahrzeugaufbereitung direkt vor Ort beim Kunden. Dienstleistungen umfassen:
- Professionelle Innenreinigung (Tiefenreinigung, Lederaufbereitung, Geruchsneutralisation)
- Scheinwerferaufbereitung (Entfernung von Vergilbung, Politur, UV-Schutz)
- Lackkorrektur, Politur & Versiegelung (3-Stufen Hochglanz, Keramikversiegelung)
- Mobile Service — wir kommen direkt zum Kunden nach Hause oder an den Arbeitsplatz
- KI-gestützte Fahrzeugbewertung über unsere Website
- B2B & Flottenmanagement für Unternehmen

${localeInstructions[locale] ?? localeInstructions.de}

Wichtige Regeln:
1. Halte deine Antworten kurz und prägnant (maximal 3-4 Sätze, außer bei komplexen Fragen).
2. Wenn jemand einen Termin buchen möchte, verweise auf die Buchungsseite.
3. Wenn jemand eine detaillierte Preisauskunft möchte, erkläre, dass die Preise von Fahrzeuggröße und Zustand abhängen, und verweise auf die KI-Bewertung.
4. Für geschäftliche Anfragen (B2B/Flotten) bitte das Kontaktformular empfehlen.
5. Sei immer höflich und professionell.${contextSection}`;
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const parseResult = ChatbotRequestSchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				{ error: "Invalid request", details: parseResult.error.flatten() },
				{ status: 400 },
			);
		}

		const { message, locale, history } = parseResult.data;

		// Step 1: Get embedding for user message
		let embedding: number[];
		let contextChunks: string[] = [];

		try {
			embedding = await getEmbedding(message);

			// Step 2: Query chatbot_knowledge for relevant context
			const supabase = createServiceClient();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { data, error } = (await (supabase as any).rpc("match_chatbot_docs", {
				query_embedding: embedding,
				match_count: 5,
				filter_language: locale,
			})) as { data: MatchDoc[] | null; error: Error | null };

			if (error) {
				console.error("[chatbot] match_chatbot_docs error:", error);
			} else if (data) {
				contextChunks = data.filter((row) => row.similarity > 0.5).map((row) => row.content);
			}

			console.warn(`[chatbot] Found ${contextChunks.length} relevant chunks for locale=${locale}`);
		} catch (err) {
			console.error("[chatbot] Embedding/RAG failed, proceeding without context:", err);
			// Continue with empty context — LLM will answer from system prompt knowledge
		}

		// Step 3: Build prompt with context + history + user message
		const messages = [
			{ role: "system", content: buildSystemPrompt(locale, contextChunks) },
			...history.map((h) => ({
				role: h.role,
				content: h.content,
			})),
			{ role: "user", content: message },
		];

		// Step 4: Stream response
		const stream = await streamLLMResponse(messages);

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (err) {
		console.error("[chatbot] Unexpected error:", err);
		const msg = err instanceof Error ? err.message : "Internal server error";
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
