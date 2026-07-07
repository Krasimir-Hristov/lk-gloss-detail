import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

import { AssessmentDiagnosticSchema } from "@/features/assessment/schemas/assessment.schema";
import { createClient } from "@/lib/supabase/server";

// ── State Schema ────────────────────────────────────────────────────────────

const AnalysisState = z.object({
	base64Images: z.array(z.string()),
	acceptedServiceIds: z.array(z.string()),
	locale: z.string().default("de"),
	carSize: z.enum(["small", "medium", "large", "suv"]).nullable().default(null),
	dirtLevel: z.enum(["light", "moderate", "heavy"]).nullable().default(null),
	brand: z.string().nullable().default(null),
	servicesPricing: z
		.array(
			z.object({
				id: z.string(),
				name: z.string(),
				price_small: z.number(),
				price_medium: z.number(),
				price_large: z.number(),
				price_suv: z.number(),
				duration_hours: z.number(),
			}),
		)
		.default([]),
	priceMin: z.number().default(0),
	priceMax: z.number().default(0),
	durationHours: z.number().default(0),
	summaryText: z.string().default(""),
	diagnostics: z
		.array(
			z.object({
				title: z.string(),
				description: z.string(),
			}),
		)
		.default([]),
	expertVerdict: z.string().default(""),
	error: z.string().nullable().default(null),
});

type AnalysisStateType = z.infer<typeof AnalysisState>;

// ── Model for summary generation ───────────────────────────────────────────

const summaryModel = new ChatOpenAI({
	apiKey: process.env.OPENROUTER_API_KEY,
	modelName: "openai/gpt-4o-mini",
	temperature: 0.7,
	configuration: {
		baseURL: "https://openrouter.ai/api/v1",
	},
});

// ── Node 1: vision_car_analysis ────────────────────────────────────────────

const visionCarAnalysis = async (state: AnalysisStateType): Promise<Partial<AnalysisStateType>> => {
	// Vision analysis is already done during photo validation.
	// carSize, dirtLevel and brand are extracted per-photo and stored.
	// For a full multi-photo analysis, we would need the base64 images,
	// but they are too large (>10MB) to send in a JSON request.
	// Using placeholder values — in production, pass extracted data directly.
	console.log(
		"[analysis-graph] Vision node: skipping vision (photos already validated during upload)",
	);

	return {
		carSize: state.carSize ?? null,
		dirtLevel: state.dirtLevel ?? null,
		brand: state.brand ?? null,
		// Drop base64 images from state
		base64Images: [],
	};
};

// ── Node 2: fetch_db_pricing ───────────────────────────────────────────────

const fetchDbPricing = async (state: AnalysisStateType): Promise<Partial<AnalysisStateType>> => {
	try {
		if (state.acceptedServiceIds.length === 0) {
			return { servicesPricing: [] };
		}

		const supabase = await createClient();

		const { data, error } = await supabase
			.from("services")
			.select("id, name, price_small, price_medium, price_large, price_suv, duration_hours")
			.in("id", state.acceptedServiceIds);

		if (error) throw new Error(`DB query failed: ${error.message}`);

		// Validate that every requested service ID was found
		const foundIds = (data ?? []).map((s) => s.id);
		const missingIds = state.acceptedServiceIds.filter((id) => !foundIds.includes(id));

		if (missingIds.length > 0) {
			throw new Error(
				`Missing or inactive services: ${missingIds.join(", ")}. Cannot calculate pricing from incomplete data.`,
			);
		}

		console.log(
			"[analysis-graph] Fetched pricing for",
			data?.length ?? 0,
			"services:",
			data?.map((s) => s.name),
		);

		return { servicesPricing: data ?? [] };
	} catch (err) {
		const message = err instanceof Error ? err.message : "Failed to fetch pricing";
		console.error("[analysis-graph] fetch_db_pricing error:", message);
		return { error: message };
	}
};

// ── Node 3: deterministic_calculator ───────────────────────────────────────

