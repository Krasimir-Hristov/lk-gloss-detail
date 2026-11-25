export interface AiModelRouteConfig {
	readonly primaryModel: string;
	readonly fallbackModel: string;
	readonly timeoutMs: number;
	readonly temperature: number;
}

export interface AiModelsConfig {
	readonly openRouterBaseUrl: string;
	readonly visionValidation: AiModelRouteConfig;
	readonly assessmentSummary: AiModelRouteConfig;
}

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const readEnvOrDefault = (envValue: string | undefined, fallback: string): string => {
	const trimmed = envValue?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

export const getAiModelsConfig = (): AiModelsConfig => ({
	openRouterBaseUrl: readEnvOrDefault(process.env.OPENROUTER_BASE_URL, DEFAULT_OPENROUTER_BASE_URL),
	visionValidation: {
		primaryModel: readEnvOrDefault(process.env.OPENROUTER_VISION_MODEL, "google/gemini-2.5-flash"),
		fallbackModel: readEnvOrDefault(
			process.env.OPENROUTER_VISION_FALLBACK_MODEL,
			"google/gemini-3.8-flash",
		),
		timeoutMs: 25_000,
		temperature: 0,
	},
	assessmentSummary: {
		primaryModel: readEnvOrDefault(process.env.OPENROUTER_SUMMARY_MODEL, "openai/gpt-4o-mini"),
		fallbackModel: readEnvOrDefault(
			process.env.OPENROUTER_SUMMARY_FALLBACK_MODEL,
			"google/gemini-2.5-flash",
		),
		timeoutMs: 25_000,
		temperature: 0.7,
	},
});

export const AI_MODELS_CONFIG: AiModelsConfig = getAiModelsConfig();
