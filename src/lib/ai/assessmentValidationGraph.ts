import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

import { getAiModelsConfig } from "@/config/aiModelsConfig";

import type { AiModelsConfig } from "@/config/aiModelsConfig";

// ── Structured Output Schema ────────────────────────────────────────────────

const ValidationOutputSchema = z.object({
	valid: z.boolean().describe("Whether the photo matches the expected angle"),
	reason: z.string().describe("Internal technical reason for the result"),
	userMessage: z.string().nullable().describe("Friendly message for the user in their language"),
	carSize: z
		.enum(["small", "medium", "large", "suv"])
		.nullable()
		.describe("Estimated car size from the photo"),
	dirtLevel: z
		.enum(["light", "moderate", "heavy"])
		.nullable()
		.describe("Estimated dirt level from the photo"),
	carDescription: z
		.string()
		.nullable()
		.describe("Brief description of the car (color, make, model) for consistency checks"),
	visualFindings: z
		.array(z.string().trim().max(160))
		.max(4)
		.default([])
		.describe(
			"1-3 concise visual detailing observations from the photo in the user's language (empty array if invalid or none)",
		),
});

type ValidationOutputInput = z.input<typeof ValidationOutputSchema>;

// ── State Schema ────────────────────────────────────────────────────────────

const ValidationState = z.object({
	imageBase64: z.string(),
	expectedAngle: z.enum(["front", "rear", "side", "interior"]),
	previousCarDescriptions: z.array(z.string()).default([]),
	locale: z.enum(["de", "en", "el"]).default("de"),
	valid: z.boolean().default(false),
	reason: z.string().default(""),
	userMessage: z.string().nullable().default(null),
	carSize: z.enum(["small", "medium", "large", "suv"]).nullable().default(null),
	dirtLevel: z.enum(["light", "moderate", "heavy"]).nullable().default(null),
	carDescription: z.string().nullable().default(null),
	visualFindings: z.array(z.string().trim().max(160)).max(4).default([]),
});

type ValidationStateType = z.infer<typeof ValidationState>;

// ── Model Factory (Primary + Fallback) ──────────────────────────────────────

const createValidationModel = (modelName: string, config: AiModelsConfig) =>
	new ChatOpenAI({
		apiKey: process.env.OPENROUTER_API_KEY,
		modelName,
		temperature: config.visionValidation.temperature,
		timeout: config.visionValidation.timeoutMs,
		configuration: {
			baseURL: config.openRouterBaseUrl,
		},
	}).withStructuredOutput(ValidationOutputSchema, {
		name: "validate_car_photo",
		method: "jsonSchema",
	});

// ── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert car detailing specialist. Your task is to validate if a photo matches the expected angle of a car for a professional assessment.

Expected Angles:
- front: The front of the car, including headlights and grille.
- rear: The back of the car, including taillights and license plate.
- side: The side profile of the car. 3/4 angles are acceptable as long as the side is dominant.
- interior: The inside of the car (dashboard, seats, or overall cabin).

Strictness:
- Be tolerant of slight angle deviations (e.g., a slight 3/4 view for 'side').
- Be strict about completely wrong angles (e.g., a rear photo for 'front').
- If the photo is not of a car, it is invalid.

Consistency Check:
- You will be provided with descriptions of the car from previous photos.
- Ensure the car in the current photo matches the previous descriptions (color, make/model).

Visual Findings:
- When valid is true, extract 1 to 3 concise, real visual detailing observations directly visible in the photo (e.g., swirl marks on hood, brake dust on rims, water spots, dusty dashboard, leather wear), each <= 160 characters, written in the requested language.
- When valid is false or no specific detailing condition is visible, return an empty array [].

Language:
- Respond (userMessage and visualFindings) in the language specified in the request (de = German, en = English, el = Greek). Default to German if unspecified.`;

const LOCALE_LABELS: Record<string, string> = {
	de: "German",
	en: "English",
	el: "Greek",
};

const sanitizeVisualFindings = (valid: boolean, findings: string[] | undefined): string[] => {
	if (!valid || !Array.isArray(findings)) return [];
	return findings
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.slice(0, 4)
		.map((item) => item.slice(0, 160));
};

// ── Node: validate_image_angle ──────────────────────────────────────────────

const validateImageAngle = async (
	state: ValidationStateType,
): Promise<Partial<ValidationStateType>> => {
	const { imageBase64, expectedAngle, previousCarDescriptions, locale } = state;
	const config = getAiModelsConfig();
	const languageLabel = LOCALE_LABELS[locale] ?? "German";

	const messages = [
		new SystemMessage(SYSTEM_PROMPT),
		new HumanMessage({
			content: [
				{
					type: "text",
					text: `Validate if this photo is a ${expectedAngle} view of the car.
Previous car descriptions: ${previousCarDescriptions.join(", ") || "None"}.
Language for userMessage and visualFindings: ${languageLabel}.`,
				},
				{
					type: "image_url",
					image_url: { url: imageBase64 },
				},
			],
		}),
	];

	let rawResult: ValidationOutputInput;
	try {
		const primaryModel = createValidationModel(config.visionValidation.primaryModel, config);
		rawResult = await primaryModel.invoke(messages);
	} catch (primaryErr: unknown) {
		const errMsg = primaryErr instanceof Error ? primaryErr.message : "Unknown error";
		console.warn(
			`[assessment-validation-graph] Primary model (${config.visionValidation.primaryModel}) failed: ${errMsg}. Retrying with fallback (${config.visionValidation.fallbackModel}).`,
		);
		const fallbackModel = createValidationModel(config.visionValidation.fallbackModel, config);
		rawResult = await fallbackModel.invoke(messages);
	}

	const result = ValidationOutputSchema.parse(rawResult);
	const visualFindings = sanitizeVisualFindings(result.valid, result.visualFindings);

	return {
		valid: result.valid,
		reason: result.reason,
		userMessage: result.userMessage,
		carSize: result.carSize,
		dirtLevel: result.dirtLevel,
		carDescription: result.carDescription,
		visualFindings,
	};
};

// ── Build Graph ─────────────────────────────────────────────────────────────

const graph = new StateGraph(ValidationState)
	.addNode("validate_image_angle", validateImageAngle)
	.addEdge(START, "validate_image_angle")
	.addEdge("validate_image_angle", END)
	.compile();

// ── Export ──────────────────────────────────────────────────────────────────

export { graph as assessmentValidationGraph };
export type { ValidationStateType };
