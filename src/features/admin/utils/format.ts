/**
 * Safely format a multilingual value or JSON object into a string for display.
 */
export function formatTextValue(val: unknown, currentLocale: string = "de"): string {
	if (val === null || val === undefined) return "";
	if (typeof val === "string") {
		const trimmed = val.trim();
		if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
			try {
				const parsed = JSON.parse(trimmed);
				return formatTextValue(parsed, currentLocale);
			} catch {
				return val;
			}
		}
		return val;
	}
	if (typeof val === "number" || typeof val === "boolean") return String(val);
	if (typeof val === "object" && val !== null) {
		const obj = val as Record<string, unknown>;
		if (obj[currentLocale] && typeof obj[currentLocale] === "string") {
			return obj[currentLocale] as string;
		}
		if (obj.de && typeof obj.de === "string") return obj.de as string;
		if (obj.el && typeof obj.el === "string") return obj.el as string;
		if (obj.en && typeof obj.en === "string") return obj.en as string;
		if (obj.title && typeof obj.title === "string") return obj.title as string;
		if (obj.topic && typeof obj.topic === "string") return obj.topic as string;
		if (obj.name && typeof obj.name === "string") return obj.name as string;
		if (obj.category && typeof obj.category === "string") return obj.category as string;
		return JSON.stringify(obj);
	}
	return String(val);
}
