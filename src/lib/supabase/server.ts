import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export const createClient = async () => {
	const cookieStore = await cookies();
	const { url, key } = getPublicSupabaseEnv();

	return createServerClient(url, key, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {
					// The `setAll` method was called from a Server Component.
				}
			},
		},
	});
};
