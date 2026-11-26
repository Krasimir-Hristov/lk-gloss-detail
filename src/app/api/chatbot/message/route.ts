import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { getAiModelsConfig, type AiModelsConfig } from "@/config/aiModelsConfig";
import { getLocalizedText } from "@/features/admin/types/servicesTypes";
import {
	getPublicServices,
	type PublicService,
} from "@/features/services/actions/getPublicServices";
import { getOpenRouterEmbeddings } from "@/lib/chatbot/embeddings";
import {
	InvalidJsonError,
	PayloadTooLargeError,
	readBoundedJson,
} from "@/lib/http/readBoundedJson";
import { createServiceClient } from "@/lib/supabase/service";

import type { NextRequest } from "next/server";

export const maxDuration = 60;

const MAX_CHATBOT_BODY_BYTES = 32 * 1024;
const DIRECT_KB_ROW_LIMIT = 25;

const ChatbotRequestSchema = z.object({
	message: z.string().trim().min(1, "Message is required").max(2000, "Message too long"),
	locale: z.enum(["de", "en", "el"]).default("de"),
	history: z
		.array(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string().max(4000),
			}),
		)
		.max(20)
		.default([]),
});

const DirectKnowledgeRowSchema = z.object({
	content: z.string(),
	metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

const MatchedKnowledgeRowSchema = z.object({
	content: z.string(),
	metadata: z.record(z.string(), z.unknown()).optional().nullable(),
	similarity: z.number().optional(),
});

interface MatchChatbotDocsRpcClient {
	rpc: (
		fn: "match_chatbot_docs",
		args: {
			query_embedding: number[];
			match_count: number;
			filter_language: string | null;
		},
	) => Promise<{ data: unknown; error: { message: string } | null }>;
}

const createChatbotModel = (modelName: string, config: AiModelsConfig) =>
	new ChatOpenAI({
		apiKey: process.env.OPENROUTER_API_KEY,
		modelName,
		streaming: true,
		temperature: config.chatbot.temperature,
		timeout: config.chatbot.timeoutMs,
		configuration: {
			baseURL: config.openRouterBaseUrl,
		},
	});

const formatServicesCatalog = (services: PublicService[], locale: string): string => {
	if (services.length === 0) {
		return "Currently no active services are listed in the database.";
	}

	return services
		.map((s) => {
			const name = getLocalizedText(s.name, locale);
			const desc = getLocalizedText(s.short_description, locale);
			const descPart = desc ? ` — ${desc}` : "";
			return `- ${name}${descPart} | Prices: Small ${s.price_small}€, Medium ${s.price_medium}€, Large ${s.price_large}€, SUV ${s.price_suv}€ | Duration: ~${s.duration_hours}h`;
		})
		.join("\n");
};

const loadKnowledgeChunks = async (searchQuery: string): Promise<string[]> => {
	const supabase = createServiceClient();
	const { data: directRows, error: directError } = await supabase
		.from("chatbot_knowledge")
		.select("content, metadata")
		.order("created_at", { ascending: false })
		.limit(DIRECT_KB_ROW_LIMIT + 1);

	if (directError) {
		console.error("[chatbot] Direct KB query failed:", directError.message);
		return [];
	}

	const rows = directRows ?? [];
	if (rows.length === 0) return [];

	if (rows.length <= DIRECT_KB_ROW_LIMIT) {
		const parsed = z.array(DirectKnowledgeRowSchema).safeParse(rows);
		if (!parsed.success) return [];
		return parsed.data.map((r) => {
			const title =
				r.metadata && typeof r.metadata.title === "string" ? `${r.metadata.title}: ` : "";
			return `${title}${r.content}`;
		});
	}

	const embeddings = getOpenRouterEmbeddings();
	const queryEmbedding = await embeddings.embedQuery(searchQuery);
	const rpcClient = supabase as unknown as MatchChatbotDocsRpcClient;

	const { data: matchedRows, error: rpcError } = await rpcClient.rpc("match_chatbot_docs", {
		query_embedding: queryEmbedding,
		match_count: 10,
		filter_language: null,
	});

	if (rpcError) {
		console.error("[chatbot] match_chatbot_docs RPC failed:", rpcError.message);
		return [];
	}

	const parsedMatches = z.array(MatchedKnowledgeRowSchema).safeParse(matchedRows ?? []);
	if (!parsedMatches.success) return [];
	return parsedMatches.data.map((m) => {
		const title = m.metadata && typeof m.metadata.title === "string" ? `${m.metadata.title}: ` : "";
		return `${title}${m.content}`;
	});
};

const buildSystemPrompt = (
	locale: "de" | "en" | "el",
	services: PublicService[],
	knowledgeChunks: string[],
): string => {
	const localeInstructions: Record<"de" | "en" | "el", string> = {
		de: "Antworte IMMER ausschließlich auf Deutsch. Sei freundlich, professionell und prägnant.",
		en: "ALWAYS respond exclusively in English. Be friendly, professional, and concise.",
		el: "Πάντα να απαντάς αποκλειστικά στα Ελληνικά. Να είσαι φιλικός, επαγγελματίας και σύντομος.",
	};

	const localizedLinks: Record<
		"de" | "en" | "el",
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

	const links = localizedLinks[locale];
	const servicesSection = formatServicesCatalog(services, locale);
	const kbSection =
		knowledgeChunks.length > 0
			? knowledgeChunks.map((chunk, idx) => `[${idx + 1}] ${chunk}`).join("\n")
			: "No additional knowledge base entries found.";

	return `You are Lulezim Kodhimaj AI, the virtual assistant of LK Gloss & Detail, a mobile car detailing service in Germany (Neuhausen auf den Fildern).

${localeInstructions[locale]}

Note: Knowledge base entries below may be written in any language. Always understand their meaning and reply naturally in the active website language (${locale}).

LIVE ACTIVE SERVICES & PRICING (Authoritative Source of Truth):
${servicesSection}

KNOWLEDGE BASE (Policies, FAQs & Mobile Service Info):
${kbSection}

STRICT RULES:
1. Keep answers concise, honest, and helpful (typically 2-4 sentences).
2. NEVER invent services, packages, or prices. Use ONLY the live services and knowledge base above.
3. Use these exact localized Markdown links when guiding the user:
   - [${links.services}](/${locale}#services)
   - [${links.booking}](/${locale}/booking)
   - [${links.assessment}](/${locale}/assessment)
   - [${links.contact}](/${locale}#contact)
4. For B2B or fleet inquiries, direct the user to [${links.contact}](/${locale}#contact).`;
};

const streamLLMResponse = (
	messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
): ReadableStream<Uint8Array> => {
	const config = getAiModelsConfig();
	const langchainMessages = messages.map((m) => {
		if (m.role === "system") return new SystemMessage(m.content);
		if (m.role === "user") return new HumanMessage(m.content);
		return new AIMessage(m.content);
	});

	const encoder = new TextEncoder();

	return new ReadableStream<Uint8Array>({
		async start(controller) {
			let hasEmittedChunk = false;

			const pipeStream = async (modelName: string): Promise<void> => {
				const model = createChatbotModel(modelName, config);
				const stream = await model.stream(langchainMessages);
				for await (const chunk of stream) {
					if (typeof chunk.content === "string" && chunk.content.length > 0) {
						hasEmittedChunk = true;
						controller.enqueue(
							encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`),
						);
					}
				}
			};

			try {
				try {
					await pipeStream(config.chatbot.primaryModel);
				} catch (primaryErr: unknown) {
					if (hasEmittedChunk) {
						throw primaryErr;
					}
					const errMsg = primaryErr instanceof Error ? primaryErr.message : "Unknown error";
					console.warn(
						`[chatbot] Primary model (${config.chatbot.primaryModel}) failed: ${errMsg}. Retrying with fallback (${config.chatbot.fallbackModel}).`,
					);
					await pipeStream(config.chatbot.fallbackModel);
				}

				controller.enqueue(encoder.encode("data: [DONE]\n\n"));
				controller.close();
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : "Stream error";
				console.error("[chatbot] Stream error:", msg);
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify({ error: "Assistant unavailable" })}\n\n`),
				);
				controller.close();
			}
		},
	});
};

export async function POST(request: NextRequest): Promise<Response> {
	try {
		const rawBody = await readBoundedJson(request, MAX_CHATBOT_BODY_BYTES);
		const parsed = ChatbotRequestSchema.parse(rawBody);
		const { message, locale, history } = parsed;

		const combinedSearchText = [...history.slice(-3).map((h) => h.content), message].join(" ");

		const [services, knowledgeChunks] = await Promise.all([
			getPublicServices().catch((err: unknown) => {
				console.error("[chatbot] Failed to load public services:", err);
				return [] as PublicService[];
			}),
			loadKnowledgeChunks(combinedSearchText).catch((err: unknown) => {
				console.error("[chatbot] Failed to load knowledge chunks:", err);
				return [] as string[];
			}),
		]);

		const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
			{ role: "system", content: buildSystemPrompt(locale, services, knowledgeChunks) },
			...history.map((h) => ({ role: h.role, content: h.content })),
			{ role: "user", content: message },
		];

		const stream = streamLLMResponse(messages);

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (err: unknown) {
		if (err instanceof PayloadTooLargeError) {
			return NextResponse.json({ error: "Payload too large" }, { status: 413 });
		}
		if (err instanceof InvalidJsonError) {
			return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
		}
		if (err instanceof ZodError) {
			return NextResponse.json(
				{ error: "Invalid request", details: err.flatten() },
				{ status: 400 },
			);
		}
		console.error("[chatbot] POST handler error:", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
