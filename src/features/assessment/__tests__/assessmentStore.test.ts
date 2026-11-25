import { beforeEach, describe, expect, it } from "vitest";

import { useAssessmentStore } from "@/features/assessment/stores/assessmentStore";

describe("useAssessmentStore", () => {
	beforeEach(() => {
		useAssessmentStore.getState().reset();
	});

	it("initializes with default state", () => {
		const state = useAssessmentStore.getState();
		expect(state.currentStep).toBe("front");
		expect(state.photos).toEqual([]);
		expect(state.services).toEqual([]);
		expect(state.result).toBeNull();
		expect(state.isAnalyzing).toBe(false);
		expect(state.error).toBeNull();
	});

	it("adds and replaces photos per angle correctly", () => {
		const store = useAssessmentStore.getState();
		store.setPhoto("front", "blob:http://localhost/front-photo-id", "test-uuid-1");

		let updatedState = useAssessmentStore.getState();
		expect(updatedState.photos).toHaveLength(1);
		expect(updatedState.photos[0]).toEqual({
			id: "test-uuid-1",
			angle: "front",
			previewUrl: "blob:http://localhost/front-photo-id",
			validationStatus: "pending",
		});

		useAssessmentStore
			.getState()
			.setPhoto("front", "blob:http://localhost/front-photo-new", "test-uuid-2");
		updatedState = useAssessmentStore.getState();
		expect(updatedState.photos).toHaveLength(1);
		expect(updatedState.photos[0].id).toBe("test-uuid-2");
	});

	it("validates photo status, metadata, and persists visualFindings", () => {
		const store = useAssessmentStore.getState();
		store.setPhoto("front", "blob:url", "photo-1");

		store.setPhotoValidation("photo-1", "valid", undefined, "suv", "heavy", "BMW X5 Black", [
			"Swirl marks on hood",
			"Brake dust on front wheels",
		]);

		const photo = useAssessmentStore.getState().photos[0];
		expect(photo.validationStatus).toBe("valid");
		expect(photo.carSize).toBe("suv");
		expect(photo.dirtLevel).toBe("heavy");
		expect(photo.carDescription).toBe("BMW X5 Black");
		expect(photo.visualFindings).toEqual(["Swirl marks on hood", "Brake dust on front wheels"]);
	});

	it("preserves photos when all services are rejected and clears only on clearPhotos()", () => {
		const service1 = "11111111-1111-1111-1111-111111111111";
		const service2 = "22222222-2222-2222-2222-222222222222";
		const store = useAssessmentStore.getState();

		store.setPhoto("front", "blob:front", "photo-front");
		store.setPhotoValidation("photo-front", "valid", undefined, "medium", "light", "VW Golf");
		store.setServices([
			{ serviceId: service1, accepted: true },
			{ serviceId: service2, accepted: true },
		]);

		store.rejectService(service1);
		store.rejectService(service2);

		const stateAfterRejectAll = useAssessmentStore.getState();
		expect(stateAfterRejectAll.services.filter((s) => s.accepted)).toHaveLength(0);
		expect(stateAfterRejectAll.photos).toHaveLength(1);
		expect(stateAfterRejectAll.photos[0].id).toBe("photo-front");

		store.clearPhotos();
		expect(useAssessmentStore.getState().photos).toEqual([]);
		expect(useAssessmentStore.getState().services).toHaveLength(2);
	});

	it("advances and steps back through wizard steps", () => {
		expect(useAssessmentStore.getState().currentStep).toBe("front");

		useAssessmentStore.getState().nextStep();
		expect(useAssessmentStore.getState().currentStep).toBe("rear");

		useAssessmentStore.getState().nextStep();
		expect(useAssessmentStore.getState().currentStep).toBe("side");

		useAssessmentStore.getState().prevStep();
		expect(useAssessmentStore.getState().currentStep).toBe("rear");

		useAssessmentStore.getState().goToStep("services");
		expect(useAssessmentStore.getState().currentStep).toBe("services");
	});

	it("handles acceptService and rejectService", () => {
		const service1 = "11111111-1111-1111-1111-111111111111";
		const service2 = "22222222-2222-2222-2222-222222222222";

		useAssessmentStore.getState().setServices([
			{ serviceId: service1, accepted: true },
			{ serviceId: service2, accepted: true },
		]);

		useAssessmentStore.getState().rejectService(service2);

		const updatedServices = useAssessmentStore.getState().services;
		expect(updatedServices.find((s) => s.serviceId === service1)?.accepted).toBe(true);
		expect(updatedServices.find((s) => s.serviceId === service2)?.accepted).toBe(false);

		useAssessmentStore.getState().acceptService(service2);
		expect(
			useAssessmentStore.getState().services.find((s) => s.serviceId === service2)?.accepted,
		).toBe(true);
	});

	it("stops analyzing on setResult and setError, and resets store to initial state", () => {
		const store = useAssessmentStore.getState();
		store.setIsAnalyzing(true);
		store.setError("Network error");
		expect(useAssessmentStore.getState().isAnalyzing).toBe(false);
		expect(useAssessmentStore.getState().error).toBe("Network error");

		store.setPhoto("front", "blob:url", "p-1");
		store.nextStep();
		store.setIsAnalyzing(true);
		store.setResult({
			id: "123e4567-e89b-12d3-a456-426614174000",
			carSize: "medium",
			dirtLevel: "moderate",
			brand: "Audi A3",
			priceMin: 120,
			priceMax: 138,
			durationHours: 2.5,
			summaryText: "Summary",
			diagnostics: [{ title: "Paint", description: "Light swirls" }],
			expertVerdict: "Polish recommended",
			createdAt: "2026-11-22T20:00:00.000Z",
		});
		expect(useAssessmentStore.getState().isAnalyzing).toBe(false);
		expect(useAssessmentStore.getState().result?.brand).toBe("Audi A3");

		useAssessmentStore.getState().reset();
		const resetState = useAssessmentStore.getState();
		expect(resetState.currentStep).toBe("front");
		expect(resetState.photos).toEqual([]);
		expect(resetState.services).toEqual([]);
		expect(resetState.result).toBeNull();
		expect(resetState.isAnalyzing).toBe(false);
		expect(resetState.error).toBeNull();
	});
});
