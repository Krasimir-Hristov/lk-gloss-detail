import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

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

const SUMMARY_SYSTEM_PROMPT = `You are a friendly car detailing expert at LK Gloss & Detail, a mobile car detailing service in Germany.
Generate a short, punchy summary (1-2 sentences) for the customer based on their car assessment results.
Include the estimated price range and duration.
Be enthusiastic and professional.
Respond in the language specified by the user's locale.`;

const generateLocalizedSummary = async (
	state: AnalysisStateType,
): Promise<Partial<AnalysisStateType>> => {
	try {
		const { carSize, dirtLevel, brand, priceMin, priceMax, durationHours, locale } = state;

		const localeNames: Record<string, string> = {
			de: "German",
			en: "English",
			el: "Greek",
		};

		const messages = [
			new SystemMessage(SUMMARY_SYSTEM_PROMPT),
			new HumanMessage(
				`Car: ${brand ?? "Unknown"} (${carSize ?? "medium"} size, ${dirtLevel ?? "moderate"} dirt level)
Price estimate: €${priceMin} – €${priceMax}
Duration: ~${durationHours} hours
Language: ${localeNames[locale] ?? "German"}

Generate a short CTA summary for the customer.`,
			),
		];

		const response = await summaryModel.invoke(messages);
		const summaryText = (response.content as string).trim();

		console.log("[analysis-graph] Summary generated:", summaryText);

		return { summaryText };
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
