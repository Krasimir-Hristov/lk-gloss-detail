import { beforeEach, describe, expect, it } from "vitest";

import { useBookingStore } from "@/features/booking/stores/booking-store";

describe("useBookingStore", () => {
	beforeEach(() => {
		useBookingStore.getState().reset();
	});

	it("initializes with default empty state and step 1", () => {
		const state = useBookingStore.getState();
		expect(state.step).toBe(1);
		expect(state.firstName).toBe("");
		expect(state.selectedServiceIds).toEqual([]);
		expect(state.bookingDate).toBe("");
		expect(state.isSubmitting).toBe(false);
		expect(state.submitError).toBeNull();
	});

	it("manages step transitions between 1 and 4", () => {
		useBookingStore.getState().nextStep();
		expect(useBookingStore.getState().step).toBe(2);

		useBookingStore.getState().nextStep();
		expect(useBookingStore.getState().step).toBe(3);

		useBookingStore.getState().nextStep();
		expect(useBookingStore.getState().step).toBe(4);

		// Boundaries: cannot exceed 4
		useBookingStore.getState().nextStep();
		expect(useBookingStore.getState().step).toBe(4);

		useBookingStore.getState().prevStep();
		expect(useBookingStore.getState().step).toBe(3);
	});

	it("updates client info upon valid data", () => {
		const validClient = {
			firstName: "Alex",
			lastName: "Morgan",
			email: "alex@example.com",
			phone: "+491601234567",
			carDescription: "Porsche 911",
			gdprAccepted: true,
		};
		useBookingStore.getState().setClientInfo(validClient);

		const state = useBookingStore.getState();
		expect(state.firstName).toBe("Alex");
		expect(state.lastName).toBe("Morgan");
		expect(state.email).toBe("alex@example.com");
		expect(state.carDescription).toBe("Porsche 911");
		expect(state.gdprAccepted).toBe(true);
	});

	it("ignores client info update if Zod validation fails", () => {
		const invalidClient = {
			firstName: "",
			lastName: "",
			email: "bad-email",
			phone: "123",
			gdprAccepted: false,
		};
		useBookingStore.getState().setClientInfo(invalidClient);

		expect(useBookingStore.getState().firstName).toBe("");
	});

	it("sets preselected service IDs", () => {
		const serviceIds = [
			"123e4567-e89b-12d3-a456-426614174000",
			"987e6543-e89b-12d3-a456-426614174000",
		];
		useBookingStore.getState().setPreselectedServices(serviceIds);

		expect(useBookingStore.getState().selectedServiceIds).toEqual(serviceIds);
	});

	it("sets booking date when valid YYYY-MM-DD string", () => {
		useBookingStore.getState().setDate({ bookingDate: "2026-08-20" });
		expect(useBookingStore.getState().bookingDate).toBe("2026-08-20");
	});

	it("resets store to initial state", () => {
		useBookingStore.getState().setStep(3);
		useBookingStore.getState().setSubmitError("Failed");
		useBookingStore.getState().reset();

		expect(useBookingStore.getState().step).toBe(1);
		expect(useBookingStore.getState().submitError).toBeNull();
	});
});
