import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { isAdminUser } from "@/features/admin/utils/auth";
import { rateLimit, ASSESSMENT_RATE_LIMIT, CHATBOT_RATE_LIMIT } from "@/lib/rateLimit";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const isProtectedRoute = (pathname: string) => {
	// Matches /admin, /admin/dashboard, /de/admin, /en/admin/dashboard, etc.
	// But NOT /admin/login, /de/admin/login, /api/..., or static assets.
	const adminPattern = /^\/(?:[a-z]{2}\/)?admin(?:\/.*)?$/;
	const loginPattern = /^\/(?:[a-z]{2}\/)?admin\/login$/;
	return adminPattern.test(pathname) && !loginPattern.test(pathname);
};

const getLocaleFromPathname = (pathname: string): (typeof routing.locales)[number] => {
	const segments = pathname.split("/");
	const potentialLocale = segments[1];
	const isLocale = (routing.locales as readonly string[]).includes(potentialLocale);
	return isLocale ? (potentialLocale as (typeof routing.locales)[number]) : routing.defaultLocale;
};

/**
 * Resolves the client IP solely from verified ingress headers or a configured trusted-proxy hop
 * count (counting from the right of x-forwarded-for). Never trusts the client-spoofable leftmost IP.
 */
const resolveClientIp = (headers: Headers): string => {
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

export default async function proxy(request: NextRequest) {
	// ── Prevent security bypass (CVE-2025-29927 Mitigation) ──────────────────
	// Strip only x-middleware-subrequest from external client requests to preserve
	// other x-* headers like x-forwarded-for for rate limiting.
	const safeHeaders = new Headers(request.headers);
	if (request.headers.has("x-middleware-subrequest")) {
		safeHeaders.delete("x-middleware-subrequest");
	}

	const { pathname } = request.nextUrl;
	safeHeaders.set("x-pathname", pathname);

	const currentRequest = new NextRequest(request, { headers: safeHeaders });
	const ip = resolveClientIp(currentRequest.headers);

	// ── Admin Route Protection ────────────────────────────────────────
	if (isProtectedRoute(pathname)) {
		let supabaseResponse = NextResponse.next({
			request: currentRequest,
		});

		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
			{
				cookies: {
					getAll() {
						return currentRequest.cookies.getAll();
					},
					setAll(cookiesToSet) {
						cookiesToSet.forEach(({ name, value }) => currentRequest.cookies.set(name, value));
						supabaseResponse = NextResponse.next({
							request: currentRequest,
						});
						cookiesToSet.forEach(({ name, value, options }) =>
							supabaseResponse.cookies.set(name, value, options),
						);
					},
				},
			},
		);

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			const isAdmin = user ? await isAdminUser(supabase, user.id) : false;

			if (!user || !isAdmin) {
				const locale = getLocaleFromPathname(pathname);
				const redirectUrl = currentRequest.nextUrl.clone();
				redirectUrl.pathname = `/${locale}/admin/login`;
				return NextResponse.redirect(redirectUrl);
			}

			// Pass through to next-intl, but merge cookies/headers from supabaseResponse
			const intlResponse = intlMiddleware(currentRequest);
			supabaseResponse.cookies.getAll().forEach((cookie) => {
				intlResponse.cookies.set(cookie.name, cookie.value, {
					path: cookie.path,
					domain: cookie.domain,
					secure: cookie.secure,
					sameSite: cookie.sameSite,
					expires: cookie.expires,
					httpOnly: cookie.httpOnly,
					maxAge: cookie.maxAge,
				});
			});
			intlResponse.headers.set("x-pathname", pathname);
			return intlResponse;
		} catch (error) {
			console.error("[proxy/admin-auth] Error validating admin session:", error);
			const locale = getLocaleFromPathname(pathname);
			const redirectUrl = currentRequest.nextUrl.clone();
			redirectUrl.pathname = `/${locale}/admin/login`;
			return NextResponse.redirect(redirectUrl);
		}
	}

	// ── Rate limit assessment API routes ──────────────────────────────
	if (pathname.startsWith("/api/assessment/")) {
		const normalizedPath = pathname.replace(/\/+$/, "");
		const bucket =
			normalizedPath === "/api/assessment/validate-photo"
				? "validatePhoto"
				: normalizedPath === "/api/assessment/analyze"
					? "analyze"
					: null;

		if (bucket !== null) {
			const key = `${ip}:assessment:${bucket}`;
			const result = rateLimit(key, ASSESSMENT_RATE_LIMIT[bucket]);

			if (!result.success) {
				const retryAfter = Math.ceil(result.resetIn / 1000);
				return NextResponse.json(
					{ error: "Too many requests", code: "RATE_LIMITED", retryAfter },
					{
						status: 429,
						headers: { "Retry-After": String(retryAfter) },
					},
				);
			}
		}

		// Let known API routes (or 404s for unknown subpaths) pass through with scrubbed headers
		return NextResponse.next({
			request: {
				headers: currentRequest.headers,
			},
		});
	}

	// ── Rate limit chatbot API routes ─────────────────────────────────
	if (pathname.startsWith("/api/chatbot/")) {
		const normalizedPath = pathname.replace(/\/+$/, "");
		if (normalizedPath === "/api/chatbot/message") {
			const key = `${ip}:chatbot:message`;
			const result = rateLimit(key, CHATBOT_RATE_LIMIT.message);

			if (!result.success) {
				const retryAfter = Math.ceil(result.resetIn / 1000);
				return NextResponse.json(
					{ error: "Too many requests. Please slow down.", code: "RATE_LIMITED", retryAfter },
					{
						status: 429,
						headers: { "Retry-After": String(retryAfter) },
					},
				);
			}
		}

		return NextResponse.next({
			request: {
				headers: currentRequest.headers,
			},
		});
	}

	// ── Delegate to next-intl for all other routes ────────────────────
	const response = intlMiddleware(currentRequest);
	response.headers.set("x-pathname", pathname);
	return response;
}

export const config = {
	matcher: [
		// Match assessment API routes for rate limiting
		"/api/assessment/:path*",
		// Match chatbot API routes for rate limiting
		"/api/chatbot/:path*",
		// Match all non-static routes for i18n
		"/((?!api|trpc|_next|_vercel|.*\\..*).*)",
	],
};
