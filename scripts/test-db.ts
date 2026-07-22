/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
	const { data, error } = await supabase.from("services").select("*");
	console.log("Services in DB:", data?.length, error);
	if (data && data.length > 0) {
		console.log("Sample service:", data[0]);
	}
}

main().catch(console.error);
