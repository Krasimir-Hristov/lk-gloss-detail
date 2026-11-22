import { z } from "zod";

export const PhotoValidationRequestSchema = z.object({
	imageBase64: z
		.string()
		.max(4_500_000)
		.regex(/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/),
	expectedAngle: z.enum(["front", "rear", "side", "interior"]),
	previousCarDescriptions: z.array(z.string().trim().max(200)).max(3).optional(),
	locale: z.enum(["de", "en", "el"]).default("de"),
});

export type PhotoValidationRequest = z.infer<typeof PhotoValidationRequestSchema>;

export const PhotoValidationResponseSchema = z.object({
	valid: z.boolean(),
	reason: z.string(),
	userMessage: z.string().nullable(),
	carSize: z.enum(["small", "medium", "large", "suv"]).nullable(),
	dirtLevel: z.enum(["light", "moderate", "heavy"]).nullable(),
	carDescription: z.string().nullable(),
	visualFindings: z.array(z.string().trim().max(160)).max(4).default([]),
});

export type PhotoValidationResponse = z.infer<typeof PhotoValidationResponseSchema>;
