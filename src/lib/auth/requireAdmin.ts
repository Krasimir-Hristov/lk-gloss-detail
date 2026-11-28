import { cache } from "react";

import { isAdminUser } from "@/features/admin/utils/auth";
import { createClient } from "@/lib/supabase/server";

import type { User } from "@supabase/supabase-js";

export type AdminSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface AdminSession {
	user: User;
	supabase: AdminSupabaseClient;
}

export type RequireAdminResult =
	| { authorized: true; user: User; supabase: AdminSupabaseClient }
	| { authorized: false; error: "Unauthorized" };

/**
 * Request-scoped cached admin session for RSC layouts, pages, and Server Actions.
 * Ensures at most one Supabase Auth + profiles role check per server request.
 */
export const getCachedAdminSession = cache(async (): Promise<AdminSession | null> => {
	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return null;
		}

		const isAdmin = await isAdminUser(supabase, user.id);
		if (!isAdmin) {
			return null;
		}

		return { user, supabase };
	} catch (err: unknown) {
		console.error("[requireAdmin/getCachedAdminSession] Unexpected error:", err);
		return null;
	}
});

/**
 * Defense-in-depth authorization guard for Admin Server Actions and RSC loaders.
 */
export const requireAdmin = async (): Promise<RequireAdminResult> => {
	try {
		const session = await getCachedAdminSession();
		if (!session) {
			return { authorized: false, error: "Unauthorized" };
		}

		return {
			authorized: true,
			user: session.user,
			supabase: session.supabase,
		};
	} catch (err: unknown) {
		console.error("[requireAdmin] Unexpected error:", err);
		return { authorized: false, error: "Unauthorized" };
	}
};