const deterministicCalculator = async (
	state: AnalysisStateType,
): Promise<Partial<AnalysisStateType>> => {
	try {
		const { carSize, servicesPricing } = state;

		if (!carSize || servicesPricing.length === 0) {
			return {
				priceMin: 0,
				priceMax: 0,
				durationHours: 0,
			};
		}

		// Map car_size to the correct price column
		const priceKey = `price_${carSize}` as keyof (typeof servicesPricing)[0];

		let totalMin = 0;
		let totalMax = 0;
		let totalDuration = 0;

		for (const service of servicesPricing) {
			const price = service[priceKey] as number;
			// price_min = price (base), price_max = price * 1.15 (15% buffer for extras)
			totalMin += price;
			totalMax += Math.round(price * 1.15);
			totalDuration += service.duration_hours;
		}

		console.log("[analysis-graph] Calculator result:", {
			carSize,
			services: servicesPricing.length,
			priceMin: totalMin,
			priceMax: totalMax,
			durationHours: totalDuration,
		});

		return {
			priceMin: totalMin,
			priceMax: totalMax,
			durationHours: Math.round(totalDuration * 10) / 10, // Round to 1 decimal
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : "Price calculation failed";
		console.error("[analysis-graph] deterministic_calculator error:", message);
		return { error: message };
	}
};

// ── Node 4: generate_localized_summary ─────────────────────────────────────

const SUMMARY_SYSTEM_PROMPT = `You are a friendly, professional car detailing expert at LK Gloss & Detail, a mobile car detailing service in Germany.
Generate a structured assessment report for the customer based on their car assessment results.

You MUST respond with valid JSON in exactly this shape (no markdown, no code fences, just the raw JSON object):
{
  "summaryText": "A short, punchy 1-2 sentence CTA summary including the estimated price range and duration. Be enthusiastic.",
  "diagnostics": [
    { "title": "Short finding title (e.g., Heavy Swirls Detected)", "description": "1-2 sentence professional explanation of the finding and its impact" }
  ],
  "expertVerdict": "A 2-3 sentence professional verdict from the detailing expert, summarizing the car's condition and recommended action."
}

Generate 3-5 diagnostic findings relevant to the car's condition (car size, dirt level, and the accepted services).
Respond in the language specified by the user's locale.`;

const generateLocalizedSummary = async (
	state: AnalysisStateType,
): Promise<Partial<AnalysisStateType>> => {
	try {
		const {
			carSize,
			dirtLevel,
			brand,
			priceMin,
			priceMax,
			durationHours,
			servicesPricing,
			locale,
		} = state;

		const localeNames: Record<string, string> = {
			de: "German",
			en: "English",
			el: "Greek",
		};

		const serviceNames = servicesPricing.map((s) => s.name).join(", ");

		const messages = [
			new SystemMessage(SUMMARY_SYSTEM_PROMPT),
			new HumanMessage(
				`Car: ${brand ?? "Unknown"} (${carSize ?? "medium"} size, ${dirtLevel ?? "moderate"} dirt level)
Accepted services: ${serviceNames || "None"}
Price estimate: €${priceMin} – €${priceMax}
Duration: ~${durationHours} hours
Language: ${localeNames[locale] ?? "German"}

Generate the structured assessment report as JSON.`,
			),
		];

		const response = await summaryModel.invoke(messages);
		const rawContent = (response.content as string).trim();

		console.log("[analysis-graph] Raw LLM response:", rawContent);

		// Parse the structured JSON from the LLM
		let parsed: {
			summaryText?: string;
			diagnostics?: { title: string; description: string }[];
			expertVerdict?: string;
		};

		try {
			// Handle potential code fences
			const jsonStr = rawContent
				.replace(/```json\n?/gi, "")
				.replace(/```\n?/g, "")
				.trim();
			parsed = JSON.parse(jsonStr);
		} catch {
			console.warn("[analysis-graph] Failed to parse structured JSON, using fallback");
			parsed = {
				summaryText: rawContent,
				diagnostics: [],
				expertVerdict: "",
			};
		}

		// Validate each diagnostic item with the shared Zod schema
		const diagnostics = (Array.isArray(parsed.diagnostics) ? parsed.diagnostics : [])
			.map((d) => {
				const result = AssessmentDiagnosticSchema.safeParse(d);
				return result.success ? result.data : null;
			})
			.filter((d): d is NonNullable<typeof d> => d !== null);
		const expertVerdict = typeof parsed.expertVerdict === "string" ? parsed.expertVerdict : "";
		const summaryText = typeof parsed.summaryText === "string" ? parsed.summaryText : rawContent;

		console.log("[analysis-graph] Structured result:", {
			summaryText: summaryText.slice(0, 80),
			diagnosticsCount: diagnostics.length,
			verdictLength: expertVerdict.length,
		});

		return {
			summaryText,
			diagnostics,
			expertVerdict,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : "Summary generation failed";
		console.error("[analysis-graph] generate_localized_summary error:", message);
		return { error: message };
	}
};

// ── Router: check for errors ───────────────────────────────────────────────

const routeAfterVision = (state: AnalysisStateType): string => {
	if (state.error) return END;
	return "fetch_db_pricing";
};

const routeAfterPricing = (state: AnalysisStateType): string => {
	if (state.error) return END;
	return "deterministic_calculator";
};

const routeAfterCalculator = (state: AnalysisStateType): string => {
	if (state.error) return END;
	return "generate_localized_summary";
};

// ── Build Graph ─────────────────────────────────────────────────────────────

const graph = new StateGraph(AnalysisState)
	.addNode("vision_car_analysis", visionCarAnalysis)
	.addNode("fetch_db_pricing", fetchDbPricing)
	.addNode("deterministic_calculator", deterministicCalculator)
	.addNode("generate_localized_summary", generateLocalizedSummary)
	.addEdge(START, "vision_car_analysis")
	.addConditionalEdges("vision_car_analysis", routeAfterVision, {
		fetch_db_pricing: "fetch_db_pricing",
		[END]: END,
	})
	.addConditionalEdges("fetch_db_pricing", routeAfterPricing, {
		deterministic_calculator: "deterministic_calculator",
		[END]: END,
	})
	.addConditionalEdges("deterministic_calculator", routeAfterCalculator, {
		generate_localized_summary: "generate_localized_summary",
		[END]: END,
	})
	.addEdge("generate_localized_summary", END)
	.compile();

// ── Export ──────────────────────────────────────────────────────────────────

export { graph as assessmentAnalysisGraph };
export type { AnalysisStateType };
