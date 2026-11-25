export type HeaderLookup = Pick<Headers, "get">;

/**
 * Resolves the client IP solely from verified ingress headers or a configured trusted-proxy hop
 * count (counting from the right of x-forwarded-for). Never trusts the client-spoofable leftmost IP.
 */
export const resolveClientIp = (headers: HeaderLookup): string => {
	if (process.env.VERCEL === "1") {
		const vercelForwarded = headers.get("x-vercel-forwarded-for");
		if (vercelForwarded) {
			const hops = vercelForwarded
				.split(",")
				.map((part) => part.trim())
				.filter(Boolean);
			if (hops.length > 0) {
				return hops[hops.length - 1];
			}
		}

		const realIp = headers.get("x-real-ip")?.trim();
		if (realIp) {
			return realIp;
		}
		return "unknown";
	}

	const rawProxyCount = process.env.TRUSTED_PROXY_COUNT?.trim();
	if (rawProxyCount && /^\d+$/.test(rawProxyCount)) {
		const trustedProxyCount = Number.parseInt(rawProxyCount, 10);
		if (trustedProxyCount >= 1) {
			const forwardedFor = headers.get("x-forwarded-for");
			if (forwardedFor) {
				const entries = forwardedFor
					.split(",")
					.map((part) => part.trim())
					.filter(Boolean);
				if (entries.length >= trustedProxyCount) {
					return entries[entries.length - trustedProxyCount];
				}
			}
		}
	}

	return "unknown";
};
