import { z } from "zod";

const PublicSupabaseEnvSchema = z.object({
	url: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
	key: z.string().min(1, "Public Supabase key (PUBLISHABLE or ANON) is required"),
});

const ServiceSupabaseEnvSchema = z.object({
	url: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
	key: z.string().min(1, "Privileged Supabase secret key (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY) is required"),
});

export const getPublicSupabaseEnv = () => {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key =
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	return PublicSupabaseEnvSchema.parse({ url, key });
};

export const getServiceSupabaseEnv = () => {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key =
		process.env.SUPABASE_SECRET_KEY ||
		process.env.SUPABASE_SERVICE_ROLE_KEY;

	return ServiceSupabaseEnvSchema.parse({ url, key });
};
