import { z } from "zod";

// ── Photo Angle Enum (4 angles only) ───────────────────────────────────────

export const PhotoAngleSchema = z.enum(["front", "rear", "side", "interior"]);
export type PhotoAngle = z.infer<typeof PhotoAngleSchema>;

// ── Assessment Photo ───────────────────────────────────────────────────────

export const AssessmentPhotoSchema = z.object({
	id: z.string().uuid(),
	angle: PhotoAngleSchema,
	previewUrl: z.string().url(),
	uploadedUrl: z.string().url().optional(),
	validationStatus: z.enum(["pending", "validating", "valid", "invalid"]),
	validationReason: z.string().optional(),
	carSize: z.enum(["small", "medium", "large", "suv"]).optional(),
	dirtLevel: z.enum(["light", "moderate", "heavy"]).optional(),
	carDescription: z.string().optional(),
});
export type AssessmentPhoto = z.infer<typeof AssessmentPhotoSchema>;

// ── Service Selection ──────────────────────────────────────────────────────

export const ServiceSelectionSchema = z.object({
	serviceId: z.string().uuid(),
	name: z.string(),
	description: z.string(),
	icon: z.string(),
	priceHint: z.string(),
	accepted: z.boolean(),
});
export type ServiceSelection = z.infer<typeof ServiceSelectionSchema>;

// ── Price Estimate ─────────────────────────────────────────────────────────

export const PriceEstimateSchema = z.object({
	priceMin: z.number().positive(),
	priceMax: z.number().positive(),
	durationHours: z.number().positive(),
	currency: z.literal("EUR"),
});
export type PriceEstimate = z.infer<typeof PriceEstimateSchema>;

// ── Service Breakdown ──────────────────────────────────────────────────────

export const ServiceBreakdownSchema = z.object({
	serviceId: z.string().uuid(),
	name: z.string(),
	included: z.boolean(),
	priceContribution: z.number().nonnegative(),
	notes: z.string().optional(),
});
export type ServiceBreakdown = z.infer<typeof ServiceBreakdownSchema>;

// ── Assessment Result ──────────────────────────────────────────────────────

export const AssessmentResultSchema = z.object({
	id: z.string().uuid(),
	priceEstimate: PriceEstimateSchema,
	durationHours: z.number().positive(),
	summaryText: z.string(),
	servicesBreakdown: z.array(ServiceBreakdownSchema),
	carSize: z.enum(["small", "medium", "large", "suv"]),
	dirtLevel: z.enum(["light", "moderate", "heavy"]),
	paintCondition: z.enum(["excellent", "good", "fair", "poor"]),
	createdAt: z.string().datetime(),
});
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

// ── Wizard Step (4 photos → services → analyzing → results) ────────────────

export const WIZARD_STEPS = [
	"front",
	"rear",
	"side",
	"interior",
	"services",
	"analyzing",
	"results",
] as const;

export const WizardStep = z.enum(WIZARD_STEPS);
export type WizardStep = z.infer<typeof WizardStep>;

// ── Shared photo step list ─────────────────────────────────────────────────

export const PHOTO_STEPS: WizardStep[] = ["front", "rear", "side", "interior"];

// ── Assessment State (Zustand store shape) ─────────────────────────────────

export const AssessmentStateSchema = z.object({
	currentStep: WizardStep,
	photos: z.array(AssessmentPhotoSchema),
	services: z.array(ServiceSelectionSchema),
	result: AssessmentResultSchema.nullable(),
	isAnalyzing: z.boolean(),
	error: z.string().nullable(),
});
export type AssessmentState = z.infer<typeof AssessmentStateSchema>;
