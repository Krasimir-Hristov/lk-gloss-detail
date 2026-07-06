"use client";

import { useMutation } from "@tanstack/react-query";

import type {
	PhotoValidationRequest,
	PhotoValidationResponse,
} from "@/features/assessment/schemas/photo-validation.schema";

// ── Photo Validation Hook ──────────────────────────────────────────────────

export const useValidatePhoto = () => {
	return useMutation({
		mutationFn: async (data: PhotoValidationRequest): Promise<PhotoValidationResponse> => {
			const response = await fetch("/api/assessment/validate-photo", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error(`Validation API error: ${response.statusText}`);
			}

			return response.json();
		},
	});
};

// ── Analyze Assessment Hook ────────────────────────────────────────────────

export const useAnalyzeAssessment = () => {
	return useMutation({
		mutationFn: async ({
			base64Images,
			acceptedServiceIds,
			locale,
		}: {
			base64Images: string[];
			acceptedServiceIds: string[];
			locale: string;
		}) => {
			const res = await fetch("/api/assessment/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ base64Images, acceptedServiceIds, locale }),
			});

			if (!res.ok) {
				const err = (await res.json()) as { error?: string };
				throw new Error(err.error ?? "Analysis failed");
			}

			return res.json();
		},
	});
};
