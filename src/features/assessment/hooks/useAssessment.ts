"use client";

import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { AssessmentResultSchema } from "@/features/assessment/schemas/assessmentSchema";
import { PhotoValidationResponseSchema } from "@/features/assessment/schemas/photoValidationSchema";

import type {
	AnalyzeRequest,
	AssessmentResult,
} from "@/features/assessment/schemas/assessmentSchema";
import type {
	PhotoValidationRequest,
	PhotoValidationResponse,
} from "@/features/assessment/schemas/photoValidationSchema";

const ErrorResponseSchema = z.object({
	code: z.string().optional(),
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
				if (response.status === 429 || payload?.code === "RATE_LIMITED") {
					throw new Error("RATE_LIMITED");
				}
				const errorMessage =
					payload?.userMessage ||
					payload?.reason ||
					payload?.error ||
					`Validation API error (${response.status}${response.statusText ? ` ${response.statusText}` : ""})`;
				throw new Error(errorMessage);
			}

			const rawBody = await response.json();
			return PhotoValidationResponseSchema.parse(rawBody);
		},
	});
};

// ── Analyze Assessment Hook ────────────────────────────────────────────────

export const useAnalyzeAssessment = () => {
	return useMutation({
		mutationFn: async (data: AnalyzeRequest): Promise<AssessmentResult> => {
			const res = await fetch("/api/assessment/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!res.ok) {
				const json = await res.json().catch(() => null);
				const parsed = ErrorResponseSchema.safeParse(json);
				const payload = parsed.success ? parsed.data : null;
				if (res.status === 429 || payload?.code === "RATE_LIMITED") {
					throw new Error("RATE_LIMITED");
				}
				const errorMessage = payload?.error ?? "Analysis failed";
				throw new Error(errorMessage);
			}

			const rawBody = await res.json();
			const parsed = AssessmentResultSchema.safeParse(rawBody);
			if (!parsed.success) {
				throw new Error("Invalid response from server");
			}
			return parsed.data;
		},
	});
};
