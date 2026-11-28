import { z } from "zod";

export const SUPPORTED_LOCALES = ["de", "en", "el", "sq", "tr"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "de";

export const AppLocaleSchema = z.enum(SUPPORTED_LOCALES);

export const isAppLocale = (value: string | undefined | null): value is AppLocale =>
	typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);

export const resolveAppLocale = (value: string | undefined | null): AppLocale =>
	isAppLocale(value) ? value : DEFAULT_LOCALE;

export const DATE_LOCALE_MAP: Record<AppLocale, string> = {
	de: "de-DE",
	en: "en-US",
	el: "el-GR",
	sq: "sq-AL",
	tr: "tr-TR",
};

export const AI_LOCALE_NAMES: Record<AppLocale, string> = {
	de: "German",
	en: "English",
	el: "Greek",
	sq: "Albanian",
	tr: "Turkish",
};
