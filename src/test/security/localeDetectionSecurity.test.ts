import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import proxy from "@/proxy";

// Uses the REAL `@/i18n/routing` + REAL next-intl middleware so that
// `localeDetection: false` is verified end-to-end through src/proxy.ts.
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

const getRedirectPathname = (response: Response): string => {
	const location = response.headers.get("location");
	if (location === null) {
		throw new Error(`Expected redirect, got status ${response.status}`);
	}
	return new URL(location, "http://localhost:3000").pathname;
};

describe("src/proxy.ts locale detection is disabled (German default)", () => {
	beforeEach(() => {
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it.each(["en-US,en;q=0.9", "tr-TR,tr;q=0.9", "sq-AL,sq;q=0.9", "el-GR"])(
		"redirects / with Accept-Language %s strictly to /de",
		async (acceptLanguage) => {
			const response = await proxy(
				new NextRequest("http://localhost:3000/", {
					headers: { "accept-language": acceptLanguage },
				}),
			);
			expect(response.status).toBeGreaterThanOrEqual(300);
			expect(response.status).toBeLessThan(400);
			expect(getRedirectPathname(response)).toBe("/de");
		},
	);

	it("ignores a spoofed NEXT_LOCALE cookie on / and still redirects to /de", async () => {
		const response = await proxy(
			new NextRequest("http://localhost:3000/", {
				headers: { "accept-language": "tr-TR", cookie: "NEXT_LOCALE=tr" },
			}),
		);
		expect(getRedirectPathname(response)).toBe("/de");
	});

	it.each([
		["/sq/admin", "/sq/admin/login"],
		["/tr/admin/messages", "/tr/admin/login"],
	])("guards %s with real routing and redirects to %s", async (path, target) => {
		const response = await proxy(new NextRequest(`http://localhost:3000${path}`));
		expect(getRedirectPathname(response)).toBe(target);
	});
});
