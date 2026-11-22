import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

import { getAiModelsConfig } from "@/config/aiModelsConfig";
import { getLocalizedText } from "@/features/admin/types/servicesTypes";
import {
	buildAnalysisSummaryPrompt,
	SUMMARY_SYSTEM_PROMPT,
	SummaryOutputSchema,
} from "@/lib/ai/assessmentAnalysisPrompts";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

import type { AiModelsConfig } from "@/config/aiModelsConfig";
import type { SummaryOutput } from "@/lib/ai/assessmentAnalysisPrompts";

// ── Exported Pure Pricing Types & Calculator (R2: CarSize-only) ────────────

export type AssessmentCarSize = "small" | "medium" | "large" | "suv";

export interface ServicePricingRow {
	id: string;
	name: unknown;
	price_small: number;
	price_medium: number;
	price_large: number;
	price_suv: number;
	duration_hours: number;
}

export interface CalculatedAssessmentTotals {
	priceMin: number;
	priceMax: number;
	durationHours: number;
}

const PRICE_COLUMN_BY_SIZE: Record<
	AssessmentCarSize,
	keyof Pick<ServicePricingRow, "price_small" | "price_medium" | "price_large" | "price_suv">
> = {
	small: "price_small",
	medium: "price_medium",
	large: "price_large",
	suv: "price_suv",
};

/**
 * Pure R2 pricing calculator: depends strictly on `carSize` and active DB service prices.
 * `dirtLevel` is informational only and NEVER modifies price or duration.
 */
export const calculateAssessmentPricing = (
	carSize: AssessmentCarSize,
	servicesPricing: ServicePricingRow[],
): CalculatedAssessmentTotals => {
	if (servicesPricing.length === 0) {
		return { priceMin: 0, priceMax: 0, durationHours: 0 };
	}

	const priceKey = PRICE_COLUMN_BY_SIZE[carSize];
	let totalMin = 0;
	let totalMax = 0;
	let totalDuration = 0;

	for (const service of servicesPricing) {
		const price = service[priceKey];
		totalMin += price;
		totalMax += Math.round(price * 1.15);
		totalDuration += service.duration_hours;
	}

	return {
		priceMin: totalMin,
		priceMax: totalMax,
		durationHours: Math.round(totalDuration * 10) / 10,
	};
};

// ── Pricing Row & State Schemas ─────────────────────────────────────────────

const PricingRowSchema = z.object({
	id: z.string(),
	name: z.union([z.string(), z.record(z.string(), z.string())]),
	price_small: z.number(),
	price_medium: z.number(),
	price_large: z.number(),
	price_suv: z.number(),
	duration_hours: z.number(),
});

type PricingRow = z.infer<typeof PricingRowSchema>;

const AnalysisState = z.object({
	acceptedServiceIds: z.array(z.string()),
	locale: z.string().default("de"),
	carSize: z.enum(["small", "medium", "large", "suv"]).nullable().default(null),
	dirtLevel: z.enum(["light", "moderate", "heavy"]).nullable().default(null),
	brand: z.string().nullable().default(null),
	visualFindings: z.array(z.string()).default([]),
	servicesPricing: z.array(PricingRowSchema).default([]),
	priceMin: z.number().default(0),
	priceMax: z.number().default(0),
	durationHours: z.number().default(0),
	summaryText: z.string().default(""),
	diagnostics: z.array(z.object({ title: z.string(), description: z.string() })).default([]),
	expertVerdict: z.string().default(""),
	error: z.string().nullable().default(null),
});

type AnalysisStateType = z.infer<typeof AnalysisState>;

// ── Summary Model Factory (Primary + Fallback) ──────────────────────────────

const createSummaryModel = (modelName: string, config: AiModelsConfig) =>
	new ChatOpenAI({
		apiKey: process.env.OPENROUTER_API_KEY,
		modelName,
		temperature: config.assessmentSummary.temperature,
		timeout: config.assessmentSummary.timeoutMs,
		configuration: {
			baseURL: config.openRouterBaseUrl,
		},
	}).withStructuredOutput(SummaryOutputSchema, {
		name: "generate_assessment_summary",
		method: "jsonSchema",
	});

const SERVICE_COLUMNS =
	"id, name, price_small, price_medium, price_large, price_suv, duration_hours";

// ── Node 1: fetch_db_pricing ───────────────────────────────────────────────

