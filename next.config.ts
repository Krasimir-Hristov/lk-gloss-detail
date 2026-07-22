import createNextIntlPlugin from "next-intl/plugin";

import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: "5mb",
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co")
					.hostname,
				pathname: "/storage/v1/object/public/**",
			},
		],
	},
};

export default withNextIntl(nextConfig);
