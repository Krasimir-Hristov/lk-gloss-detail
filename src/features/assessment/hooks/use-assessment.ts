"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

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

// ── Analyze Assessment Hook (streaming) ────────────────────────────────────

export const useAnalyzeAssessment = () => {
	return useMutation({
		mutationFn: async ({
			photoUrls,
			acceptedServiceIds,
			locale,
		}: {
			photoUrls: string[];
			acceptedServiceIds: string[];
			locale: string;
		}) => {
			const res = await fetch("/api/assessment/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ photoUrls, acceptedServiceIds, locale }),
			});

			if (!res.ok) {
				const err = (await res.json()) as { error?: string };
				throw new Error(err.error ?? "Analysis failed");
			}

			return res.json();
		},
	});
};

// ── Services Query ─────────────────────────────────────────────────────────

export const useServices = (locale: string) => {
	return useQuery({
		queryKey: ["services", locale],
		queryFn: async () => {
			const res = await fetch(`/api/services?locale=${locale}`);
			if (!res.ok) throw new Error("Failed to fetch services");
			return res.json();
		},
		staleTime: 5 * 60 * 1000, // 5 min cache
	});
};
