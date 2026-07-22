import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

export interface TranslatedText {
	de: string;
	en: string;
	el: string;
	[key: string]: string;
}

/**
 * Automatically translates a single text into German (de), English (en), and Greek (el)
 * using an LLM via OpenRouter.
 */
export async function translateServiceText(text: string): Promise<TranslatedText> {
	if (!text || text.trim() === "") {
		return { de: "", en: "", el: "" };
	}

	try {
		const model = new ChatOpenAI({
			apiKey: process.env.OPENROUTER_API_KEY,
			modelName: "google/gemini-2.5-flash",
			temperature: 0.2,
			configuration: {
				baseURL: "https://openrouter.ai/api/v1",
			},
		});

		const prompt = `You are a professional translator for a premium car detailing company (LK Gloss & Detail).
Translate the input text into three languages: German (de), English (en), and Greek (el).

Input text: "${text}"

Respond EXCLUSIVELY with a JSON object in the following format (no markdown formatting, no code blocks):
{"de": "...", "en": "...", "el": "..."}`;

		const response = await model.invoke([
			new SystemMessage(
				"You are a JSON-only translation assistant for a automotive detailing service.",
			),
			new HumanMessage(prompt),
		]);

		const content = typeof response.content === "string" ? response.content.trim() : "";
		// Clean up potential markdown formatting code blocks
		const cleanJson = content
			.replace(/^```json\s*/i, "")
			.replace(/^```\s*/i, "")
			.replace(/\s*```$/, "")
			.trim();

		const parsed = JSON.parse(cleanJson) as TranslatedText;

		return {
			de: parsed.de || text,
			en: parsed.en || text,
			el: parsed.el || text,
		};
	} catch (err) {
		console.error("[translateServiceText] Translation failed:", err);
		// Fallback: return input text for all languages if AI translation fails
		return { de: text, en: text, el: text };
	}
}
