import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockHeaders, mockSubmitContact, mockSignInWithPassword, mockSignOut, mockIsAdminUser } =
	vi.hoisted(() => ({
		mockHeaders: vi.fn<() => Promise<Headers>>(),
		mockSubmitContact: vi.fn(),
		mockSignInWithPassword: vi.fn(),
		mockSignOut: vi.fn(),
		mockIsAdminUser: vi.fn(),
	}));

vi.mock("next/headers", () => ({
	headers: mockHeaders,
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

vi.mock("@/actions/contact", () => ({
	submitContact: mockSubmitContact,
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(async () => ({
		auth: {
			signInWithPassword: mockSignInWithPassword,
			signOut: mockSignOut,
		},
	})),
}));

vi.mock("@/features/admin/utils/auth", () => ({
	isAdminUser: mockIsAdminUser,
}));

import { POST as contactPost } from "@/app/api/contact/route";
import { loginAdmin } from "@/features/admin/actions/auth";

describe("Trusted Client IP Resolution in Contact Route & Admin Login Action", () => {
	beforeEach(() => {
		vi.stubEnv("VERCEL", "1");
		mockSubmitContact.mockResolvedValue({ success: true });
		mockSignInWithPassword.mockResolvedValue({
			data: { user: null },
			error: { message: "Invalid credentials" },
		});
		mockSignOut.mockResolvedValue({ error: null });
		mockIsAdminUser.mockResolvedValue(false);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.clearAllMocks();
	});

	it("blocks spoofed rotating x-forwarded-for on POST /api/contact using verified x-vercel-forwarded-for", async () => {
		const validPayload = JSON.stringify({
			name: "Max Mustermann",
			email: "max@example.com",
			phone: "+49 170 1234567",
			message: "Detailing inquiry for my vehicle.",
		});

		for (let attempt = 1; attempt <= 3; attempt++) {
			const request = new Request("http://localhost:3000/api/contact", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-forwarded-for": `203.0.113.${attempt}`,
					"x-vercel-forwarded-for": "198.51.100.70",
				},
				body: validPayload,
			});

			const response = await contactPost(request);
			expect(response.status).toBe(200);
		}

		const blockedRequest = new Request("http://localhost:3000/api/contact", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-forwarded-for": "203.0.113.250",
				"x-vercel-forwarded-for": "198.51.100.70",
			},
			body: validPayload,
		});

		const blockedResponse = await contactPost(blockedRequest);
		expect(blockedResponse.status).toBe(429);
		expect(blockedResponse.headers.get("Retry-After")).toBeTruthy();
		expect(mockSubmitContact).toHaveBeenCalledTimes(3);

		// A different verified client remains in its own isolated bucket even with the same spoofed x-forwarded-for
		const otherClientRequest = new Request("http://localhost:3000/api/contact", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-forwarded-for": "203.0.113.250",
				"x-vercel-forwarded-for": "198.51.100.72",
			},
			body: validPayload,
		});

		const otherClientResponse = await contactPost(otherClientRequest);
		expect(otherClientResponse.status).toBe(200);
		expect(mockSubmitContact).toHaveBeenCalledTimes(4);
	});

	it("blocks brute-force rotating x-forwarded-for on loginAdmin Server Action using verified ingress IP", async () => {
		for (let attempt = 1; attempt <= 5; attempt++) {
			mockHeaders.mockResolvedValueOnce(
				new Headers({
					"x-forwarded-for": `203.0.113.${10 + attempt}`,
					"x-vercel-forwarded-for": "198.51.100.71",
				}),
			);

			const result = await loginAdmin({
				email: "admin@example.com",
				password: "wrongpassword123",
			});
			expect(result).toEqual({ success: false, error: "invalid_credentials" });
		}

		mockHeaders.mockResolvedValueOnce(
			new Headers({
				"x-forwarded-for": "203.0.113.200",
				"x-vercel-forwarded-for": "198.51.100.71",
			}),
		);

		const blockedResult = await loginAdmin({
			email: "admin@example.com",
			password: "wrongpassword123",
		});
		expect(blockedResult).toEqual({ success: false, error: "too_many_attempts" });
		expect(mockSignInWithPassword).toHaveBeenCalledTimes(5);

		// A different verified client reaches authentication unaffected by the throttled client's bucket
		mockHeaders.mockResolvedValueOnce(
			new Headers({
				"x-forwarded-for": "203.0.113.200",
				"x-vercel-forwarded-for": "198.51.100.73",
			}),
		);

		const otherClientResult = await loginAdmin({
			email: "admin@example.com",
			password: "wrongpassword123",
		});
		expect(otherClientResult).toEqual({ success: false, error: "invalid_credentials" });
		expect(mockSignInWithPassword).toHaveBeenCalledTimes(6);
	});
});