const fetchDbPricing = async (state: AnalysisStateType): Promise<Partial<AnalysisStateType>> => {
	try {
		if (state.acceptedServiceIds.length === 0) {
			return { servicesPricing: [] };
		}

		let rawData: unknown[] | null = null;
		let dbError: { message: string } | null = null;

		try {
			const supabase = await createClient();
			const res = await supabase
				.from("services")
				.select(SERVICE_COLUMNS)
				.eq("active", true)
				.in("id", state.acceptedServiceIds);
			rawData = res.data;
			dbError = res.error;
		} catch (clientErr: unknown) {
			console.warn(
				"[analysis-graph] Standard server client failed, trying service client:",
				clientErr,
			);
		}

		if ((dbError || !rawData) && process.env.NEXT_PUBLIC_SUPABASE_URL) {
			try {
				const serviceClient = createServiceClient();
				const res = await serviceClient
					.from("services")
					.select(SERVICE_COLUMNS)
					.eq("active", true)
					.in("id", state.acceptedServiceIds);
				rawData = res.data;
				dbError = res.error;
			} catch (serviceErr: unknown) {
				console.error("[analysis-graph] Service client failed as well:", serviceErr);
			}
		}

		if (dbError) throw new Error(`DB query failed: ${dbError.message}`);
		if (rawData === null) {
			throw new Error("DB query failed: unable to retrieve active services");
		}

		const parsedRows: PricingRow[] = z.array(PricingRowSchema).parse(rawData);
		const foundIds = new Set(parsedRows.map((s) => s.id));
		const missingIds = state.acceptedServiceIds.filter((id) => !foundIds.has(id));

		if (missingIds.length > 0) {
			throw new Error(
				`Missing or inactive services: ${missingIds.join(", ")}. Cannot calculate pricing from incomplete data.`,
			);
		}

		return { servicesPricing: parsedRows };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Failed to fetch pricing";
		console.error("[analysis-graph] fetch_db_pricing error:", message);
		return { error: message };
	}
};

// ── Node 2: deterministic_calculator ───────────────────────────────────────

const deterministicCalculator = async (
	state: AnalysisStateType,
): Promise<Partial<AnalysisStateType>> => {
	try {
		if (!state.carSize || state.servicesPricing.length === 0) {
			return { priceMin: 0, priceMax: 0, durationHours: 0 };
		}
		return calculateAssessmentPricing(state.carSize, state.servicesPricing);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Price calculation failed";
		console.error("[analysis-graph] deterministic_calculator error:", message);
		return { error: message };
	}
};

// ── Node 3: generate_localized_summary ─────────────────────────────────────

const generateLocalizedSummary = async (
	state: AnalysisStateType,
): Promise<Partial<AnalysisStateType>> => {
	try {
		const config = getAiModelsConfig();
		const serviceNames = state.servicesPricing
			.map((s) => getLocalizedText(s.name, state.locale))
			.join(", ");

		const promptText = buildAnalysisSummaryPrompt({
			brand: state.brand,
			carSize: state.carSize,
			dirtLevel: state.dirtLevel,
			visualFindings: state.visualFindings,
			serviceNames,
			priceMin: state.priceMin,
			priceMax: state.priceMax,
			durationHours: state.durationHours,
			locale: state.locale,
		});

		const messages = [new SystemMessage(SUMMARY_SYSTEM_PROMPT), new HumanMessage(promptText)];

		let rawOutput: SummaryOutput;
		try {
			const primaryModel = createSummaryModel(config.assessmentSummary.primaryModel, config);
			rawOutput = await primaryModel.invoke(messages);
		} catch (primaryErr: unknown) {
			const errMsg = primaryErr instanceof Error ? primaryErr.message : "Unknown error";
			console.warn(
				`[analysis-graph] Primary summary model (${config.assessmentSummary.primaryModel}) failed: ${errMsg}. Retrying with fallback (${config.assessmentSummary.fallbackModel}).`,
			);
			const fallbackModel = createSummaryModel(config.assessmentSummary.fallbackModel, config);
			rawOutput = await fallbackModel.invoke(messages);
		}

		const validated = SummaryOutputSchema.safeParse(rawOutput);
		if (!validated.success) {
			throw new Error("Structured summary validation failed");
		}

		return {
			summaryText: validated.data.summaryText,
			diagnostics: validated.data.diagnostics,
			expertVerdict: validated.data.expertVerdict,
		};
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Summary generation failed";
		console.error("[analysis-graph] generate_localized_summary error:", message);
		return { error: message };
	}
};

// ── Routers & Graph Build ──────────────────────────────────────────────────

const routeAfterPricing = (state: AnalysisStateType): string =>
	state.error ? END : "deterministic_calculator";

const routeAfterCalculator = (state: AnalysisStateType): string =>
	state.error ? END : "generate_localized_summary";

const graph = new StateGraph(AnalysisState)
	.addNode("fetch_db_pricing", fetchDbPricing)
	.addNode("deterministic_calculator", deterministicCalculator)
	.addNode("generate_localized_summary", generateLocalizedSummary)
	.addEdge(START, "fetch_db_pricing")
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
