import { createClient } from "@supabase/supabase-js";

let serviceClient: ReturnType<typeof createClient> | null = null;

export const createServiceClient = () => {
	if (serviceClient) return serviceClient;

	const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
	if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
		throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
	}
	if (!serviceRoleKey) {
		throw new Error("SUPABASE_SECRET_KEY (service role) is required.");
	}

	serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	return serviceClient;
};
