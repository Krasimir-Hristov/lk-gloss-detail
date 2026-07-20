import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Checks if a given user has the 'admin' role in the profiles table.
 */
export const isAdminUser = async (supabase: SupabaseClient, userId: string): Promise<boolean> => {
	try {
		const { data, error } = await supabase
			.from("profiles")
			.select("role")
			.eq("id", userId)
			.single();

		if (error || !data) {
			return false;
		}

		return data.role === "admin";
	} catch (err) {
		console.error("[auth-util/isAdminUser] Uncaught error checking admin role:", err);
		return false;
	}
};
