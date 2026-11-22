import { randomUUID } from "crypto";

import { type NextRequest, NextResponse } from "next/server";

import { AnalyzeRequestSchema } from "@/features/assessment/schemas/assessmentSchema";
import { assessmentAnalysisGraph } from "@/lib/ai/assessmentAnalysisGraph";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
	try {
		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
		}

		const parsed = AnalyzeRequestSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid assessment request parameters." },
				{ status: 400 },
			);
		}

		const { acceptedServiceIds, carSize, dirtLevel, brand, visualFindings, locale } = parsed.data;

		const result = await assessmentAnalysisGraph.invoke({
			acceptedServiceIds,
			carSize,
			dirtLevel,
			brand,
			visualFindings,
			locale,
		});

		if (result.error) {
			console.error("[analyze] Analysis failed:", result.error);
			if (result.error.startsWith("Missing or inactive services")) {
				return NextResponse.json(
					{ error: "One or more selected services are unavailable or inactive." },
					{ status: 400 },
				);
			}
			return NextResponse.json(
				{ error: "Analysis could not be completed. Please try again." },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			id: randomUUID(),
			carSize: result.carSize,
			dirtLevel: result.dirtLevel,
			brand: result.brand,
			priceMin: result.priceMin,
			priceMax: result.priceMax,
			durationHours: result.durationHours,
			summaryText: result.summaryText,
			diagnostics: result.diagnostics ?? [],
			expertVerdict: result.expertVerdict ?? "",
			createdAt: new Date().toISOString(),
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Internal Server Error";
		console.error("[analyze] Error:", message);
		return NextResponse.json(
			{ error: "An unexpected error occurred. Please try again." },
			{ status: 500 },
		);
	}
}
