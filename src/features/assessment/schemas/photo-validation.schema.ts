import { z } from "zod";

export const PhotoValidationRequestSchema = z.object({
	imageBase64: z.string(),
	expectedAngle: z.enum(["front", "rear", "side", "interior"]),
	previousCarDescriptions: z.array(z.string()).optional(),
	locale: z.string().optional(),
});

export type PhotoValidationRequest = z.infer<typeof PhotoValidationRequestSchema>;

export const PhotoValidationResponseSchema = z.object({
	valid: z.boolean(),
	reason: z.string(),
	userMessage: z.string().nullable(),
	carSize: z.enum(["small", "medium", "large", "suv"]).nullable(),
	dirtLevel: z.enum(["light", "moderate", "heavy"]).nullable(),
	carDescription: z.string().nullable(),
});

export type PhotoValidationResponse = z.infer<typeof PhotoValidationResponseSchema>;
