"use client";

import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

import { WIZARD_STEPS } from "@/features/assessment/schemas/assessment.schema";

import type {
	AssessmentPhoto,
	AssessmentResult,
	AssessmentState,
	ServiceSelection,
	WizardStep,
} from "@/features/assessment/schemas/assessment.schema";

type AssessmentActions = {
	setPhoto: (angle: AssessmentPhoto["angle"], previewUrl: string) => void;
	setPhotoValidation: (
		photoId: string,
		status: AssessmentPhoto["validationStatus"],
		reason?: string,
		carSize?: "small" | "medium" | "large" | "suv",
		dirtLevel?: "light" | "moderate" | "heavy",
		carDescription?: string,
	) => void;
	setPhotoUploadedUrl: (photoId: string, url: string) => void;
	nextStep: () => void;
	prevStep: () => void;
	goToStep: (step: WizardStep) => void;
	setServices: (services: ServiceSelection[]) => void;
	acceptService: (serviceId: string) => void;
	rejectService: (serviceId: string) => void;
	setResult: (result: AssessmentResult) => void;
	setIsAnalyzing: (isAnalyzing: boolean) => void;
	setError: (error: string | null) => void;
	reset: () => void;
};

const initialState: AssessmentState = {
	currentStep: "front",
	photos: [],
	services: [],
	result: null,
	isAnalyzing: false,
	error: null,
};

export const useAssessmentStore = create<AssessmentState & AssessmentActions>()((set, get) => ({
	...initialState,

	setPhoto: (angle, previewUrl) => {
		const photo: AssessmentPhoto = {
			id: uuidv4(),
			angle,
			previewUrl,
			validationStatus: "pending",
		};
		console.log("[AssessmentStore] setPhoto:", { angle, photoId: photo.id });
		set((state) => ({
			photos: [...state.photos.filter((p) => p.angle !== angle), photo],
		}));
	},

	setPhotoValidation: (photoId, status, reason, carSize, dirtLevel, carDescription) => {
		console.log("[AssessmentStore] setPhotoValidation:", {
			photoId,
			status,
			carSize,
			dirtLevel,
			carDescription,
		});
		set((state) => ({
			photos: state.photos.map((p) =>
				p.id === photoId
					? {
							...p,
							validationStatus: status,
							validationReason: reason,
							carSize: carSize ?? p.carSize,
							dirtLevel: dirtLevel ?? p.dirtLevel,
							carDescription: carDescription ?? p.carDescription,
						}
					: p,
			),
		}));
	},

	setPhotoUploadedUrl: (photoId, url) => {
		console.log("[AssessmentStore] setPhotoUploadedUrl:", { photoId, url });
		set((state) => ({
			photos: state.photos.map((p) => (p.id === photoId ? { ...p, uploadedUrl: url } : p)),
		}));
	},

	nextStep: () => {
		const { currentStep } = get();
		const idx = WIZARD_STEPS.indexOf(currentStep);
		if (idx < WIZARD_STEPS.length - 1) {
			const next = WIZARD_STEPS[idx + 1];
			console.log("[AssessmentStore] nextStep:", { from: currentStep, to: next });
			set({ currentStep: next });
		}
	},

	prevStep: () => {
		const { currentStep } = get();
		const idx = WIZARD_STEPS.indexOf(currentStep);
		if (idx > 0) {
			const prev = WIZARD_STEPS[idx - 1];
			console.log("[AssessmentStore] prevStep:", { from: currentStep, to: prev });
			set({ currentStep: prev });
		}
	},

	goToStep: (step) => {
		console.log("[AssessmentStore] goToStep:", step);
		set({ currentStep: step });
	},

	setServices: (services) => {
		console.log("[AssessmentStore] setServices called with", services.length, "services:", {
			ids: services.map((s) => s.serviceId),
		});
		set({ services });
	},

	acceptService: (serviceId) => {
		console.log("[AssessmentStore] Service accepted:", serviceId);
		set((state) => {
			const updated = state.services.map((s) =>
				s.serviceId === serviceId ? { ...s, accepted: true } : s,
			);
			console.log("[AssessmentStore] Current services state:", {
				accepted: updated.filter((s) => s.accepted).map((s) => s.serviceId),
				rejected: updated.filter((s) => !s.accepted).map((s) => s.serviceId),
			});
			return { services: updated };
		});
	},

	rejectService: (serviceId) => {
		console.log("[AssessmentStore] Service rejected:", serviceId);
		set((state) => {
			const updated = state.services.map((s) =>
				s.serviceId === serviceId ? { ...s, accepted: false } : s,
			);
			console.log("[AssessmentStore] Current services state:", {
				accepted: updated.filter((s) => s.accepted).map((s) => s.serviceId),
				rejected: updated.filter((s) => !s.accepted).map((s) => s.serviceId),
			});
			return { services: updated };
		});
	},

	setResult: (result) => {
		console.log("[AssessmentStore] setResult:", {
			id: result.id,
			priceRange: result.priceEstimate,
		});
		set({ result, isAnalyzing: false });
	},

	setIsAnalyzing: (isAnalyzing) => {
		console.log("[AssessmentStore] setIsAnalyzing:", isAnalyzing);
		set({ isAnalyzing });
	},

	setError: (error) => {
		console.log("[AssessmentStore] setError:", error);
		set({ error, isAnalyzing: false });
	},

	reset: () => {
		console.log("[AssessmentStore] reset");
		set(initialState);
	},
}));
