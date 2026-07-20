import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { rateLimit, ASSESSMENT_RATE_LIMIT } from "@/lib/rate-limit";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
	// ── Prevent security bypass (CVE-2025-29927 Mitigation) ──────────────────
	// Strip all x- headers from incoming external client requests to prevent spoofing
	const safeHeaders = new Headers(request.headers);
	for (const [name] of request.headers.entries()) {
		if (name.toLowerCase().startsWith("x-")) {
			safeHeaders.delete(name);
		}
	}

	const { pathname } = request.nextUrl;
	safeHeaders.set("x-pathname", pathname);

	const currentRequest = new NextRequest(request, { headers: safeHeaders });
	const ip = currentRequest.headers.get("x-forwarded-for") ?? "unknown";

	// ── Protect admin routes ──────────────────────────────────────────
	const isLoginPage = /^\/(de|en|el)\/admin\/login\/?$/.test(pathname);
	const isAdminRoute = /^\/(de|en|el)\/admin(\/|$)/.test(pathname);

	if (isAdminRoute && !isLoginPage) {
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
			{
				cookies: {
					getAll() {
						return currentRequest.cookies.getAll();
					},
					setAll(cookiesToSet) {
						try {
							for (const { name, value } of cookiesToSet) {
								currentRequest.cookies.set(name, value);
							}
						} catch {
							// Ignored in Edge middleware context
						}
					},
				},
			},
		);

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				const match = pathname.match(/^\/(de|en|el)/);
				const locale = match ? match[1] : "de";
				return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
			}

			const { data: profile } = await supabase
				.from("profiles")
				.select("role")
				.eq("id", user.id)
				.single();

			if (!profile || profile.role !== "admin") {
				await supabase.auth.signOut();
				const match = pathname.match(/^\/(de|en|el)/);
				const locale = match ? match[1] : "de";
				return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
			}
		} catch (err) {
			console.error("[proxy] Auth check failed:", err);
			const match = pathname.match(/^\/(de|en|el)/);
			const locale = match ? match[1] : "de";
			return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
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
