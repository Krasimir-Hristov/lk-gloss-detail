/* eslint-disable no-console */
/**
 * Admin Creation Script
 * Creates a new admin user in Supabase Auth.
 *
 * Usage:
 *   pnpm tsx scripts/create-admin.ts <email> <password>
 */

import fs from "fs";
import path from "path";

import { createClient } from "@supabase/supabase-js";

// ── Load Environment Variables ──────────────────────────────────────────────
const loadEnv = () => {
	try {
		const envPath = path.resolve(process.cwd(), ".env");
		if (fs.existsSync(envPath)) {
			const envContent = fs.readFileSync(envPath, "utf-8");
			envContent.split("\n").forEach((line) => {
				const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
				if (match) {
					const key = match[1];
					let value = match[2] || "";
					if (value.startsWith('"') && value.endsWith('"')) {
						value = value.substring(1, value.length - 1);
					} else if (value.startsWith("'") && value.endsWith("'")) {
						value = value.substring(1, value.length - 1);
					}
					if (!process.env[key]) {
						process.env[key] = value.trim();
					}
				}
			});
		}
	} catch (err) {
		console.warn("⚠️ Failed to parse .env file manually:", err);
	}
};

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // service_role key is required to create users bypass confirm

if (!supabaseUrl || !supabaseKey) {
	console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env");
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
		console.error("   Or set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file.");
		process.exit(1);
	}

	console.log(`🚀 Creating admin user with email: ${email}...`);

	const { data, error } = await supabase.auth.admin.createUser({
		email,
		password,
		email_confirm: true, // auto-confirm email
	});

	if (error) {
		console.error("❌ Failed to create admin user:", error.message);
		process.exit(1);
	}

	console.log("✅ Admin user created successfully!");
	console.log(`👤 User ID: ${data.user.id}`);
	console.log("ℹ️ The RLS database trigger will automatically create their profile row.");
};

main().catch((err) => {
	console.error("❌ Uncaught error:", err);
	process.exit(1);
});
