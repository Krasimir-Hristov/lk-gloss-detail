import { z } from "zod";

import { AppLocaleSchema, DEFAULT_LOCALE } from "@/i18n/locales";

export const ServiceLocaleSchema = AppLocaleSchema;

export type ServiceLocale = z.infer<typeof ServiceLocaleSchema>;

export const LocalizedTextPartialSchema = z.object({
	de: z.string().optional(),
	en: z.string().optional(),
	el: z.string().optional(),
	sq: z.string().optional(),
	tr: z.string().optional(),
});

export type LocalizedTextPartial = z.infer<typeof LocalizedTextPartialSchema>;

export const ServiceTranslationsSchema = z.object({
	name: LocalizedTextPartialSchema.optional(),
	short_description: LocalizedTextPartialSchema.optional(),
});

export type ServiceTranslations = z.infer<typeof ServiceTranslationsSchema>;

export const TranslatedTextMapSchema = z.object({
	de: z.string(),
	en: z.string(),
	el: z.string(),
	sq: z.string(),
	tr: z.string(),
});

export const TranslatedTextTripleSchema = TranslatedTextMapSchema;

export const TranslatedServicePairSchema = z.object({
	name: TranslatedTextMapSchema,
	short_description: TranslatedTextMapSchema,
});

export type TranslatedServicePair = z.infer<typeof TranslatedServicePairSchema>;

export const ServiceInputSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	short_description: z.string().optional().nullable(),
	category: z.string().min(1, "Category is required"),
	icon: z.string().min(1, "Icon name is required"),
	image_url: z.string().optional().nullable(),
	price_small: z.number().min(0),
	price_medium: z.number().min(0),
	price_large: z.number().min(0),
	price_suv: z.number().min(0),
	duration_hours: z.number().min(0.5, "Duration must be at least 30 mins"),
	active: z.boolean(),
	sort_order: z.number().int(),
	locale: ServiceLocaleSchema.default(DEFAULT_LOCALE),
	translations: ServiceTranslationsSchema.optional(),
});

export type ServiceInput = z.infer<typeof ServiceInputSchema>;
export type ServiceFormInput = z.input<typeof ServiceInputSchema>;

export const ToggleServiceActiveSchema = z.object({
	id: z.string().uuid(),
	active: z.boolean(),
});

export type ToggleServiceActiveInput = z.infer<typeof ToggleServiceActiveSchema>;
