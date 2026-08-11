import { createClient } from "@supabase/supabase-js";

import { getServiceSupabaseEnv } from "@/lib/supabase/env";

let serviceClient: ReturnType<typeof createClient> | null = null;

export const createServiceClient = () => {
	if (serviceClient) return serviceClient;

	const { url, key } = getServiceSupabaseEnv();

	serviceClient = createClient(url, key, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	return serviceClient;
};
