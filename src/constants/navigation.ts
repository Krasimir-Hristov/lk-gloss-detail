/**
 * Shared navigation link definitions.
 * `href` can be a path (e.g. "/assessment") or a hash anchor (e.g. "#services").
 * When href starts with "#", the link scrolls to that section on the homepage.
 */

export const NAV_LINKS = [
	{ href: "/", i18nKey: "home" },
	{ href: "#services", i18nKey: "services" },
	{ href: "/assessment", i18nKey: "assessment" },
	{ href: "#contact", i18nKey: "contact" },
] as const;

export const LEGAL_LINKS = [
	{ href: "/impressum", i18nKey: "impressum" },
	{ href: "/privacy", i18nKey: "privacy" },
] as const;

export type NavLink = (typeof NAV_LINKS)[number];
export type LegalLink = (typeof LEGAL_LINKS)[number];
