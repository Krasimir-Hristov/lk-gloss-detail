"use server";

import { z } from "zod";

import { redirect } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	locale: z.string(),
});

export type LoginResult =
	| { success: true }
	| { success: false; error: "INVALID_CREDENTIALS" | "NOT_ADMIN" | "INTERNAL_ERROR" };

export const login = async (data: unknown): Promise<LoginResult> => {
	try {
		const parsed = LoginSchema.safeParse(data);
		if (!parsed.success) {
			return { success: false, error: "INVALID_CREDENTIALS" };
		}

		const { email, password } = parsed.data;
		const supabase = await createClient();

		const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (authError || !authData.user) {
			console.error("[auth/login] Sign-in error:", authError?.message);
			return { success: false, error: "INVALID_CREDENTIALS" };
		}

		// Verify the user has admin role in profiles table
		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("role")
			.eq("id", authData.user.id)
			.single();

		if (profileError || !profile || profile.role !== "admin") {
			console.warn("[auth/login] Access denied: User is not an admin", authData.user.id);
			// Sign out the user immediately if they are not an admin
			await supabase.auth.signOut();
			return { success: false, error: "NOT_ADMIN" };
		}

		return { success: true };
	} catch (err) {
		console.error("[auth/login] Unexpected error:", err);
		return { success: false, error: "INTERNAL_ERROR" };
	}
};

export const logout = async (locale: string): Promise<void> => {
	try {
		const supabase = await createClient();
		await supabase.auth.signOut();
	} catch (err) {
		console.error("[auth/logout] Unexpected error during logout:", err);
	}
	redirect({ href: "/admin/login", locale });
};
