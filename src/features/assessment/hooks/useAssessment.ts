"use client";

import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import type {
	PhotoValidationRequest,
	PhotoValidationResponse,
} from "@/features/assessment/schemas/photoValidationSchema";

const ErrorResponseSchema = z.object({
	userMessage: z.string().optional(),
	reason: z.string().optional(),
	error: z.string().optional(),
});

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
				const json = await response.json().catch(() => null);
				const parsed = ErrorResponseSchema.safeParse(json);
				const payload = parsed.success ? parsed.data : null;
				const errorMessage =
					payload?.userMessage ||
					payload?.reason ||
					payload?.error ||
					`Validation API error (${response.status}${response.statusText ? ` ${response.statusText}` : ""})`;
				throw new Error(errorMessage);
			}

			return response.json();
		},
	});
};

// ── Analyze Assessment Hook ────────────────────────────────────────────────

export const useAnalyzeAssessment = () => {
	return useMutation({
		mutationFn: async ({
			acceptedServiceIds,
			carSize,
			dirtLevel,
			brand,
			locale,
		}: {
			acceptedServiceIds: string[];
			carSize: string;
			dirtLevel: string;
			brand: string | null;
			locale: string;
		}) => {
			const res = await fetch("/api/assessment/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ acceptedServiceIds, carSize, dirtLevel, brand, locale }),
			});

			if (!res.ok) {
				const json = await res.json().catch(() => null);
				const parsed = ErrorResponseSchema.safeParse(json);
				const errorMessage =
					parsed.success && parsed.data.error ? parsed.data.error : "Analysis failed";
				throw new Error(errorMessage);
			}

			return res.json();
		},
	});
};
