import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
	AI_LOCALE_NAMES,
	DATE_LOCALE_MAP,
	DEFAULT_LOCALE,
	resolveAppLocale,
	SUPPORTED_LOCALES,
	type AppLocale,
} from "@/i18n/locales";
import { routing } from "@/i18n/routing";

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const flattenLeafStrings = (node: unknown, prefix = ""): Record<string, string> => {
	if (typeof node === "string") {
		return { [prefix]: node };
	}
	if (Array.isArray(node)) {
		const result: Record<string, string> = {};
		node.forEach((item, index) => {
			Object.assign(result, flattenLeafStrings(item, `${prefix}[${index}]`));
		});
		return result;
	}
	if (!isPlainRecord(node)) {
		throw new Error(`Unexpected non-string, non-object value at key "${prefix}"`);
	}
	const result: Record<string, string> = {};
	for (const [key, val] of Object.entries(node)) {
		const nextKey = prefix ? `${prefix}.${key}` : key;
		Object.assign(result, flattenLeafStrings(val, nextKey));
	}
	return result;
};

const extractPlaceholders = (text: string): string[] => {
	const matches = new Set<string>();
	const regex = /\{([a-zA-Z0-9_]+)(?=[,}])/g;
	for (const match of text.matchAll(regex)) {
		if (match[1]) matches.add(match[1]);
	}
	return Array.from(matches).sort();
};

const loadMessages = (locale: AppLocale): Record<string, string> => {
	const filePath = resolve(process.cwd(), "messages", `${locale}.json`);
	const parsed: unknown = JSON.parse(readFileSync(filePath, "utf8"));
	return flattenLeafStrings(parsed);
};

describe("i18n Configuration & Translation Parity", () => {
	it("configures routing with all 5 locales, de default, and localeDetection disabled", () => {
		expect(routing.locales).toEqual(["de", "en", "el", "sq", "tr"]);
		expect(routing.defaultLocale).toBe("de");
		expect(routing.localeDetection).toBe(false);
	});

	it("covers all 5 locales in resolveAppLocale, DATE_LOCALE_MAP, and AI_LOCALE_NAMES", () => {
		const expectedLocales = [...SUPPORTED_LOCALES].sort();
		expect(Object.keys(DATE_LOCALE_MAP).sort()).toEqual(expectedLocales);
		expect(Object.keys(AI_LOCALE_NAMES).sort()).toEqual(expectedLocales);

		for (const loc of SUPPORTED_LOCALES) {
			expect(resolveAppLocale(loc)).toBe(loc);
			expect(DATE_LOCALE_MAP[loc].trim().length).toBeGreaterThan(0);
			expect(AI_LOCALE_NAMES[loc].trim().length).toBeGreaterThan(0);
		}

		expect(resolveAppLocale("fr")).toBe(DEFAULT_LOCALE);
		expect(resolveAppLocale(undefined)).toBe(DEFAULT_LOCALE);
		expect(resolveAppLocale(null)).toBe(DEFAULT_LOCALE);
	});

	it("maintains 100% leaf-key parity, non-empty values, matching ICU placeholders, and LanguageSwitcher labels across all 5 locales", () => {
		const localeLeaves = new Map<AppLocale, Record<string, string>>();
		for (const loc of SUPPORTED_LOCALES) {
			localeLeaves.set(loc, loadMessages(loc));
		}

		const baseLeaves = localeLeaves.get(DEFAULT_LOCALE);
		expect(baseLeaves).toBeDefined();
		if (!baseLeaves) return;

		const baseKeys = Object.keys(baseLeaves).sort();
		expect(baseKeys.length).toBeGreaterThan(0);

		for (const loc of SUPPORTED_LOCALES) {
			const leaves = localeLeaves.get(loc);
			expect(leaves).toBeDefined();
			if (!leaves) continue;

			expect(Object.keys(leaves).sort()).toEqual(baseKeys);

			for (const key of baseKeys) {
				const value = leaves[key];
				expect(value, `Empty translation for ${loc}:${key}`).toBeDefined();
				expect(value.trim().length, `Blank translation for ${loc}:${key}`).toBeGreaterThan(0);
				expect(extractPlaceholders(value), `Mismatched ICU placeholders for ${loc}:${key}`).toEqual(
					extractPlaceholders(baseLeaves[key]),
				);
			}

			for (const switcherLoc of SUPPORTED_LOCALES) {
				const shortVal = leaves[`LanguageSwitcher.locales.${switcherLoc}.short`];
				const fullVal = leaves[`LanguageSwitcher.locales.${switcherLoc}.full`];
				expect(
					shortVal?.trim().length,
					`Missing LanguageSwitcher.locales.${switcherLoc}.short in ${loc}.json`,
				).toBeGreaterThan(0);
				expect(
					fullVal?.trim().length,
					`Missing LanguageSwitcher.locales.${switcherLoc}.full in ${loc}.json`,
				).toBeGreaterThan(0);
			}
		}
	});
});
