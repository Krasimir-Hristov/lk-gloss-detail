"use client";

import { create } from "zustand";

import {
	BookingClientInfoSchema,
	BookingDateSchema,
	BookingServicesSchema,
} from "@/features/booking/schemas/booking.schema";

import type {
	BookingClientInfo,
	BookingDate,
	BookingServices,
} from "@/features/booking/schemas/booking.schema";

type BookingStep = 1 | 2 | 3 | 4;

type BookingState = BookingClientInfo &
	BookingServices &
	BookingDate & {
		step: BookingStep;
		isSubmitting: boolean;
		submitError: string | null;
	};

type BookingActions = {
	setStep: (step: BookingStep) => void;
	nextStep: () => void;
	prevStep: () => void;
	setClientInfo: (data: BookingClientInfo) => void;
	setServices: (data: BookingServices) => void;
	setDate: (data: BookingDate) => void;
	setPreselectedServices: (serviceIds: string[]) => void;
	setIsSubmitting: (isSubmitting: boolean) => void;
	setSubmitError: (error: string | null) => void;
	reset: () => void;
};

const initialState: BookingState = {
	step: 1,
	firstName: "",
	lastName: "",
	email: "",
	phone: "",
	carDescription: "",
	gdprAccepted: false,
	selectedServiceIds: [],
	bookingDate: "",
	isSubmitting: false,
	submitError: null,
};

export const useBookingStore = create<BookingState & BookingActions>()((set, get) => ({
	...initialState,

	setStep: (step) => set({ step }),

	nextStep: () => {
		const { step } = get();
		if (step < 4) set({ step: (step + 1) as BookingStep });
	},

	prevStep: () => {
		const { step } = get();
		if (step > 1) set({ step: (step - 1) as BookingStep });
	},

	setClientInfo: (data) => {
		const parsed = BookingClientInfoSchema.safeParse(data);
		if (parsed.success) {
			set({ ...parsed.data });
		}
	},

	setServices: (data) => {
		const parsed = BookingServicesSchema.safeParse(data);
		if (parsed.success) {
			set({ ...parsed.data });
		}
	},

	setDate: (data) => {
		const parsed = BookingDateSchema.safeParse(data);
		if (parsed.success) {
			set({ ...parsed.data });
		}
	},

	setPreselectedServices: (serviceIds) => {
		set({ selectedServiceIds: serviceIds });
	},

	setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

	setSubmitError: (submitError) => set({ submitError }),

	reset: () => set(initialState),
}));
