import { z } from "zod";

import { getLocalizedText } from "@/features/admin/types/servicesTypes";

import type { LocalizedTextPartial, ServiceLocale } from "@/features/admin/schemas/servicesSchema";

export type LocalizedTriple = { de: string; en: string; el: string };

const LOCALES: readonly ServiceLocale[] = ["de", "en", "el"];

const LocalizedFieldSchema = z.union([z.record(z.string(), z.string()), z.string()]);

export const AdminServiceRowSchema = z.object({
	id: z.string(),
	name: LocalizedFieldSchema,
	short_description: LocalizedFieldSchema.nullable(),
	icon: z.string(),
	image_url: z.string().nullable(),
	category: z.string(),
	price_small: z.number(),
	price_medium: z.number(),
	price_large: z.number(),
	price_suv: z.number(),
	duration_hours: z.number(),
	active: z.boolean(),
	sort_order: z.number(),
	created_at: z.string(),
});

export const normalizeTriple = (
	field: Record<string, string> | string | null | undefined,
): LocalizedTriple => ({
	de: getLocalizedText(field, "de"),
	en: getLocalizedText(field, "en"),
	el: getLocalizedText(field, "el"),
});

export const mergeOverrides = (
	base: LocalizedTriple,
	override: LocalizedTextPartial | undefined,
	existing?: LocalizedTriple,
): LocalizedTriple => {
	if (!override) return base;
	const result: LocalizedTriple = { ...base };
	for (const loc of LOCALES) {
		const candidate = override[loc];
		if (typeof candidate !== "string") continue;
		const trimmed = candidate.trim();
		if (!trimmed) continue;
		if (!existing || trimmed !== existing[loc].trim()) {
			result[loc] = trimmed;
		}
	}
	return result;
};

export const hasCompleteTranslations = (override: LocalizedTextPartial | undefined): boolean =>
	Boolean(override && LOCALES.every((loc) => Boolean(override[loc]?.trim())));

export const extractGalleryStoragePath = (imageUrl: string): string | null => {
	try {
		const parsedUrl = new URL(imageUrl);
		const marker = "/gallery/";
		const idx = parsedUrl.pathname.indexOf(marker);
		if (idx === -1) return null;
		const filePath = decodeURIComponent(parsedUrl.pathname.slice(idx + marker.length));
		return filePath && !filePath.includes("..") ? filePath : null;
	} catch {
		return null;
	}
};
