import { getBaseUrl } from "@/constants/site";

import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => {
	const baseUrl = getBaseUrl();

	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/admin/", "/api/admin/", "/admin/*"],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	};
};

export default robots;
