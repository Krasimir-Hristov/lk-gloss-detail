import { describe, expect, it } from "vitest";

import {
	AnalyzeRequestSchema,
	AssessmentPhotoSchema,
	AssessmentResultSchema,
	PhotoAngleSchema,
	ServiceSelectionSchema,
	WIZARD_STEPS,
	WizardStep,
} from "@/features/assessment/schemas/assessmentSchema";
import {
	PhotoValidationRequestSchema,
	PhotoValidationResponseSchema,
} from "@/features/assessment/schemas/photoValidationSchema";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const VALID_DATA_URI = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/";
const BASE_PHOTO = {
	id: VALID_UUID,
	angle: "front",
	previewUrl: "https://example.com/car.jpg",
	validationStatus: "valid",
};

describe("Assessment Schemas", () => {
	describe("PhotoAngleSchema", () => {
		it("validates allowed angles and rejects unknown angles", () => {
			for (const angle of ["front", "rear", "side", "interior"]) {
				expect(PhotoAngleSchema.safeParse(angle).success).toBe(true);
			}
			expect(PhotoAngleSchema.safeParse("top").success).toBe(false);
			expect(PhotoAngleSchema.safeParse("engine").success).toBe(false);
		});
	});

	describe("AssessmentPhotoSchema", () => {
		it("validates photo with trimmed visualFindings and rejects invalid UUID/URL or bounds", () => {
			const parsed = AssessmentPhotoSchema.safeParse({
				...BASE_PHOTO,
				carSize: "medium",
				dirtLevel: "light",
				visualFindings: ["  Swirl marks on hood  ", "Brake dust on wheels"],
			});
			expect(parsed.success).toBe(true);
			if (parsed.success) {
				expect(parsed.data.visualFindings).toEqual(["Swirl marks on hood", "Brake dust on wheels"]);
			}

			expect(
				AssessmentPhotoSchema.safeParse({
					...BASE_PHOTO,
					visualFindings: ["1", "2", "3", "4", "5"],
				}).success,
			).toBe(false);
			expect(
				AssessmentPhotoSchema.safeParse({ ...BASE_PHOTO, visualFindings: ["a".repeat(161)] })
					.success,
			).toBe(false);
			expect(
				AssessmentPhotoSchema.safeParse({
					id: "not-a-uuid",
					angle: "front",
					previewUrl: "not-a-url",
					validationStatus: "pending",
				}).success,
			).toBe(false);
		});
	});

	describe("AnalyzeRequestSchema", () => {
		it("applies defaults and trims brand and visualFindings", () => {
			const defaults = AnalyzeRequestSchema.safeParse({ acceptedServiceIds: [VALID_UUID] });
			expect(defaults.success).toBe(true);
			if (defaults.success) {
				expect(defaults.data).toMatchObject({
					carSize: "medium",
					dirtLevel: "moderate",
					brand: null,
					visualFindings: [],
					locale: "de",
				});
			}

			const custom = AnalyzeRequestSchema.safeParse({
				acceptedServiceIds: [VALID_UUID],
				carSize: "suv",
				dirtLevel: "heavy",
				brand: "  BMW X5  ",
				visualFindings: ["  Tree sap on roof  ", "Mud on rocker panels"],
				locale: "el",
			});
			expect(custom.success).toBe(true);
			if (custom.success) {
				expect(custom.data.brand).toBe("BMW X5");
				expect(custom.data.visualFindings).toEqual(["Tree sap on roof", "Mud on rocker panels"]);
			}
		});

		it("rejects invalid acceptedServiceIds, oversized bounds, and unsupported locale", () => {
			const invalidPayloads = [
				{ acceptedServiceIds: [] },
				{ acceptedServiceIds: ["not-a-uuid"] },
				{ acceptedServiceIds: Array.from({ length: 31 }, () => VALID_UUID) },
				{
					acceptedServiceIds: [VALID_UUID],
					visualFindings: Array.from({ length: 17 }, (_, idx) => `finding-${idx}`),
				},
				{ acceptedServiceIds: [VALID_UUID], brand: "x".repeat(161) },
				{ acceptedServiceIds: [VALID_UUID], locale: "fr" },
			];
			for (const payload of invalidPayloads) {
				expect(AnalyzeRequestSchema.safeParse(payload).success).toBe(false);
			}
		});
	});

	describe("PhotoValidationRequestSchema & PhotoValidationResponseSchema", () => {
		it("accepts valid base64 raster data URIs and defaults locale to de", () => {
			for (const fmt of ["jpeg", "jpg", "png", "webp"] as const) {
				const parsed = PhotoValidationRequestSchema.safeParse({
					imageBase64: `data:image/${fmt};base64,AAAA`,
					expectedAngle: "front",
				});
				expect(parsed.success).toBe(true);
				if (parsed.success) expect(parsed.data.locale).toBe("de");
			}
		});

		it("rejects external URLs (SSRF), svg+xml, and payloads > 4.5M chars", () => {
			expect(
				PhotoValidationRequestSchema.safeParse({
					imageBase64: "https://evil.example/ssrf.jpg",
					expectedAngle: "front",
				}).success,
			).toBe(false);
			expect(
				PhotoValidationRequestSchema.safeParse({
					imageBase64: "data:image/svg+xml;base64,AAAA",
					expectedAngle: "front",
				}).success,
			).toBe(false);

			const prefix = "data:image/jpeg;base64,";
			const maxValid = prefix + "A".repeat(4_500_000 - prefix.length);
			const tooLarge = prefix + "A".repeat(4_500_001 - prefix.length);
			expect(
				PhotoValidationRequestSchema.safeParse({ imageBase64: maxValid, expectedAngle: "side" })
					.success,
			).toBe(true);
			expect(
				PhotoValidationRequestSchema.safeParse({ imageBase64: tooLarge, expectedAngle: "side" })
					.success,
			).toBe(false);
		});

		it("bounds previousCarDescriptions and validates response visualFindings default/max", () => {
			expect(
				PhotoValidationRequestSchema.safeParse({
					imageBase64: VALID_DATA_URI,
					expectedAngle: "rear",
					previousCarDescriptions: ["a", "b", "c", "d"],
				}).success,
			).toBe(false);
			expect(
				PhotoValidationRequestSchema.safeParse({
					imageBase64: VALID_DATA_URI,
					expectedAngle: "rear",
					previousCarDescriptions: ["c".repeat(201)],
				}).success,
			).toBe(false);

			const responseParsed = PhotoValidationResponseSchema.safeParse({
				valid: true,
				reason: "Clear front view",
				userMessage: null,
				carSize: "medium",
				dirtLevel: "moderate",
				carDescription: "Audi A4 Silver",
			});
			expect(responseParsed.success).toBe(true);
			if (responseParsed.success) expect(responseParsed.data.visualFindings).toEqual([]);

			expect(
				PhotoValidationResponseSchema.safeParse({
					valid: true,
					reason: "Clear",
					userMessage: null,
					carSize: "medium",
					dirtLevel: "light",
					carDescription: "Audi A4",
					visualFindings: ["1", "2", "3", "4", "5"],
				}).success,
			).toBe(false);
		});
	});

	describe("ServiceSelectionSchema, AssessmentResultSchema & WizardStep", () => {
		it("validates service selection, result schema, and wizard steps", () => {
			expect(
				ServiceSelectionSchema.safeParse({ serviceId: VALID_UUID, accepted: true }).success,
			).toBe(true);

			const validResult = {
				id: VALID_UUID,
				carSize: "suv",
				dirtLevel: "heavy",
				brand: "BMW X5",
				priceMin: 150,
				priceMax: 250,
				durationHours: 3.5,
				summaryText: "Comprehensive detailing required.",
				diagnostics: [{ title: "Exterior Wash", description: "Heavy mud on lower panels." }],
				expertVerdict: "Recommended full ceramic package.",
				createdAt: "2026-07-31T20:00:00.000Z",
			};
			expect(AssessmentResultSchema.safeParse(validResult).success).toBe(true);
			expect(
				AssessmentResultSchema.safeParse({
					...validResult,
					priceMin: -50,
					createdAt: "invalid-date",
				}).success,
			).toBe(false);

			expect(WIZARD_STEPS).toEqual([
				"front",
				"rear",
				"side",
				"interior",
				"services",
				"analyzing",
				"results",
			]);
			expect(WizardStep.safeParse("services").success).toBe(true);
			expect(WizardStep.safeParse("unknown").success).toBe(false);
		});
	});
});
