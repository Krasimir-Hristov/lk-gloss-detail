import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { cosineSimilarity, getOpenRouterEmbeddings } from "@/lib/chatbot/embeddings";
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

interface KnowledgeRow {
	content: string;
	embedding: unknown;
	language: string;
}

// ── Embedding Generation ───────────────────────────────────────────────────

async function getEmbedding(text: string): Promise<number[]> {
	const embeddings = getOpenRouterEmbeddings();
	return await embeddings.embedQuery(text);
}

// ── Stream Handler ─────────────────────────────────────────────────────────

async function streamLLMResponse(messages: Array<{ role: string; content: string }>) {
	const model = new ChatOpenAI({
		apiKey: process.env.OPENROUTER_API_KEY,
		modelName: "google/gemini-2.5-flash",
		streaming: true,
		temperature: 0.1,
		configuration: {
			baseURL: "https://openrouter.ai/api/v1",
		},
	});

	const langchainMessages = messages.map((m) => {
		if (m.role === "system") return new SystemMessage(m.content);
		if (m.role === "user") return new HumanMessage(m.content);
		return new AIMessage(m.content);
	});

	const encoder = new TextEncoder();

	return new ReadableStream({
		async start(controller) {
			try {
				const stream = await model.stream(langchainMessages);

				for await (const chunk of stream) {
					if (typeof chunk.content === "string" && chunk.content) {
						controller.enqueue(
							encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`),
						);
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

	const localizedLinks: Record<
		string,
		{ services: string; booking: string; assessment: string; contact: string }
	> = {
		de: {
			services: "Dienstleistungen",
			booking: "Termin buchen",
			assessment: "KI-Fahrzeugbewertung",
			contact: "Kontakt",
		},
		en: {
			services: "Services",
			booking: "Book Appointment",
			assessment: "AI Vehicle Assessment",
			contact: "Contact",
		},
		el: {
			services: "Υπηρεσίες",
			booking: "Κράτηση Ραντεβού",
			assessment: "Αξιολόγηση Οχήματος",
			contact: "Επικοινωνία",
		},
	};

	const links = localizedLinks[locale] ?? localizedLinks.en;

	const contextSection =
		contextChunks.length > 0
			? `\n\nRelevante Informationen aus der Wissensdatenbank (RAG):\n${contextChunks.map((c, i) => `[${i + 1}] ${c}`).join("\n")}\n\nSTRIKTE ANWEISUNG: Gib alle Details, Preise und Dienstleistungen aus den obigen RAG-Informationen präzise an. Erfinde KEINE ungefragten Pakete oder gefälschte Dienste.`
			: "\n\nKeine passenden Informationen in der Wissensdatenbank gefunden. Wenn der Nutzer nach Dienstleistungen oder Preisen fragt, antworte ehrlich, dass noch keine spezifischen Daten hinterlegt sind, und verweise auf das Kontaktformular oder die Terminbuchung.";

	return `Du bist Lulezim Kodhimaj AI, der virtuelle Assistent von LK Gloss & Detail, einem mobilen Auto-Detailing-Service in Deutschland (Neuhausen auf den Fildern).

LK Gloss & Detail bietet professionelle mobile Autopflege und Fahrzeugaufbereitung direkt vor Ort beim Kunden.

${localeInstructions[locale] ?? localeInstructions.de}

Wichtige Regeln:
1. Halte deine Antworten kurz, ehrlich und prägnant (maximal 3-4 Sätze).
2. Erfinde KEINE Dienstleistungen, Pakete oder Preise. Gib NUR Informationen an, die explizit im obenstehenden RAG-Kontext enthalten sind.
3. Verwende exakt diese Markdown-Links für die Navigation auf unserer Website (verwende die übersetzten Linktexte):
   - Services: [${links.services}](/${locale}#services)
   - Booking: [${links.booking}](/${locale}/booking)
   - Assessment: [${links.assessment}](/${locale}/assessment)
   - Contact: [${links.contact}](/${locale}/contact)
4. Für geschäftliche Anfragen (B2B/Flotten) verweise auf das [${links.contact}](/${locale}/contact).
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

		// Combine history & current message for context query
		const combinedSearchText = [...history.slice(-3).map((h) => h.content), message].join(" ");

		let contextChunks: string[] = [];

		try {
			const supabase = createServiceClient();

			// Fetch knowledge base rows for locale
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { data: rows, error: fetchError } = (await (supabase as any)
				.from("chatbot_knowledge")
				.select("content, embedding, language")
				.eq("language", locale)
				.limit(50)) as { data: KnowledgeRow[] | null; error: Error | null };

			let targetRows = rows;
			if (fetchError || !targetRows || targetRows.length === 0) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const { data: allRows } = (await (supabase as any)
					.from("chatbot_knowledge")
					.select("content, embedding, language")
					.limit(50)) as { data: KnowledgeRow[] | null };
				targetRows = allRows;
			}

			if (targetRows && targetRows.length > 0) {
				// If total entries for locale is modest (<= 15), include ALL entries in context
				// so Gemini has 100% complete knowledge for any question or follow-up question
				if (targetRows.length <= 15) {
					contextChunks = targetRows.map((r) => r.content);
				} else {
					// Otherwise, compute similarity against combined search text
					const embedding = await getEmbedding(combinedSearchText);
					contextChunks = targetRows
						.map((row: KnowledgeRow) => {
							let vec: number[] | null = null;
							if (Array.isArray(row.embedding)) vec = row.embedding as number[];
							else if (typeof row.embedding === "string") {
								try {
									vec = JSON.parse(row.embedding);
								} catch {
									vec = null;
								}
							}
							const similarity = vec ? cosineSimilarity(embedding, vec) : 0;
							return { content: row.content, similarity };
						})
						.sort((a, b) => b.similarity - a.similarity)
						.slice(0, 10)
						.map((r) => r.content);
				}
			}

			console.warn(
				`[chatbot] Loaded ${contextChunks.length} knowledge base chunks for locale=${locale}`,
			);
		} catch (err) {
			console.error("[chatbot] Embedding/RAG failed, proceeding without context:", err);
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
		const msg = err instanceof Error ? err.message : "Internal server error";
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
