/* eslint-disable no-console */
/**
 * ⚠️ HISTORICAL HOTFIX — DO NOT USE FOR NORMAL MIGRATIONS
 *
 * This script was run once to recreate the match_chatbot_docs function
 * with the extensions search_path after the initial migration. The
 * canonical definition now lives in:
 *   supabase/migrations/20240714000001_create_chatbot_knowledge.sql
 *
 * Keep this file for audit trail only. Delete once confident the
 * migration has been applied everywhere.
 *
 * Original usage (one-time only):
 *   pnpm tsx -r dotenv/config scripts/fix-match-function.ts
 */

const main = async () => {
	console.log(
		"⚠️  This script is a historical hotfix and should NOT be re-run.\n" +
			"    The match_chatbot_docs function is now created by the migration:\n" +
			"    supabase/migrations/20240714000001_create_chatbot_knowledge.sql\n\n" +
			"    If you absolutely need to re-apply it, run the migration SQL directly\n" +
			"    in the Supabase SQL Editor.",
	);
	process.exit(0);
};

main().catch(console.error);
