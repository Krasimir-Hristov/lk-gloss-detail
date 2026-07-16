import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { rateLimit, ASSESSMENT_RATE_LIMIT } from "@/lib/rate-limit";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") ?? "unknown";
	const { pathname } = request.nextUrl;

	// Check if the request is an internal Next.js/next-intl preflight/router request
	const isNextInternal =
		request.headers.has("x-middleware-preflight") || request.headers.has("x-nextjs-data");

	// ── Rate limit assessment API routes ──────────────────────────────
	if (pathname.startsWith("/api/assessment/")) {
		const key = `${ip}:${pathname}`;

		const limit = pathname.includes("validate")
			? ASSESSMENT_RATE_LIMIT.validatePhoto
			: ASSESSMENT_RATE_LIMIT.analyze;

		const result = rateLimit(key, limit);

		if (!result.success) {
			const retryAfter = Math.ceil(result.resetIn / 1000);
			return NextResponse.json(
				{ error: "Too many requests", retryAfter },
				{
					status: 429,
					headers: { "Retry-After": String(retryAfter) },
				},
			);
		}

		// Scrub headers for external client requests to API
		const headers = new Headers(request.headers);
		if (!isNextInternal) {
			for (const name of Array.from(headers.keys())) {
				if (name.toLowerCase().startsWith("x-")) {
					headers.delete(name);
				}
			}
		}

		// Let API routes pass through to their handlers with scrubbed headers
		return NextResponse.next({
			request: {
				headers,
			},
		});
	}

	// ── Delegate to next-intl for all other routes ────────────────────
	if (isNextInternal) {
		// If it's a Next.js client-side preflight/data request, pass the original request directly
		// to preserve internal preflight headers and client-side page transitions.
		return intlMiddleware(request);
	}

	// For external client requests, perform defensive header scrubbing (CVE-2025-29927 Mitigation)
	const headers = new Headers(request.headers);
	for (const name of Array.from(headers.keys())) {
		if (name.toLowerCase().startsWith("x-")) {
			headers.delete(name);
		}
	}

	const scrubbedRequest = new NextRequest(request, { headers });
	return intlMiddleware(scrubbedRequest);
}

export const config = {
	matcher: [
		// Match assessment API routes for rate limiting
		"/api/assessment/:path*",
		// Match all non-static routes for i18n
		"/((?!api|trpc|_next|_vercel|.*\\..*).*)",
	],
};
