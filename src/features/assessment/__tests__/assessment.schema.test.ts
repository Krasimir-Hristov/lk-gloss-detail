import { describe, expect, it } from "vitest";

import {
	AssessmentPhotoSchema,
	AssessmentResultSchema,
	PhotoAngleSchema,
	ServiceSelectionSchema,
	WIZARD_STEPS,
	WizardStep,
} from "@/features/assessment/schemas/assessment.schema";

describe("Assessment Schemas", () => {
	describe("PhotoAngleSchema", () => {
		it("validates correct photo angles", () => {
			expect(PhotoAngleSchema.safeParse("front").success).toBe(true);
			expect(PhotoAngleSchema.safeParse("rear").success).toBe(true);
			expect(PhotoAngleSchema.safeParse("side").success).toBe(true);
			expect(PhotoAngleSchema.safeParse("interior").success).toBe(true);
		});

		it("rejects invalid photo angles", () => {
			expect(PhotoAngleSchema.safeParse("top").success).toBe(false);
			expect(PhotoAngleSchema.safeParse("engine").success).toBe(false);
		});
	});

	describe("AssessmentPhotoSchema", () => {
		it("validates valid assessment photo object", () => {
			const validPhoto = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				angle: "front",
				previewUrl: "https://example.com/car.jpg",
				validationStatus: "valid",
				carSize: "medium",
				dirtLevel: "light",
			};
			const result = AssessmentPhotoSchema.safeParse(validPhoto);
			expect(result.success).toBe(true);
		});

		it("fails on invalid UUID or invalid URL", () => {
			const invalidPhoto = {
				id: "not-a-uuid",
				angle: "front",
				previewUrl: "not-a-url",
				validationStatus: "pending",
			};
			const result = AssessmentPhotoSchema.safeParse(invalidPhoto);
			expect(result.success).toBe(false);
		});
	});

	describe("ServiceSelectionSchema", () => {
		it("validates service selection item", () => {
			const validSelection = {
				serviceId: "123e4567-e89b-12d3-a456-426614174000",
				accepted: true,
			};
			expect(ServiceSelectionSchema.safeParse(validSelection).success).toBe(true);
		});
	});

	describe("AssessmentResultSchema", () => {
		it("validates valid assessment result object", () => {
			const validResult = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				carSize: "suv",
				dirtLevel: "heavy",
				brand: "BMW X5",
				priceMin: 150,
				priceMax: 250,
				durationHours: 3.5,
				summaryText: "Comprehensive detailing required.",
				diagnostics: [
					{ title: "Exterior Wash", description: "Heavy mud accumulation on lower panels." },
				],
				expertVerdict: "Recommended full ceramic package.",
				createdAt: "2026-07-31T20:00:00.000Z",
			};
			const result = AssessmentResultSchema.safeParse(validResult);
			expect(result.success).toBe(true);
		});

		it("rejects negative prices or missing required fields", () => {
			const invalidResult = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				carSize: "suv",
				dirtLevel: "heavy",
				brand: "BMW",
				priceMin: -50,
				priceMax: 100,
				durationHours: 2,
				summaryText: "Test",
				diagnostics: [],
				expertVerdict: "Verdict",
				createdAt: "invalid-date",
			};
			const result = AssessmentResultSchema.safeParse(invalidResult);
			expect(result.success).toBe(false);
		});
	});

	describe("WizardStep enum & steps list", () => {
		it("contains 7 ordered wizard steps", () => {
			expect(WIZARD_STEPS).toEqual([
				"front",
				"rear",
				"side",
				"interior",
				"services",
				"analyzing",
				"results",
			]);
		});

		it("validates valid step string", () => {
			expect(WizardStep.safeParse("services").success).toBe(true);
			expect(WizardStep.safeParse("unknown").success).toBe(false);
		});
	});
});
