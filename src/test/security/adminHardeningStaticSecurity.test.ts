import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT_DIR = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", "__tests__", "test"]);

const walkCodeFiles = (dir: string, collected: string[] = []): string[] => {
	if (!fs.existsSync(dir)) return collected;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (SKIP_DIRS.has(entry.name)) continue;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkCodeFiles(fullPath, collected);
		} else if (
			/\.(ts|tsx|js|mjs)$/.test(entry.name) &&
			!/\.(test|spec)\.(ts|tsx|js|mjs)$/.test(entry.name)
		) {
			collected.push(fullPath);
		}
	}
	return collected;
};

describe("Phase C Hard Single-Admin, Resend Removal & Migration Hardening Static Checks", () => {
	it("confirms legacy route, resend client, create-admin script, and AiKnowledgeWizard are deleted", () => {
		const removedPaths = [
			"src/app/api/booking/create/route.ts",
			"src/lib/resend.ts",
			"scripts/create-admin.ts",
			"src/features/admin/components/knowledge/AiKnowledgeWizard.tsx",
		];
		for (const relPath of removedPaths) {
			expect(fs.existsSync(path.join(ROOT_DIR, relPath))).toBe(false);
		}
	});

	it("confirms zero occurrences of signUp, auth.admin.createUser, or resend imports in src/ and scripts/", () => {
		const files = [
			...walkCodeFiles(path.join(ROOT_DIR, "src")),
			...walkCodeFiles(path.join(ROOT_DIR, "scripts")),
		];
		const forbiddenPatterns = [
			/auth\.admin\.createUser/,
			/\bsignUp\b/,
			/from\s+["'](?:resend|@\/lib\/resend)["']/,
			/import\s*\(\s*["'](?:resend|@\/lib\/resend)["']\s*\)/,
		];

		const violations: string[] = [];
		for (const filePath of files) {
			const content = fs.readFileSync(filePath, "utf8");
			for (const pattern of forbiddenPatterns) {
				if (pattern.test(content)) {
					violations.push(`${path.relative(ROOT_DIR, filePath)} matched ${pattern}`);
				}
			}
		}
		expect(violations).toEqual([]);
	});

	it("verifies Phase C SQL migration hardening, single-admin lock, messages RLS, and atomic booking RPCs", () => {
		const sql = fs.readFileSync(
			path.join(
				ROOT_DIR,
				"supabase/migrations/20261125000001_admin_hardening_messages_booking_fix.sql",
			),
			"utf8",
		);

		expect(sql).toMatch(/VALUES\s*\(\s*new\.id\s*,\s*'user'\s*\)/i);
		expect(sql).toMatch(/SET\s+search_path\s*=\s*''/i);
		expect(sql).toMatch(/CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_profiles_single_admin/i);
		expect(sql).toMatch(/WHERE\s+role\s*=\s*'admin'/i);
		expect(sql).not.toMatch(
			/CREATE\s+POLICY[^;]*\bON\s+(?:public\.)?profiles\b[^;]*\bFOR\s+(?:INSERT|UPDATE|DELETE|ALL)\b/i,
		);
		expect(sql).toMatch(/ON\s+public\.contact_submissions\s+FOR\s+UPDATE/i);
		expect(sql).toMatch(/ON\s+public\.contact_submissions\s+FOR\s+DELETE/i);
		expect(sql).toMatch(/DROP\s+CONSTRAINT\s+IF\s+EXISTS\s+appointments_booking_date_key/i);
		expect(sql).toMatch(
			/CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_appointments_active_booking_date/i,
		);
		expect(sql).toMatch(/WHERE\s+status\s*<>\s*'cancelled'/i);
		expect(sql).toMatch(
			/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.update_appointment_with_services/i,
		);

		const createBookingMatch = sql.match(
			/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.create_booking[\s\S]*?\$\$\s*;/i,
		);
		expect(createBookingMatch).not.toBeNull();
		expect(createBookingMatch?.[0] ?? "").not.toMatch(
			/INSERT\s+INTO\s+(?:public\.)?blocked_dates/i,
		);
	});

	it("verifies verifyArchitecture.mjs has zero admin paths in legacy allowlists", () => {
		const archScript = fs.readFileSync(
			path.join(ROOT_DIR, "scripts/verifyArchitecture.mjs"),
			"utf8",
		);
		const lineAllowlistMatch = archScript.match(
			/const LEGACY_LINE_LIMIT_ALLOWLIST\s*=\s*new Set\(([\s\S]*?)\);/,
		);
		const arrowAllowlistMatch = archScript.match(
			/const LEGACY_ARROW_COMPONENT_ALLOWLIST\s*=\s*new Set\(([\s\S]*?)\);/,
		);

		expect(lineAllowlistMatch).not.toBeNull();
		expect(arrowAllowlistMatch).not.toBeNull();
		expect(lineAllowlistMatch?.[1] ?? "").not.toMatch(/admin/i);
		expect(arrowAllowlistMatch?.[1] ?? "").not.toMatch(/admin/i);
	});
});
