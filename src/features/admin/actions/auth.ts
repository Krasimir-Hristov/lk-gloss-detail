"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
	LoginSchema,
	type LoginFormValues,
	type AuthResult,
} from "@/features/admin/schemas/auth.schema";
import { isAdminUser } from "@/features/admin/utils/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action to authenticate the admin.
 */
export const loginAdmin = async (data: LoginFormValues): Promise<AuthResult> => {
	try {
		const parsed = LoginSchema.safeParse(data);
		if (!parsed.success) {
			return { success: false, error: "validation_error" };
		}

		// Enforce rate limiting based on IP and route
		const headerList = await headers();
		const ip = headerList.get("x-forwarded-for") ?? "unknown";
		const rateLimitResult = rateLimit(`${ip}:loginAdmin`, {
			interval: 60000, // 1 minute
			maxRequests: 5, // max 5 requests per minute
		});

		if (!rateLimitResult.success) {
			console.warn(`[auth/login] Rate limit exceeded for IP: ${ip}`);
			return { success: false, error: "too_many_attempts" };
		}

		const { email, password } = parsed.data;
		const supabase = await createClient();

		const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (signInError || !authData.user) {
			console.error("[auth/login] SignIn failed:", signInError?.message);
			return { success: false, error: "invalid_credentials" };
		}

		// Double Check: Verify profile role is 'admin' (Defense in Depth) using the shared helper
		const isAdmin = await isAdminUser(supabase, authData.user.id);

		if (!isAdmin) {
			console.error("[auth/login] Authorization failed: Not an admin profile");
			// Sign out immediately if logged in but not an admin
			await supabase.auth.signOut();
			return { success: false, error: "not_admin" };
		}

		return { success: true };
	} catch (err) {
		console.error("[auth/login] Uncaught exception:", err);
		return { success: false, error: "server_error" };
	}
};

/**
 * Server Action to sign out.
 */
export const logoutAdmin = async (locale: string): Promise<void> => {
	let shouldRedirect = false;
	try {
		const supabase = await createClient();
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error("[auth/logout] SignOut error:", error.message);
		} else {
			shouldRedirect = true;
		}
	} catch (err) {
		console.error("[auth/logout] Uncaught exception:", err);
	}

	if (shouldRedirect) {
		redirect(`/${locale}/admin/login`);
	}
};
