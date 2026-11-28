import { NextResponse } from "next/server";

import { submitContact } from "@/actions/contact";
import { ContactFormSchema } from "@/features/contact/schemas/contactSchema";
import {
	InvalidJsonError,
	PayloadTooLargeError,
	readBoundedJson,
} from "@/lib/http/readBoundedJson";
import { resolveClientIp } from "@/lib/http/resolveClientIp";
import { rateLimit } from "@/lib/rateLimit";

const CONTACT_RATE_LIMIT = {
	interval: 300_000, // 5 minutes
	maxRequests: 3, // 3 requests
};

const MAX_CONTACT_BODY_BYTES = 16 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
	try {
		// ── Rate Limiting ──
		const ip = resolveClientIp(request.headers);
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

		let body: unknown;
		try {
			body = await readBoundedJson(request, MAX_CONTACT_BODY_BYTES);
		} catch (readErr: unknown) {
			if (readErr instanceof PayloadTooLargeError) {
				return NextResponse.json({ success: false, error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
			}
			if (readErr instanceof InvalidJsonError) {
				return NextResponse.json({ success: false, error: "INVALID_DATA" }, { status: 400 });
			}
			throw readErr;
		}

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
		}

		const status =
			result.error === "TOO_MANY_REQUESTS" ? 429 : result.error === "INVALID_DATA" ? 400 : 500;
		return NextResponse.json({ success: false, error: result.error }, { status });
	} catch (err: unknown) {
		const errMsg = err instanceof Error ? err.message : "Unknown error";
		console.error("[api/contact] Unexpected API error:", errMsg);
		return NextResponse.json({ success: false, error: "INTERNAL_ERROR" }, { status: 500 });
	}
}
