import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

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
});

type ValidationOutput = z.infer<typeof ValidationOutputSchema>;

// ── State Schema ────────────────────────────────────────────────────────────

const ValidationState = z.object({
	imageBase64: z.string(),
	expectedAngle: z.enum(["front", "rear", "side", "interior"]),
	previousCarDescriptions: z.array(z.string()).default([]),
	locale: z.string().default("de"),
	valid: z.boolean().default(false),
	reason: z.string().default(""),
	userMessage: z.string().nullable().default(null),
	carSize: z.enum(["small", "medium", "large", "suv"]).nullable().default(null),
	dirtLevel: z.enum(["light", "moderate", "heavy"]).nullable().default(null),
	carDescription: z.string().nullable().default(null),
});

type ValidationStateType = z.infer<typeof ValidationState>;

// ── Model with Structured Output ────────────────────────────────────────────

const model = new ChatOpenAI({
	apiKey: process.env.OPENROUTER_API_KEY,
	modelName: "google/gemini-2.5-pro",
	temperature: 0,
	configuration: {
		baseURL: "https://openrouter.ai/api/v1",
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

Language:
- Respond in the language provided in the request. If no language is provided, default to German.`;

// ── Node: validate_image_angle ──────────────────────────────────────────────

const validateImageAngle = async (
	state: ValidationStateType,
): Promise<Partial<ValidationStateType>> => {
	const { imageBase64, expectedAngle, previousCarDescriptions, locale } = state;

	const messages = [
		new SystemMessage(SYSTEM_PROMPT),
		new HumanMessage({
			content: [
				{
					type: "text",
					text: `Validate if this photo is a ${expectedAngle} view of the car. 
Previous car descriptions: ${previousCarDescriptions?.join(", ") || "None"}.
Language for userMessage: ${locale || "German"}.`,
				},
				{
					type: "image_url",
					image_url: { url: imageBase64 },
				},
			],
		}),
	];

	const result: ValidationOutput = await model.invoke(messages);

	console.log(
		`[assessment-validation-graph] Structured result for ${expectedAngle}:`,
		JSON.stringify({ valid: result.valid, carSize: result.carSize, dirtLevel: result.dirtLevel }),
	);

	return {
		valid: result.valid,
		reason: result.reason,
		userMessage: result.userMessage,
		carSize: result.carSize,
		dirtLevel: result.dirtLevel,
		carDescription: result.carDescription,
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
