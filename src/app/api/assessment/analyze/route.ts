import { randomUUID } from "crypto";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { assessmentAnalysisGraph } from "@/lib/ai/assessment-analysis-graph";

const AnalyzeRequestSchema = z.object({
	acceptedServiceIds: z.array(z.string()),
	carSize: z.enum(["small", "medium", "large", "suv"]).default("medium"),
	dirtLevel: z.enum(["light", "moderate", "heavy"]).default("moderate"),
	brand: z.string().nullable().default(null),
	locale: z.enum(["de", "en", "el"]).default("de"),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validatedBody = AnalyzeRequestSchema.parse(body);

		const { acceptedServiceIds, carSize, dirtLevel, brand, locale } = validatedBody;

		console.log("[analyze] Starting analysis:", {
			serviceCount: acceptedServiceIds.length,
			carSize,
			dirtLevel,
			locale,
		});

		const result = await assessmentAnalysisGraph.invoke({
			base64Images: [],
			acceptedServiceIds,
			carSize,
			dirtLevel,
			brand,
			locale,
		});

		if (result.error) {
			console.error("[analyze] Analysis failed:", result.error);
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
