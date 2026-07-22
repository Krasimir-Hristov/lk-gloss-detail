/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";

import { translateServiceText } from "../src/lib/ai/translation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
	console.log("Fetching services from Supabase...");
	const { data: services, error } = await supabase.from("services").select("*");

	if (error) {
		console.error("Error fetching services:", error);
		process.exit(1);
	}

	console.log(`Found ${services.length} services to check/migrate.`);

	for (const service of services) {
		console.log(`Processing service: ${service.id}...`);

		// Check if name is already an object or a string
		let nameObj: Record<string, string>;
		if (typeof service.name === "object" && service.name !== null && service.name.de) {
			nameObj = service.name;
		} else {
			const nameStr = typeof service.name === "string" ? service.name : String(service.name);
			console.log(`Translating name "${nameStr}"...`);
			nameObj = await translateServiceText(nameStr);
		}

		// Check short_description
		let descObj: Record<string, string>;
		if (
			typeof service.short_description === "object" &&
			service.short_description !== null &&
			service.short_description.de
		) {
			descObj = service.short_description;
		} else {
			const descStr =
				typeof service.short_description === "string"
					? service.short_description
					: String(service.short_description || "");
			console.log(`Translating short_description "${descStr}"...`);
			descObj = await translateServiceText(descStr);
		}

		console.log("Translated Name:", nameObj);
		console.log("Translated Description:", descObj);

		const { error: updateError } = await supabase
			.from("services")
			.update({
				name: nameObj,
				short_description: descObj,
			})
			.eq("id", service.id);

		if (updateError) {
			console.error(`Failed to update service ${service.id}:`, updateError);
		} else {
			console.log(`Successfully updated service ${service.id}!`);
		}
	}

	console.log("Migration complete!");
}

main().catch(console.error);
