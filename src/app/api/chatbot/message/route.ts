import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { getAiModelsConfig, type AiModelsConfig } from "@/config/aiModelsConfig";
import {
	getPublicServices,
	type PublicService,
} from "@/features/services/actions/getPublicServices";
import { buildChatbotSystemPrompt, loadKnowledgeChunks } from "@/lib/chatbot/promptBuilder";
import {
	InvalidJsonError,
	PayloadTooLargeError,
	readBoundedJson,
} from "@/lib/http/readBoundedJson";

import type { NextRequest } from "next/server";

export const maxDuration = 60;

const MAX_CHATBOT_BODY_BYTES = 32 * 1024;

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
					if (hasEmittedChunk) throw primaryErr;
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
			{ role: "system", content: buildChatbotSystemPrompt(locale, services, knowledgeChunks) },
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
