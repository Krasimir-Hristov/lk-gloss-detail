import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { type NextRequest, NextResponse } from "next/server";

import {
	PhotoValidationRequestSchema,
	PhotoValidationResponseSchema,
} from "@/features/assessment/schemas/photo-validation.schema";

// Initialize Gemini model via OpenRouter - using PRO for maximum accuracy
const model = new ChatOpenAI({
	apiKey: process.env.OPENROUTER_API_KEY,
	modelName: "google/gemini-2.5-pro", // Most powerful model for strict validation
	temperature: 0,
	configuration: {
		baseURL: "https://openrouter.ai/api/v1",
	},
});

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

Output Format (JSON):
{
  "valid": boolean,
  "reason": "Internal technical reason for the result",
  "userMessage": "Friendly message for the user in their language",
  "carSize": "small" | "medium" | "large" | "suv" | null,
  "dirtLevel": "light" | "moderate" | "heavy" | null,
  "carDescription": "Brief description of the car (color, make, model) for consistency checks" | null
}

Language:
- Respond in the language provided in the request. If no language is provided, default to German.`;

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validatedBody = PhotoValidationRequestSchema.parse(body);

		const { imageBase64, expectedAngle, previousCarDescriptions, locale } = validatedBody;

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

		const response = await model.invoke(messages);
		const content = response.content as string;

		console.log(`[validate-photo] AI Response for ${expectedAngle} (locale: ${locale}):`, content);

		// Extract JSON from response
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (!jsonMatch) throw new Error("AI failed to return a valid JSON object");

		const parsedResponse = JSON.parse(jsonMatch[0]);
		return NextResponse.json(PhotoValidationResponseSchema.parse(parsedResponse));
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Internal Server Error";
		console.error("[validate-photo] Error:", message);
		return NextResponse.json(
			{
				valid: false,
				reason: "Internal Server Error",
				userMessage: "An error occurred during validation.",
			},
			{ status: 500 },
		);
	}
}
