import { z } from "zod";

import { AssessmentDiagnosticSchema } from "@/features/assessment/schemas/assessmentSchema";

// ── Structured Summary Output Schema ────────────────────────────────────────

export const SummaryOutputSchema = z.object({
	summaryText: z
		.string()
		.describe(
			"A short, punchy 1-2 sentence CTA summary including the estimated price range and duration.",
		),
	diagnostics: z
		.array(AssessmentDiagnosticSchema)
		.min(1)
		.max(6)
		.describe("3-5 structured diagnostic findings relevant to the car's condition and services."),
	expertVerdict: z
		.string()
		.describe(
			"A 2-3 sentence professional verdict summarizing the car's condition and recommended detailing action.",
		),
});

export type SummaryOutput = z.infer<typeof SummaryOutputSchema>;

// ── System Prompt ───────────────────────────────────────────────────────────

export const SUMMARY_SYSTEM_PROMPT = `You are a friendly, professional car detailing expert at LK Gloss & Detail, a mobile car detailing service in Germany.
Generate a structured assessment report for the customer based on their car assessment results.

Guidelines:
- Generate 3-5 diagnostic findings relevant to the car's condition (car size, informational dirt level, real visual findings from the uploaded photos, and the accepted detailing services).
- Include the estimated price range and duration naturally in summaryText.
- Note that pricing is based on vehicle size and selected services; dirt level and visual findings guide the diagnostic explanation only.
- Respond strictly in the language specified by the user's locale (de = German, en = English, el = Greek).`;

// ── Prompt Builder ──────────────────────────────────────────────────────────

const LOCALE_NAMES: Record<string, string> = {
	de: "German",
	en: "English",
	el: "Greek",
};

export interface SummaryPromptParams {
	brand: string | null;
	carSize: "small" | "medium" | "large" | "suv" | null;
	dirtLevel: "light" | "moderate" | "heavy" | null;
	visualFindings: string[];
	serviceNames: string;
	priceMin: number;
	priceMax: number;
	durationHours: number;
	locale: string;
}

export const buildAnalysisSummaryPrompt = ({
	brand,
	carSize,
	dirtLevel,
	visualFindings,
	serviceNames,
	priceMin,
	priceMax,
	durationHours,
	locale,
}: SummaryPromptParams): string => {
	const findingsText =
		visualFindings.length > 0 ? visualFindings.map((item) => `- ${item}`).join("\n") : "None";

	return `Car: ${brand ?? "Unknown"} (${carSize ?? "medium"} size, ${dirtLevel ?? "moderate"} dirt level)
Visual findings from photos:
${findingsText}
Accepted services: ${serviceNames || "None"}
Price estimate: €${priceMin} – €${priceMax}
Duration: ~${durationHours} hours
Language: ${LOCALE_NAMES[locale] ?? "German"}

Generate the structured assessment report.`;
};
