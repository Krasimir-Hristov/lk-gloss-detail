import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export const createClient = () => {
	const { url, key } = getPublicSupabaseEnv();
	return createBrowserClient(url, key);
};
