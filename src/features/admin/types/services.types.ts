export interface MultilingualText {
	de?: string;
	en?: string;
	el?: string;
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

export function getLocalizedText(
	field: Record<string, string> | string | null | undefined,
	locale: string = "de",
): string {
	if (!field) return "";

	let parsedField = field;

	// Recursively parse if it's double-stringified
	while (typeof parsedField === "string") {
		try {
			const attempt = JSON.parse(parsedField);
			if (typeof attempt === "object" && attempt !== null) {
				parsedField = attempt;
			} else if (typeof attempt === "string" && attempt !== parsedField) {
				parsedField = attempt;
			} else {
				break;
			}
		} catch {
			break;
		}
	}

	if (typeof parsedField === "object" && parsedField !== null) {
		const obj = parsedField as Record<string, string>;

		// Wait, if the user manually pasted JSON inside a single key, obj[locale] might still be a stringified JSON!
		let value = obj[locale] || obj.de || obj.en || obj.el || Object.values(obj)[0] || "";

		// If the value itself is a stringified JSON, parse it too!
		while (typeof value === "string") {
			try {
				const attempt = JSON.parse(value);
				if (typeof attempt === "object" && attempt !== null) {
					const innerObj = attempt as Record<string, string>;
					value =
						innerObj[locale] ||
						innerObj.de ||
						innerObj.en ||
						innerObj.el ||
						Object.values(innerObj)[0] ||
						value;
					break;
				} else {
					break;
				}
			} catch {
				break;
			}
		}

		return String(value);
	}

	return String(parsedField);
}
