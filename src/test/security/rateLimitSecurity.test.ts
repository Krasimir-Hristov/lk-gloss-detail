import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ASSESSMENT_RATE_LIMIT, createRateLimiter } from "@/lib/rateLimit";
import proxy from "@/proxy";

const { mockIntlMiddleware } = vi.hoisted(() => ({
	mockIntlMiddleware: vi.fn((_request: NextRequest) => NextResponse.next()),
}));

vi.mock("next-intl/middleware", () => ({
	default: vi.fn(() => mockIntlMiddleware),
}));

vi.mock("@/i18n/routing", () => ({
	routing: {
		locales: ["de", "en", "el", "sq", "tr"],
		defaultLocale: "de",
		localePrefix: "always",
		localeDetection: false,
	},
}));

vi.mock("@supabase/ssr", () => ({
	createServerClient: vi.fn(() => ({
		auth: {
			getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
		},
	})),
}));

vi.mock("@/features/admin/utils/auth", () => ({
	isAdminUser: vi.fn(async () => false),
}));

const parseJsonObject = async (response: Response): Promise<Record<string, unknown>> => {
	const parsed: unknown = await response.json();
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error("Expected JSON object response");
	}
	return parsed as Record<string, unknown>;
};

describe("Rate Limiter Capacity & Proxy Trusted IP Derivation", () => {
	beforeEach(() => {
		mockIntlMiddleware.mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
	});

	describe("createRateLimiter eviction protection", () => {
		it("does not evict live counters when full and rejects new keys fail-closed", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-11-22T12:00:00Z"));

			const limiter = createRateLimiter({ maxEntries: 2, cleanupIntervalMs: 60_000 });
			const opts = { interval: 60_000, maxRequests: 2 };

			expect(limiter("ip-a", opts)).toEqual({ success: true, remaining: 1 });
			expect(limiter("ip-b", opts)).toEqual({ success: true, remaining: 1 });

			// Capacity is exhausted by active counters -> new key must fail closed
			const newKeyResult = limiter("ip-c", opts);
			expect(newKeyResult.success).toBe(false);

			// Existing live counters must remain intact and reach block on 3rd attempt
			expect(limiter("ip-a", opts)).toEqual({ success: true, remaining: 0 });
			expect(limiter("ip-a", opts).success).toBe(false);
			expect(limiter("ip-b", opts)).toEqual({ success: true, remaining: 0 });
			expect(limiter("ip-b", opts).success).toBe(false);
		});

		it("sweeps expired entries first and allows new keys once windows expire", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-11-22T12:00:00Z"));

			const limiter = createRateLimiter({ maxEntries: 2, cleanupIntervalMs: 60_000 });
			const opts = { interval: 1_000, maxRequests: 1 };

			expect(limiter("ip-1", opts).success).toBe(true);
			expect(limiter("ip-2", opts).success).toBe(true);
			expect(limiter("ip-3", opts).success).toBe(false);

			vi.advanceTimersByTime(1_500);
			expect(limiter("ip-3", opts)).toEqual({ success: true, remaining: 0 });
		});
	});

	describe("src/proxy.ts trusted IP resolution", () => {
		it("uses verified x-vercel-forwarded-for on Vercel even if leftmost x-forwarded-for rotates", async () => {
			vi.stubEnv("VERCEL", "1");
			const maxRequests = ASSESSMENT_RATE_LIMIT.validatePhoto.maxRequests;

			for (let attempt = 1; attempt <= maxRequests; attempt++) {
				const request = new NextRequest("http://localhost:3000/api/assessment/validate-photo", {
					method: "POST",
					headers: {
						"x-forwarded-for": `203.0.113.${attempt}, 198.51.100.10`,
						"x-vercel-forwarded-for": "198.51.100.10",
					},
				});

				const response = await proxy(request);
				expect(response.status).toBe(200);
			}

			const blockedRequest = new NextRequest(
				"http://localhost:3000/api/assessment/validate-photo",
				{
					method: "POST",
					headers: {
						"x-forwarded-for": "203.0.113.250, 198.51.100.10",
						"x-vercel-forwarded-for": "198.51.100.10",
					},
				},
			);

			const blockedResponse = await proxy(blockedRequest);
			expect(blockedResponse.status).toBe(429);

			const body = await parseJsonObject(blockedResponse);
			expect(body.code).toBe("RATE_LIMITED");
			expect(blockedResponse.headers.get("Retry-After")).toBeTruthy();

			// Distinct verified Vercel client IP gets its own fresh bucket
			const otherUserRequest = new NextRequest(
				"http://localhost:3000/api/assessment/validate-photo",
				{
					method: "POST",
					headers: {
						"x-vercel-forwarded-for": "198.51.100.11",
					},
				},
			);
			const otherUserResponse = await proxy(otherUserRequest);
			expect(otherUserResponse.status).toBe(200);
		});

		it("resolves client IP from the right using TRUSTED_PROXY_COUNT and ignores spoofed leftmost entries", async () => {
			vi.stubEnv("VERCEL", "");
			vi.stubEnv("TRUSTED_PROXY_COUNT", "2");
			const maxRequests = ASSESSMENT_RATE_LIMIT.validatePhoto.maxRequests;

			for (let attempt = 1; attempt <= maxRequests; attempt++) {
				const request = new NextRequest("http://localhost:3000/api/assessment/validate-photo", {
					method: "POST",
					headers: {
						"x-forwarded-for": `203.0.113.${attempt}, 198.51.100.20, 10.0.0.1`,
					},
				});

				const response = await proxy(request);
				expect(response.status).toBe(200);
			}

			const blockedRequest = new NextRequest(
				"http://localhost:3000/api/assessment/validate-photo",
				{
					method: "POST",
					headers: {
						"x-forwarded-for": "203.0.113.251, 198.51.100.20, 10.0.0.99",
					},
				},
			);

			const blockedResponse = await proxy(blockedRequest);
			expect(blockedResponse.status).toBe(429);
		});

		it("falls back fail-closed to 'unknown' when no trusted proxy environment is configured", async () => {
			vi.stubEnv("VERCEL", "");
			vi.stubEnv("TRUSTED_PROXY_COUNT", "");
			const maxRequests = ASSESSMENT_RATE_LIMIT.validatePhoto.maxRequests;

			for (let attempt = 1; attempt <= maxRequests; attempt++) {
				const request = new NextRequest("http://localhost:3000/api/assessment/validate-photo", {
					method: "POST",
					headers: {
						"x-forwarded-for": `203.0.113.${attempt}`,
					},
				});

				const response = await proxy(request);
				expect(response.status).toBe(200);
			}

			const blockedRequest = new NextRequest(
				"http://localhost:3000/api/assessment/validate-photo",
				{
					method: "POST",
					headers: {
						"x-forwarded-for": "203.0.113.252",
					},
				},
			);
			const blockedResponse = await proxy(blockedRequest);
			expect(blockedResponse.status).toBe(429);
		});

		it("ignores unknown subpaths without consuming rate-limit capacity for valid routes or other IPs", async () => {
			vi.stubEnv("VERCEL", "1");

			for (let probe = 1; probe <= 25; probe++) {
				const probeRequest = new NextRequest(
					`http://localhost:3000/api/assessment/nonexistent-probe-${probe}`,
					{
						method: "POST",
						headers: { "x-vercel-forwarded-for": "198.51.100.40" },
					},
				);
				const probeRes = await proxy(probeRequest);
				expect(probeRes.status).toBe(200);
			}

			// Second legitimate IP retains its full validation quota unaffected by probes
			const legitimateReq = new NextRequest("http://localhost:3000/api/assessment/validate-photo", {
				method: "POST",
				headers: { "x-vercel-forwarded-for": "198.51.100.41" },
			});
			const legitimateRes = await proxy(legitimateReq);
			expect(legitimateRes.status).toBe(200);

			// Probing IP still gets its exact fixed validatePhoto limit (neither boosted nor exhausted)
			for (let attempt = 1; attempt <= ASSESSMENT_RATE_LIMIT.validatePhoto.maxRequests; attempt++) {
				const res = await proxy(
					new NextRequest("http://localhost:3000/api/assessment/validate-photo", {
						method: "POST",
						headers: { "x-vercel-forwarded-for": "198.51.100.40" },
					}),
				);
				expect(res.status).toBe(200);
			}
			const blockedRes = await proxy(
				new NextRequest("http://localhost:3000/api/assessment/validate-photo", {
					method: "POST",
					headers: { "x-vercel-forwarded-for": "198.51.100.40" },
				}),
			);
			expect(blockedRes.status).toBe(429);
		});
	});
});
