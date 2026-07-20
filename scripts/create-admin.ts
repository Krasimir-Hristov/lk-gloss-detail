/* eslint-disable no-console */
/**
 * Admin Creation Script
 * Creates a new admin user in Supabase Auth and elevates their role to 'admin'.
 *
 * Usage:
 *   pnpm tsx scripts/create-admin.ts <email> <password>
 */

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

// Load Next.js environment variables (resolves .env, .env.local, .env.development etc.)
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // service_role key is required to manage users and bypass RLS

if (!supabaseUrl || !supabaseKey) {
	console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in environment");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

const main = async () => {
	const args = process.argv.slice(2);
	const email = args[0] || process.env.ADMIN_EMAIL;
	const password = args[1] || process.env.ADMIN_PASSWORD;

	if (!email || !password) {
		console.error("❌ Usage: pnpm tsx scripts/create-admin.ts <email> <password>");
		console.error("   Or set ADMIN_EMAIL and ADMIN_PASSWORD in your environment variables.");
		process.exit(1);
	}

	console.log(`🚀 Creating auth user with email: ${email}...`);

	const { data, error } = await supabase.auth.admin.createUser({
		email,
		password,
		email_confirm: true, // auto-confirm email
	});

	if (error) {
		console.error("❌ Failed to create auth user:", error.message);
		process.exit(1);
	}

	console.log(`✅ Auth user created successfully (ID: ${data.user.id}).`);
	console.log("👑 Elevating profile role to 'admin'...");

	// The RLS database trigger automatically inserts the profiles row, but defaults to 'user'.
	// Here, we explicitly update it to 'admin' using the service-role client.
	const { error: profileError } = await supabase
		.from("profiles")
		.update({ role: "admin" })
		.eq("id", data.user.id);

	if (profileError) {
		console.error("❌ Failed to elevate profile to admin role:", profileError.message);
		// Try to insert just in case trigger hasn't completed or conflict occurred
		const { error: insertError } = await supabase
			.from("profiles")
			.upsert({ id: data.user.id, role: "admin" });

		if (insertError) {
			console.error("❌ Failed to upsert admin profile:", insertError.message);
			process.exit(1);
		}
	}

	console.log("🎉 Admin user created and elevated to admin role successfully!");
};

main().catch((err) => {
	console.error("❌ Uncaught error:", err);
	process.exit(1);
});
