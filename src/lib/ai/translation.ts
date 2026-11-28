import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import { getAiModelsConfig, type AiModelsConfig } from "@/config/aiModelsConfig";
import {
	TranslatedServicePairSchema,
	type ServiceLocale,
	type TranslatedServicePair,
} from "@/features/admin/schemas/servicesSchema";
import { AI_LOCALE_NAMES, DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/locales";
import {
	createEmptyTextMap,
	createUniformTextMap,
	type LocalizedTextMap,
} from "@/lib/admin/serviceHelpers";

export interface TranslateServicePairInput {
	name: string;
	shortDescription?: string | null;
	sourceLocale?: ServiceLocale;
}

const TARGET_LANGUAGES_LIST = SUPPORTED_LOCALES.map(
	(loc) => `${AI_LOCALE_NAMES[loc]} (${loc})`,
).join(", ");

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

const buildResolvedTextMap = (
	translated: LocalizedTextMap,
	sourceText: string,
	sourceLocale: ServiceLocale,
): LocalizedTextMap => {
	const resolved = createEmptyTextMap();
	for (const loc of SUPPORTED_LOCALES) {
		resolved[loc] = loc === sourceLocale ? sourceText : translated[loc].trim() || sourceText;
	}
	return resolved;
};

/**
 * Translates a service name and short description into all supported locales
 * (de, en, el, sq, tr) in a single structured LLM call with Primary + Fallback routing.
 */
export const translateServicePair = async ({
	name,
	shortDescription,
	sourceLocale = DEFAULT_LOCALE,
}: TranslateServicePairInput): Promise<TranslatedServicePair> => {
	const cleanName = name.trim();
	const cleanDesc = (shortDescription ?? "").trim();

	if (!cleanName && !cleanDesc) {
		return {
			name: createEmptyTextMap(),
			short_description: createEmptyTextMap(),
		};
	}

	const fallbackResult: TranslatedServicePair = {
		name: createUniformTextMap(cleanName),
		short_description: cleanDesc ? createUniformTextMap(cleanDesc) : createEmptyTextMap(),
	};

	try {
		const config = getAiModelsConfig();
		const sourceLabel = `${AI_LOCALE_NAMES[sourceLocale]} (${sourceLocale})`;

		const messages = [
			new SystemMessage(
				`You are a professional automotive detailing translator for LK Gloss & Detail. Translate service titles and descriptions naturally and accurately into ${TARGET_LANGUAGES_LIST}. Keep the source language text accurate and preserve detailing terminology. If short_description is empty, return empty strings for all ${SUPPORTED_LOCALES.length} languages in short_description.`,
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
			name: buildResolvedTextMap(translatedName, cleanName, sourceLocale),
			short_description: cleanDesc
				? buildResolvedTextMap(translatedDesc, cleanDesc, sourceLocale)
				: createEmptyTextMap(),
		};
	} catch (err: unknown) {
		console.error("[translateServicePair] Translation failed:", err);
		return fallbackResult;
	}
};
