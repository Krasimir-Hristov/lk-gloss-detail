import { beforeEach, describe, expect, it } from "vitest";

import { useAssessmentStore } from "@/features/assessment/stores/assessment-store";

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

	it("adds and updates photos correctly", () => {
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

		// Replacing photo for the same angle
		useAssessmentStore
			.getState()
			.setPhoto("front", "blob:http://localhost/front-photo-new", "test-uuid-2");
		updatedState = useAssessmentStore.getState();
		expect(updatedState.photos).toHaveLength(1);
		expect(updatedState.photos[0].id).toBe("test-uuid-2");
	});

	it("validates photo status and metadata", () => {
		const store = useAssessmentStore.getState();
		store.setPhoto("front", "blob:url", "photo-1");

		store.setPhotoValidation("photo-1", "valid", undefined, "suv", "heavy", "BMW X5 Black");

		const photo = useAssessmentStore.getState().photos[0];
		expect(photo.validationStatus).toBe("valid");
		expect(photo.carSize).toBe("suv");
		expect(photo.dirtLevel).toBe("heavy");
		expect(photo.carDescription).toBe("BMW X5 Black");
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

	it("resets store to initial state", () => {
		useAssessmentStore.getState().setPhoto("front", "blob:url", "p-1");
		useAssessmentStore.getState().nextStep();
		useAssessmentStore.getState().setIsAnalyzing(true);

		useAssessmentStore.getState().reset();

		const resetState = useAssessmentStore.getState();
		expect(resetState.currentStep).toBe("front");
		expect(resetState.photos).toEqual([]);
		expect(resetState.isAnalyzing).toBe(false);
	});
});
