import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import { getAiModelsConfig, type AiModelsConfig } from "@/config/aiModelsConfig";
import {
	TranslatedServicePairSchema,
	type ServiceLocale,
	type TranslatedServicePair,
} from "@/features/admin/schemas/servicesSchema";

export interface TranslateServicePairInput {
	name: string;
	shortDescription?: string | null;
	sourceLocale?: ServiceLocale;
}

const LOCALE_LABELS: Record<ServiceLocale, string> = {
	de: "German (de)",
	en: "English (en)",
	el: "Greek (el)",
};

const createTranslationModel = (modelName: string, config: AiModelsConfig) =>
	new ChatOpenAI({
		apiKey: process.env.OPENROUTER_API_KEY,
		modelName,
		temperature: config.adminTranslation.temperature,
		timeout: config.adminTranslation.timeoutMs,
		configuration: {
			baseURL: config.openRouterBaseUrl,
		},
	}).withStructuredOutput(TranslatedServicePairSchema, {
		name: "translate_service_pair",
		method: "jsonSchema",
	});

const buildFallbackTriple = (text: string): { de: string; en: string; el: string } => ({
	de: text,
	en: text,
	el: text,
});

/**
 * Translates a service name and short description into German (de), English (en),
 * and Greek (el) in a single structured LLM call with Primary + Fallback routing.
 */
export const translateServicePair = async ({
	name,
	shortDescription,
	sourceLocale = "de",
}: TranslateServicePairInput): Promise<TranslatedServicePair> => {
	const cleanName = name.trim();
	const cleanDesc = (shortDescription ?? "").trim();

	if (!cleanName && !cleanDesc) {
		return {
			name: { de: "", en: "", el: "" },
			short_description: { de: "", en: "", el: "" },
		};
	}

	const fallbackResult: TranslatedServicePair = {
		name: buildFallbackTriple(cleanName),
		short_description: cleanDesc ? buildFallbackTriple(cleanDesc) : { de: "", en: "", el: "" },
	};

	try {
		const config = getAiModelsConfig();
		const sourceLabel = LOCALE_LABELS[sourceLocale];

		const messages = [
			new SystemMessage(
				"You are a professional automotive detailing translator for LK Gloss & Detail. Translate service titles and descriptions naturally and accurately into German (de), English (en), and Greek (el). Keep the source language text accurate and preserve detailing terminology. If short_description is empty, return empty strings for all three languages in short_description.",
			),
			new HumanMessage(
				`Source language: ${sourceLabel}\nService name: "${cleanName}"\nShort description: "${cleanDesc}"`,
			),
		];

		const invokeAndParse = async (modelName: string): Promise<TranslatedServicePair> => {
			const model = createTranslationModel(modelName, config);
			const rawOutput = await model.invoke(messages);
			const parsed = TranslatedServicePairSchema.safeParse(rawOutput);
			if (!parsed.success) {
				throw new Error(`Structured output validation failed for ${modelName}`);
			}
			return parsed.data;
		};

		let validatedData: TranslatedServicePair;
		try {
			validatedData = await invokeAndParse(config.adminTranslation.primaryModel);
		} catch (primaryErr: unknown) {
			const errMsg = primaryErr instanceof Error ? primaryErr.message : "Unknown error";
			console.warn(
				`[translateServicePair] Primary model (${config.adminTranslation.primaryModel}) failed: ${errMsg}. Retrying with fallback (${config.adminTranslation.fallbackModel}).`,
			);
			validatedData = await invokeAndParse(config.adminTranslation.fallbackModel);
		}

		const { name: translatedName, short_description: translatedDesc } = validatedData;

		return {
			name: {
				de: sourceLocale === "de" ? cleanName : translatedName.de.trim() || cleanName,
				en: sourceLocale === "en" ? cleanName : translatedName.en.trim() || cleanName,
				el: sourceLocale === "el" ? cleanName : translatedName.el.trim() || cleanName,
			},
			short_description: cleanDesc
				? {
						de: sourceLocale === "de" ? cleanDesc : translatedDesc.de.trim() || cleanDesc,
						en: sourceLocale === "en" ? cleanDesc : translatedDesc.en.trim() || cleanDesc,
						el: sourceLocale === "el" ? cleanDesc : translatedDesc.el.trim() || cleanDesc,
					}
				: { de: "", en: "", el: "" },
		};
	} catch (err: unknown) {
		console.error("[translateServicePair] Translation failed:", err);
		return fallbackResult;
	}
};
