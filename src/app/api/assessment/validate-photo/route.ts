import { type NextRequest, NextResponse } from "next/server";

import {
	PhotoValidationRequestSchema,
	PhotoValidationResponseSchema,
} from "@/features/assessment/schemas/photo-validation.schema";
import { assessmentValidationGraph } from "@/lib/ai/assessment-validation-graph";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validatedBody = PhotoValidationRequestSchema.parse(body);

		const { imageBase64, expectedAngle, previousCarDescriptions, locale } = validatedBody;

		// Invoke LangGraph validation workflow
		const result = await assessmentValidationGraph.invoke({
			imageBase64,
			expectedAngle,
			previousCarDescriptions: previousCarDescriptions ?? [],
			locale: locale ?? "de",
		});

		console.log(
			`[validate-photo] LangGraph result for ${expectedAngle}:`,
			JSON.stringify({ valid: result.valid, carSize: result.carSize, dirtLevel: result.dirtLevel }),
		);

		return NextResponse.json(
			PhotoValidationResponseSchema.parse({
				valid: result.valid,
				reason: result.reason,
				userMessage: result.userMessage,
				carSize: result.carSize,
				dirtLevel: result.dirtLevel,
				carDescription: result.carDescription,
			}),
		);
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
