import { NextResponse } from "next/server";

import { submitContact } from "@/actions/contact";
import { ContactFormSchema } from "@/features/contact/schemas/contact.schema";
import { rateLimit } from "@/lib/rate-limit";

const CONTACT_RATE_LIMIT = {
	interval: 300_000, // 5 minutes
	maxRequests: 3, // 3 requests
};

export async function POST(request: Request): Promise<NextResponse> {
	try {
		// ── Rate Limiting ──
		const ip = request.headers.get("x-forwarded-for") ?? "unknown";
		const rateLimitResult = rateLimit(`contact:${ip}`, CONTACT_RATE_LIMIT);

		if (!rateLimitResult.success) {
			const retryAfter = Math.ceil(rateLimitResult.resetIn / 1000);
			return NextResponse.json(
				{ success: false, error: "TOO_MANY_REQUESTS" },
				{
					status: 429,
					headers: { "Retry-After": String(retryAfter) },
				},
			);
		}

		const body = (await request.json()) as unknown;
		const parsed = ContactFormSchema.safeParse(body);

		if (!parsed.success) {
			console.error(
				"[api/contact] Validation error:",
				parsed.error.issues.map(({ code, path }) => ({ code, path })),
			);
			return NextResponse.json({ success: false, error: "INVALID_DATA" }, { status: 400 });
		}

		const result = await submitContact(parsed.data);

		if (result.success) {
			return NextResponse.json({ success: true });
		} else {
			return NextResponse.json({ success: false, error: result.error }, { status: 500 });
		}
	} catch (err: unknown) {
		const errMsg = err instanceof Error ? err.message : "Unknown error";
		console.error("[api/contact] Unexpected API error:", errMsg);
		return NextResponse.json({ success: false, error: "INTERNAL_ERROR" }, { status: 500 });
	}
}
