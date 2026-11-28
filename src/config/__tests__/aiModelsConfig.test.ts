import { afterEach, describe, expect, it } from "vitest";

import { AI_MODELS_CONFIG, getAiModelsConfig } from "@/config/aiModelsConfig";

describe("getAiModelsConfig", () => {
	const envKeys = [
		"OPENROUTER_BASE_URL",
		"OPENROUTER_VISION_MODEL",
		"OPENROUTER_VISION_FALLBACK_MODEL",
		"OPENROUTER_SUMMARY_MODEL",
		"OPENROUTER_SUMMARY_FALLBACK_MODEL",
		"OPENROUTER_CHATBOT_MODEL",
		"OPENROUTER_CHATBOT_FALLBACK_MODEL",
		"OPENROUTER_TRANSLATION_MODEL",
		"OPENROUTER_TRANSLATION_FALLBACK_MODEL",
	] as const;
	const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

	afterEach(() => {
		for (const key of envKeys) {
			const val = originalEnv[key];
			if (val === undefined) delete process.env[key];
			else process.env[key] = val;
		}
	});

	it("returns Phase C default vision, summary, chatbot, and adminTranslation models when unset", () => {
		for (const key of envKeys) delete process.env[key];
		process.env.OPENROUTER_VISION_MODEL = "   ";
		const config = getAiModelsConfig();
		expect(config.openRouterBaseUrl).toBe("https://openrouter.ai/api/v1");
		expect(config.visionValidation).toEqual({
			primaryModel: "google/gemini-2.5-flash",
			fallbackModel: "openai/gpt-4o-mini",
			timeoutMs: 25_000,
			temperature: 0,
		});
		expect(config.assessmentSummary).toEqual({
			primaryModel: "openai/gpt-4o-mini",
			fallbackModel: "google/gemini-2.5-flash",
			timeoutMs: 25_000,
			temperature: 0.7,
		});
		expect(config.chatbot).toEqual({
			primaryModel: "google/gemini-2.5-flash-lite",
			fallbackModel: "google/gemini-2.5-flash",
			timeoutMs: 25_000,
			temperature: 0.2,
		});
		expect(config.adminTranslation).toEqual({
			primaryModel: "google/gemini-2.5-flash-lite",
			fallbackModel: "google/gemini-2.5-flash",
			timeoutMs: 25_000,
			temperature: 0.2,
		});
		expect(AI_MODELS_CONFIG.chatbot.primaryModel).toBeTruthy();
		expect(AI_MODELS_CONFIG.adminTranslation.primaryModel).toBeTruthy();
	});

	it("honors trimmed .env overrides for models and base URL", () => {
		process.env.OPENROUTER_BASE_URL = "  https://custom.openrouter.test/v1  ";
		process.env.OPENROUTER_VISION_MODEL = " google/gemini-3.8-flash ";
		process.env.OPENROUTER_VISION_FALLBACK_MODEL = " google/gemini-2.5-flash ";
		process.env.OPENROUTER_SUMMARY_MODEL = " anthropic/claude-3.5-sonnet ";
		process.env.OPENROUTER_SUMMARY_FALLBACK_MODEL = " openai/gpt-4o-mini ";
		process.env.OPENROUTER_CHATBOT_MODEL = " google/gemini-2.5-flash ";
		process.env.OPENROUTER_TRANSLATION_MODEL = " openai/gpt-4o-mini ";
		const config = getAiModelsConfig();
		expect(config).toMatchObject({
			openRouterBaseUrl: "https://custom.openrouter.test/v1",
			visionValidation: {
				primaryModel: "google/gemini-3.8-flash",
				fallbackModel: "google/gemini-2.5-flash",
			},
			assessmentSummary: {
				primaryModel: "anthropic/claude-3.5-sonnet",
				fallbackModel: "openai/gpt-4o-mini",
			},
			chatbot: { primaryModel: "google/gemini-2.5-flash" },
			adminTranslation: { primaryModel: "openai/gpt-4o-mini" },
		});
	});
});
