import { afterEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient, mockCreateServiceClient } = vi.hoisted(() => ({
	mockCreateClient: vi.fn(),
	mockCreateServiceClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: mockCreateClient,
}));

vi.mock("@/lib/supabase/service", () => ({
	createServiceClient: mockCreateServiceClient,
}));

import {
	assessmentAnalysisGraph,
	calculateAssessmentPricing,
	type ServicePricingRow,
} from "@/lib/ai/assessmentAnalysisGraph";

const SAMPLE_SERVICES: ServicePricingRow[] = [
	{
		id: "11111111-1111-1111-1111-111111111111",
		name: { de: "Außenwäsche", en: "Exterior Wash" },
		price_small: 50,
		price_medium: 70,
		price_large: 90,
		price_suv: 110,
		duration_hours: 1.1,
	},
	{
		id: "22222222-2222-2222-2222-222222222222",
		name: "Interior Deep Clean",
		price_small: 80,
		price_medium: 100,
		price_large: 120,
		price_suv: 150,
		duration_hours: 1.2,
	},
	{
		id: "33333333-3333-3333-3333-333333333333",
		name: { de: "Felgenreinigung", en: "Rim Detailing" },
		price_small: 20,
		price_medium: 30,
		price_large: 40,
		price_suv: 50,
		duration_hours: 0.1,
	},
];

describe("calculateAssessmentPricing", () => {
	it("returns zero totals when servicesPricing is empty", () => {
		expect(calculateAssessmentPricing("small", [])).toEqual({
			priceMin: 0,
			priceMax: 0,
			durationHours: 0,
		});
		expect(calculateAssessmentPricing("suv", [])).toEqual({
			priceMin: 0,
			priceMax: 0,
			durationHours: 0,
		});
	});

	it("calculates priceMin, priceMax (15% buffer rounded per service), and 1-decimal durationHours for each carSize", () => {
		// small: 50+80+20 = 150; max: Math.round(50*1.15)=57 + 92 + 23 = 172; duration: 1.1+1.2+0.1 = 2.4
		expect(calculateAssessmentPricing("small", SAMPLE_SERVICES)).toEqual({
			priceMin: 150,
			priceMax: 172,
			durationHours: 2.4,
		});

		// medium: 70+100+30 = 200; max: Math.round(70*1.15)=81 + 115 + Math.round(30*1.15)=35 = 231
		expect(calculateAssessmentPricing("medium", SAMPLE_SERVICES)).toEqual({
			priceMin: 200,
			priceMax: 231,
			durationHours: 2.4,
		});

		// large: 90+120+40 = 250; max: Math.round(90*1.15)=103 + 138 + 46 = 287
		expect(calculateAssessmentPricing("large", SAMPLE_SERVICES)).toEqual({
			priceMin: 250,
			priceMax: 287,
			durationHours: 2.4,
		});

		// suv: 110+150+50 = 310; max: Math.round(110*1.15)=126 + Math.round(150*1.15)=173 + Math.round(50*1.15)=57 = 356
		expect(calculateAssessmentPricing("suv", SAMPLE_SERVICES)).toEqual({
			priceMin: 310,
			priceMax: 356,
			durationHours: 2.4,
		});
	});

	it("enforces carSize-only pricing invariant: changing dirtLevel never alters price or duration", () => {
		const dirtLevels = ["light", "moderate", "heavy"] as const;
		const resultsByDirtLevel = dirtLevels.map((_dirtLevel) =>
			calculateAssessmentPricing("large", SAMPLE_SERVICES),
		);

		expect(calculateAssessmentPricing.length).toBe(2);
		expect(resultsByDirtLevel[0]).toEqual(resultsByDirtLevel[1]);
		expect(resultsByDirtLevel[1]).toEqual(resultsByDirtLevel[2]);
		expect(resultsByDirtLevel[0]).toEqual({
			priceMin: 250,
			priceMax: 287,
			durationHours: 2.4,
		});
	});

	it("handles zero-price edge cases and preserves 1-decimal rounding", () => {
		const zeroPriceService: ServicePricingRow[] = [
			{
				id: "44444444-4444-4444-4444-444444444444",
				name: "Quick Inspection",
				price_small: 0,
				price_medium: 0,
				price_large: 0,
				price_suv: 0,
				duration_hours: 0.25,
			},
			{
				id: "55555555-5555-5555-5555-555555555555",
				name: "Spot Treatment",
				price_small: 45,
				price_medium: 55,
				price_large: 65,
				price_suv: 75,
				duration_hours: 0.3,
			},
		];

		// 0.25 + 0.3 = 0.55 -> Math.round(5.5) / 10 = 0.6; 45 * 1.15 = 51.75 -> 52
		expect(calculateAssessmentPricing("small", zeroPriceService)).toEqual({
			priceMin: 45,
			priceMax: 52,
			durationHours: 0.6,
		});
	});
});

describe("assessmentAnalysisGraph dual-client DB outage classification", () => {
	afterEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
	});

	it("returns DB query failed error instead of Missing or inactive services when both Supabase clients throw", async () => {
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
		mockCreateClient.mockRejectedValueOnce(new Error("cookies() called outside request scope"));
		mockCreateServiceClient.mockImplementationOnce(() => {
			throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
		});

		const result = await assessmentAnalysisGraph.invoke({
			acceptedServiceIds: ["11111111-1111-1111-1111-111111111111"],
			carSize: "medium",
			dirtLevel: "moderate",
			brand: "BMW",
			visualFindings: [],
			locale: "de",
		});

		expect(mockCreateClient).toHaveBeenCalledTimes(1);
		expect(mockCreateServiceClient).toHaveBeenCalledTimes(1);
		expect(result.error).toBe("DB query failed: unable to retrieve active services");
		expect(result.error).not.toMatch(/^Missing or inactive services/);
	});

	it("still classifies an empty active service result as Missing or inactive services", async () => {
		const chain = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			in: vi.fn().mockResolvedValue({ data: [], error: null }),
		};
		mockCreateClient.mockResolvedValueOnce({
			from: vi.fn(() => chain),
		});

		const result = await assessmentAnalysisGraph.invoke({
			acceptedServiceIds: ["11111111-1111-1111-1111-111111111111"],
			carSize: "medium",
			dirtLevel: "moderate",
			brand: "BMW",
			visualFindings: [],
			locale: "de",
		});

		expect(result.error).toBe(
			"Missing or inactive services: 11111111-1111-1111-1111-111111111111. Cannot calculate pricing from incomplete data.",
		);
	});
});
