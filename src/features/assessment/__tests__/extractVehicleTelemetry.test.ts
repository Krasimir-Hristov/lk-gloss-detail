import { describe, expect, it } from "vitest";

import { extractVehicleTelemetry } from "@/features/assessment/types/assessmentService";

import type { AssessmentPhoto } from "@/features/assessment/schemas/assessmentSchema";

const makePhoto = (overrides: Partial<AssessmentPhoto> = {}): AssessmentPhoto => ({
	id: "123e4567-e89b-12d3-a456-426614174000",
	angle: "front",
	previewUrl: "https://example.com/photo.jpg",
	validationStatus: "valid",
	...overrides,
});

describe("extractVehicleTelemetry", () => {
	it("returns fallback defaults when there are no valid photos", () => {
		expect(extractVehicleTelemetry([])).toEqual({
			carSize: "medium",
			dirtLevel: "moderate",
			brand: null,
			visualFindings: [],
		});

		const nonValidPhotos: AssessmentPhoto[] = [
			makePhoto({
				validationStatus: "invalid",
				carSize: "suv",
				dirtLevel: "heavy",
				carDescription: "BMW X5",
				visualFindings: ["Mud on fender"],
			}),
			makePhoto({
				angle: "rear",
				validationStatus: "pending",
				carSize: "small",
				dirtLevel: "light",
			}),
		];

		expect(extractVehicleTelemetry(nonValidPhotos)).toEqual({
			carSize: "medium",
			dirtLevel: "moderate",
			brand: null,
			visualFindings: [],
		});
	});

	it("selects maximum dirtLevel severity (heavy > moderate > light) instead of mode", () => {
		const lightAndHeavy = [
			makePhoto({ angle: "front", dirtLevel: "light" }),
			makePhoto({ angle: "rear", dirtLevel: "light" }),
			makePhoto({ angle: "side", dirtLevel: "heavy" }),
		];
		expect(extractVehicleTelemetry(lightAndHeavy).dirtLevel).toBe("heavy");

		const lightAndModerate = [
			makePhoto({ angle: "front", dirtLevel: "light" }),
			makePhoto({ angle: "rear", dirtLevel: "light" }),
			makePhoto({ angle: "side", dirtLevel: "moderate" }),
		];
		expect(extractVehicleTelemetry(lightAndModerate).dirtLevel).toBe("moderate");

		const onlyLight = [
			makePhoto({ angle: "front", dirtLevel: "light" }),
			makePhoto({ angle: "rear", dirtLevel: "light" }),
		];
		expect(extractVehicleTelemetry(onlyLight).dirtLevel).toBe("light");
	});

	it("computes carSize using mode with fallback to medium", () => {
		const photos = [
			makePhoto({ angle: "front", carSize: "small" }),
			makePhoto({ angle: "rear", carSize: "suv" }),
			makePhoto({ angle: "side", carSize: "suv" }),
			makePhoto({ angle: "interior", carSize: "large" }),
		];
		expect(extractVehicleTelemetry(photos).carSize).toBe("suv");

		const missingSize = [makePhoto({ angle: "front", carSize: undefined })];
		expect(extractVehicleTelemetry(missingSize).carSize).toBe("medium");
	});

	it("picks the first non-empty carDescription as brand or null", () => {
		const photos = [
			makePhoto({ angle: "front", carDescription: "" }),
			makePhoto({ angle: "rear", carDescription: "Mercedes-Benz C-Class" }),
			makePhoto({ angle: "side", carDescription: "Mercedes-Benz" }),
		];
		expect(extractVehicleTelemetry(photos).brand).toBe("Mercedes-Benz C-Class");

		const noBrand = [makePhoto({ angle: "front", carDescription: undefined })];
		expect(extractVehicleTelemetry(noBrand).brand).toBeNull();
	});

	it("aggregates and deduplicates visualFindings across valid photos only", () => {
		const photos = [
			makePhoto({
				angle: "front",
				visualFindings: ["Swirl marks on hood", "Water spots"],
			}),
			makePhoto({
				angle: "rear",
				validationStatus: "invalid",
				visualFindings: ["Ignored finding from invalid photo"],
			}),
			makePhoto({
				angle: "side",
				visualFindings: ["Water spots", "Brake dust on rims"],
			}),
			makePhoto({
				angle: "interior",
				visualFindings: undefined,
			}),
		];

		const telemetry = extractVehicleTelemetry(photos);
		expect(telemetry.visualFindings).toEqual([
			"Swirl marks on hood",
			"Water spots",
			"Brake dust on rims",
		]);
	});
});
