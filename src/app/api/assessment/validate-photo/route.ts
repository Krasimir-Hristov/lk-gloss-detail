import { type NextRequest, NextResponse } from "next/server";

import {
	PhotoValidationRequestSchema,
	PhotoValidationResponseSchema,
} from "@/features/assessment/schemas/photoValidationSchema";
import { assessmentValidationGraph } from "@/lib/ai/assessmentValidationGraph";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
	try {
		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json(
				{
					valid: false,
					reason: "Invalid JSON payload",
					userMessage: "Invalid request payload.",
				},
				{ status: 400 },
			);
		}

		const parsed = PhotoValidationRequestSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{
					valid: false,
					reason: "Invalid request parameters",
					userMessage: "Invalid photo validation request.",
				},
				{ status: 400 },
			);
		}

		const { imageBase64, expectedAngle, previousCarDescriptions, locale } = parsed.data;

		const result = await assessmentValidationGraph.invoke({
			imageBase64,
			expectedAngle,
			previousCarDescriptions: previousCarDescriptions ?? [],
			locale,
		});

		return NextResponse.json(
			PhotoValidationResponseSchema.parse({
				valid: result.valid,
				reason: result.reason,
				userMessage: result.userMessage,
				carSize: result.carSize,
				dirtLevel: result.dirtLevel,
				carDescription: result.carDescription,
				visualFindings: result.visualFindings ?? [],
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
