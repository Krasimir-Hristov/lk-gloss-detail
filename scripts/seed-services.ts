import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Service role key

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

const servicesToInsert = [
	{
		name: {
			en: "Mobile Wash",
			de: "Mobile Autowäsche",
			el: "Κινητό Πλύσιμο",
		},
		short_description: {
			en: "We will come to your home and wash your car",
			de: "Wir kommen zu Ihnen nach Hause und waschen Ihr Auto",
			el: "Ερχόμαστε στο σπίτι σας και πλένουμε το αυτοκίνητό σας",
		},
		category: "mobile-wash",
		price_small: 30,
		price_medium: 35,
		price_large: 40,
		price_suv: 40,
		duration_hours: 2,
		active: true,
		sort_order: 1,
		icon: "Car",
	},
	{
		name: {
			en: "Interior Detailing",
			de: "Innenraumaufbereitung",
			el: "Βιολογικός Καθαρισμός",
		},
		short_description: {
			en: "Deep cleaning of the interior",
			de: "Tiefenreinigung des Innenraums",
			el: "Βαθύς καθαρισμός του εσωτερικού",
		},
		category: "interior",
		price_small: 50,
		price_medium: 60,
		price_large: 70,
		price_suv: 70,
		duration_hours: 3,
		active: true,
		sort_order: 2,
		icon: "SprayCan",
	},
	{
		name: {
			en: "Full Detailing",
			de: "Komplettaufbereitung",
			el: "Πλήρης Καθαρισμός",
		},
		short_description: {
			en: "Complete inside and outside cleaning",
			de: "Komplette Innen- und Außenreinigung",
			el: "Πλήρης καθαρισμός εσωτερικά και εξωτερικά",
		},
		category: "full-detail",
		price_small: 100,
		price_medium: 120,
		price_large: 150,
		price_suv: 150,
		duration_hours: 5,
		active: true,
		sort_order: 3,
		icon: "Sparkles",
	},
];

const main = async () => {
	console.log("🗑️  Deleting all existing services...");
	const { error: deleteError } = await supabase
		.from("services")
		.delete()
		.neq("id", "00000000-0000-0000-0000-000000000000");

	if (deleteError) {
		console.error("❌ Failed to delete existing services:", deleteError.message);
		process.exit(1);
	}

	console.log("✅ Successfully deleted existing services.");
	console.log("🌱 Seeding new services...");

	const { data, error: insertError } = await supabase
		.from("services")
		.insert(servicesToInsert)
		.select();

	if (insertError) {
		console.error("❌ Failed to insert services:", insertError.message);
		process.exit(1);
	}

	console.log(`✅ Successfully seeded ${data.length} services!`);
};

main().catch((err) => {
	console.error("❌ Uncaught error:", err);
	process.exit(1);
});
