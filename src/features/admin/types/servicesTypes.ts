import { DEFAULT_LOCALE } from "@/i18n/locales";

export interface MultilingualText {
	de?: string;
	en?: string;
	el?: string;
	sq?: string;
	tr?: string;
	[key: string]: string | undefined;
}

export interface AdminServiceItem {
	id: string;
	name: Record<string, string> | string;
	short_description: Record<string, string> | string | null;
	icon: string;
	image_url: string | null;
	category: string;
	price_small: number;
	price_medium: number;
	price_large: number;
	price_suv: number;
	duration_hours: number;
	active: boolean;
	sort_order: number;
	created_at: string;
}

const unwrapLocalizedField = (
	field: Record<string, string> | string | null | undefined,
): Record<string, string> | string | null => {
	if (!field) return null;

	let parsedField: Record<string, string> | string = field;

	// Recursively parse if double-stringified
	while (typeof parsedField === "string") {
		try {
			const attempt: unknown = JSON.parse(parsedField);
			if (typeof attempt === "object" && attempt !== null) {
				parsedField = attempt as Record<string, string>;
			} else if (typeof attempt === "string" && attempt !== parsedField) {
				parsedField = attempt;
			} else {
				break;
			}
		} catch {
			break;
		}
	}

	return parsedField;
};

const pickLocaleFromObject = (
	obj: Record<string, string>,
	locale: string,
	allowFallback: boolean,
): string => {
	if (!allowFallback) {
		const exact = obj[locale];
		return typeof exact === "string" ? exact : "";
	}
	return (
		obj[locale] || obj.de || obj.en || obj.el || obj.sq || obj.tr || Object.values(obj)[0] || ""
	);
};

const unwrapNestedLocaleValue = (value: string, locale: string, allowFallback: boolean): string => {
	if (!value) return "";
	try {
		const attempt: unknown = JSON.parse(value);
		if (typeof attempt === "object" && attempt !== null) {
			return String(pickLocaleFromObject(attempt as Record<string, string>, locale, allowFallback));
		}
	} catch {
		// Plain string value
	}
	return String(value);
};

/** Returns only the value explicitly stored for `locale`, without falling back to `de`. */
export const getExactLocalizedText = (
	field: Record<string, string> | string | null | undefined,
	locale: string = DEFAULT_LOCALE,
): string => {
	const parsedField = unwrapLocalizedField(field);
	if (!parsedField) return "";

	if (typeof parsedField === "object") {
		const value = pickLocaleFromObject(parsedField, locale, false);
		return unwrapNestedLocaleValue(value, locale, false);
	}

	return locale === DEFAULT_LOCALE ? String(parsedField) : "";
};

export function getLocalizedText(
	field: Record<string, string> | string | null | undefined,
	locale: string = "de",
): string {
	const parsedField = unwrapLocalizedField(field);
	if (!parsedField) return "";

	if (typeof parsedField === "object") {
		const value = pickLocaleFromObject(parsedField, locale, true);
		return unwrapNestedLocaleValue(value, locale, true);
	}

	return String(parsedField);
}
