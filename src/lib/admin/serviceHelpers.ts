import { z } from "zod";

import { getExactLocalizedText } from "@/features/admin/types/servicesTypes";
import { SUPPORTED_LOCALES } from "@/i18n/locales";

import type { LocalizedTextPartial, ServiceLocale } from "@/features/admin/schemas/servicesSchema";

export type LocalizedTextMap = Record<ServiceLocale, string>;
export type StoredLocalizedMap = Partial<LocalizedTextMap>;
export type LocalizedTriple = LocalizedTextMap;

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

export const createUniformTextMap = (text: string): LocalizedTextMap =>
	Object.fromEntries(SUPPORTED_LOCALES.map((loc) => [loc, text])) as LocalizedTextMap;

export const createEmptyTextMap = (): LocalizedTextMap => createUniformTextMap("");

/** Extracts only locales actually stored in `field`, avoiding synthetic fallback entries. */
export const extractStoredTranslations = (
	field: Record<string, string> | string | null | undefined,
): Record<string, string> => {
	const result: Record<string, string> = {};
	for (const loc of SUPPORTED_LOCALES) {
		const value = getExactLocalizedText(field, loc).trim();
		if (value) {
			result[loc] = value;
		}
	}
	return result;
};

export const mergeOverrides = <T extends Record<string, string>>(
	base: T,
	override: LocalizedTextPartial | undefined,
	existing?: Record<string, string>,
): T & Record<string, string> => {
	const result: Record<string, string> = { ...base };
	if (!override) return result as T & Record<string, string>;
	for (const loc of SUPPORTED_LOCALES) {
		const candidate = override[loc];
		if (typeof candidate !== "string") continue;
		const trimmed = candidate.trim();
		if (!trimmed) continue;
		if (!existing || trimmed !== (existing[loc] ?? "").trim()) {
			result[loc] = trimmed;
		}
	}
	return result as T & Record<string, string>;
};

export const hasCompleteTranslations = (override: LocalizedTextPartial | undefined): boolean =>
	Boolean(override && SUPPORTED_LOCALES.every((loc) => Boolean(override[loc]?.trim())));

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
