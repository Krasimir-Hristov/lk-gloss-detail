import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { isAdminUser } from "@/features/admin/utils/auth";
import { rateLimit, ASSESSMENT_RATE_LIMIT } from "@/lib/rate-limit";

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
	const ip = currentRequest.headers.get("x-forwarded-for") ?? "unknown";

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

		// Let API routes pass through to their handlers with scrubbed headers
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
		// Match all non-static routes for i18n
		"/((?!api|trpc|_next|_vercel|.*\\..*).*)",
	],
};
