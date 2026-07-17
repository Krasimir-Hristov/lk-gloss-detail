import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { rateLimit, ASSESSMENT_RATE_LIMIT } from "@/lib/rate-limit";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
	// ── Prevent security bypass (CVE-2025-29927 Mitigation) ──────────────────
	// Unconditionally strip x-middleware-subrequest from all incoming requests.
	// This prevents client-side header spoofing from bypassing our proxy controls.
	let currentRequest = request;
	if (request.headers.has("x-middleware-subrequest")) {
		const safeHeaders = new Headers(request.headers);
		safeHeaders.delete("x-middleware-subrequest");
		currentRequest = new NextRequest(request, { headers: safeHeaders });
	}

	const ip = currentRequest.headers.get("x-forwarded-for") ?? "unknown";
	const { pathname } = currentRequest.nextUrl;

	// Check if the request is an internal Next.js/next-intl preflight/router request or a client-side navigation
	const isNextInternal =
		currentRequest.headers.has("x-middleware-preflight") ||
		currentRequest.headers.has("x-nextjs-data") ||
		currentRequest.headers.has("rsc") ||
		currentRequest.headers.has("next-router-state-tree") ||
		currentRequest.headers.has("next-router-prefetch") ||
		currentRequest.headers.has("x-middleware-prefetch") ||
		currentRequest.headers.get("sec-fetch-site") === "same-origin";

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
		const headers = new Headers(currentRequest.headers);
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
		return intlMiddleware(currentRequest);
	}

	// For external client requests, perform defensive header scrubbing (CVE-2025-29927 Mitigation)
	const headers = new Headers(currentRequest.headers);
	for (const name of Array.from(headers.keys())) {
		if (name.toLowerCase().startsWith("x-")) {
			headers.delete(name);
		}
	}

	const scrubbedRequest = new NextRequest(currentRequest, { headers });
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
