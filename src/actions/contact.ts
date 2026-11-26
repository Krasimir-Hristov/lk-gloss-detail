"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { ContactFormSchema } from "@/features/contact/schemas/contactSchema";
import { routing } from "@/i18n/routing";
import { resolveClientIp } from "@/lib/http/resolveClientIp";
import { rateLimit } from "@/lib/rateLimit";
import { createServiceClient } from "@/lib/supabase/service";

import type { ContactFormData } from "@/features/contact/schemas/contactSchema";

const CONTACT_ACTION_RATE_LIMIT = {
	interval: 300_000, // 5 minutes
	maxRequests: 3,
} as const;

type ContactResult =
	| { success: true }
	| { success: false; error: "INVALID_DATA" | "TOO_MANY_REQUESTS" | "INTERNAL_ERROR" };

const revalidateAdminMessages = (): void => {
	for (const loc of routing.locales) {
		try {
			revalidatePath(`/${loc}/admin`);
			revalidatePath(`/${loc}/admin/messages`);
		} catch {
			// Ignore if called outside Next.js request context (e.g. unit tests)
		}
	}
};

export const submitContact = async (data: ContactFormData): Promise<ContactResult> => {
	try {
		const parsed = ContactFormSchema.safeParse(data);
		if (!parsed.success) {
			console.error(
				"[contact/submit] Validation error:",
				parsed.error.issues.map(({ code, path }) => ({ code, path })),
			);
			return { success: false, error: "INVALID_DATA" };
		}

		let ip = "unknown";
		try {
			const headerList = await headers();
			ip = resolveClientIp(headerList);
		} catch {
			// Outside Next.js request context (e.g. direct unit test invocation)
		}

		const rateLimitResult = rateLimit(`${ip}:contactAction`, CONTACT_ACTION_RATE_LIMIT);
		if (!rateLimitResult.success) {
			console.warn(`[contact/submit] Rate limit exceeded for IP: ${ip}`);
			return { success: false, error: "TOO_MANY_REQUESTS" };
		}

		const { name, email, phone, message } = parsed.data;
		const supabase = createServiceClient();

		const { error: dbError } = await (
			supabase.from("contact_submissions") as unknown as {
				insert: (data: {
					name: string;
					email: string;
					phone: string;
					message: string;
				}) => Promise<{ error: { message: string } | null }>;
			}
		).insert({
			name,
			email,
			phone,
			message,
		});

		if (dbError) {
			console.error("[contact/submit] DB insert error:", dbError.message);
			return { success: false, error: "INTERNAL_ERROR" };
		}

		revalidateAdminMessages();
		return { success: true };
	} catch (err: unknown) {
		const errMsg = err instanceof Error ? err.message : "Unknown error";
		console.error("[contact/submit] Unexpected action error:", errMsg);
		return { success: false, error: "INTERNAL_ERROR" };
	}
};
