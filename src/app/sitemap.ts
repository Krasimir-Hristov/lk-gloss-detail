import { getBaseUrl } from "@/constants/site";
import { routing } from "@/i18n/routing";

import type { MetadataRoute } from "next";

type RouteConfig = {
	path: string;
	priority: number;
	changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
};

const PUBLIC_ROUTES: RouteConfig[] = [
	{ path: "", priority: 1.0, changeFrequency: "weekly" },
	{ path: "/assessment", priority: 0.9, changeFrequency: "weekly" },
	{ path: "/booking", priority: 0.9, changeFrequency: "weekly" },
	{ path: "/contact", priority: 0.8, changeFrequency: "monthly" },
	{ path: "/impressum", priority: 0.3, changeFrequency: "yearly" },
	{ path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

const sitemap = (): MetadataRoute.Sitemap => {
	const baseUrl = getBaseUrl();
	const lastModified = new Date();
	const entries: MetadataRoute.Sitemap = [];

	for (const route of PUBLIC_ROUTES) {
		for (const locale of routing.locales) {
			const url = `${baseUrl}/${locale}${route.path}`;

			const languageAlternates = Object.fromEntries(
				routing.locales.map((loc) => [loc, `${baseUrl}/${loc}${route.path}`]),
			);

			entries.push({
				url,
				lastModified,
				changeFrequency: route.changeFrequency,
				priority: route.priority,
				alternates: {
					languages: {
						...languageAlternates,
						"x-default": `${baseUrl}/${routing.defaultLocale}${route.path}`,
					},
				},
			});
		}
	}

	return entries;
};

export default sitemap;
