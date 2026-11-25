"use client";

import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

import { WIZARD_STEPS } from "@/features/assessment/schemas/assessmentSchema";

import type {
	AssessmentPhoto,
	AssessmentResult,
	AssessmentState,
	ServiceSelection,
	WizardStep,
} from "@/features/assessment/schemas/assessmentSchema";

type AssessmentActions = {
	setPhoto: (angle: AssessmentPhoto["angle"], previewUrl: string, existingId?: string) => void;
	setPhotoValidation: (
		photoId: string,
		status: AssessmentPhoto["validationStatus"],
		reason?: string,
		carSize?: "small" | "medium" | "large" | "suv",
		dirtLevel?: "light" | "moderate" | "heavy",
		carDescription?: string,
		visualFindings?: string[],
	) => void;
	nextStep: () => void;
	prevStep: () => void;
	goToStep: (step: WizardStep) => void;
	setServices: (services: ServiceSelection[]) => void;
	acceptService: (serviceId: string) => void;
	rejectService: (serviceId: string) => void;
	setResult: (result: AssessmentResult) => void;
	setIsAnalyzing: (isAnalyzing: boolean) => void;
	setError: (error: string | null) => void;
	clearPhotos: () => void;
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

	setPhoto: (angle, previewUrl, existingId) => {
		const photo: AssessmentPhoto = {
			id: existingId ?? uuidv4(),
			angle,
			previewUrl,
			validationStatus: "pending",
		};
		set((state) => ({
			photos: [...state.photos.filter((p) => p.angle !== angle), photo],
		}));
	},

	setPhotoValidation: (
		photoId,
		status,
		reason,
		carSize,
		dirtLevel,
		carDescription,
		visualFindings,
	) => {
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
							visualFindings: visualFindings ?? p.visualFindings,
						}
					: p,
			),
		}));
	},

	nextStep: () => {
		const { currentStep } = get();
		const idx = WIZARD_STEPS.indexOf(currentStep);
		if (idx < WIZARD_STEPS.length - 1) {
			const next = WIZARD_STEPS[idx + 1];
			set({ currentStep: next });
		}
	},

	prevStep: () => {
		const { currentStep } = get();
		const idx = WIZARD_STEPS.indexOf(currentStep);
		if (idx > 0) {
			const prev = WIZARD_STEPS[idx - 1];
			set({ currentStep: prev });
		}
	},

	goToStep: (step) => {
		set({ currentStep: step });
	},

	setServices: (services) => {
		set({ services });
	},

	acceptService: (serviceId) => {
		set((state) => ({
			services: state.services.map((s) =>
				s.serviceId === serviceId ? { ...s, accepted: true } : s,
			),
		}));
	},

	rejectService: (serviceId) => {
		set((state) => ({
			services: state.services.map((s) =>
				s.serviceId === serviceId ? { ...s, accepted: false } : s,
			),
		}));
	},

	setResult: (result) => {
		set({ result, isAnalyzing: false });
	},

	setIsAnalyzing: (isAnalyzing) => {
		set({ isAnalyzing });
	},

	setError: (error) => {
		set({ error, isAnalyzing: false });
	},

	clearPhotos: () => {
		set({ photos: [] });
	},

	reset: () => {
		set(initialState);
	},
}));
