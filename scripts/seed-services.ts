import { readFileSync } from "fs";
import { resolve } from "path";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
	console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: { persistSession: false },
});

const services = [
	{
		name: "interior",
		short_description: "Professionelle Innenraumreinigung mit Dampfreiniger und Spezialprodukten",
		icon: "Sparkles",
		imageFile: "man-with-vacum.png",
		category: "interior",
		sort_order: 1,
		price_small: 89,
		price_medium: 119,
		price_large: 149,
		price_suv: 179,
		duration_hours: 2.5,
	},
	{
		name: "headlights",
		short_description: "Scheinwerferaufbereitung — Entfernung von Vergilbung und Kratzern",
		icon: "Lightbulb",
		imageFile: "headlights_cleaning.png",
		category: "exterior",
		sort_order: 2,
		price_small: 49,
		price_medium: 49,
		price_large: 49,
		price_suv: 49,
		duration_hours: 1,
	},
	{
		name: "paintCorrection",
		short_description: "Lackkorrektur & Keramikversiegelung für tiefen Glanz und Schutz",
		icon: "ShieldCheck",
		imageFile: "mop-sege.png",
		category: "exterior",
		sort_order: 3,
		price_small: 199,
		price_medium: 299,
		price_large: 399,
		price_suv: 499,
		duration_hours: 4,
	},
];

const assetsDir = resolve(import.meta.dirname, "..", "src", "assets", "services");

const main = async () => {
	console.log("🚀 Seeding services...\n");

	for (const service of services) {
		const { imageFile, ...serviceData } = service;

		// Upload image to gallery bucket
		const filePath = resolve(assetsDir, imageFile);
		const fileBuffer = readFileSync(filePath);

		const storagePath = `services/${imageFile}`;
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from("gallery")
			.upload(storagePath, fileBuffer, {
				contentType: "image/png",
				upsert: true,
			});

		if (uploadError) {
			console.error(`❌ Failed to upload ${imageFile}:`, uploadError.message);
			continue;
		}

		console.log(`✅ Uploaded ${imageFile} → ${uploadData.path}`);

		// Get public URL
		const {
			data: { publicUrl },
		} = supabase.storage.from("gallery").getPublicUrl(storagePath);

		console.log(`   Public URL: ${publicUrl}`);

		// Upsert service row keyed on name (safe to re-run)
		const { error: upsertError } = await supabase.from("services").upsert(
			{
				...serviceData,
				image_url: publicUrl,
			},
			{ onConflict: "name", ignoreDuplicates: false },
		);

		if (upsertError) {
			console.error(`❌ Failed to upsert ${service.name}:`, upsertError.message);
		} else {
			console.log(`✅ Inserted service: ${service.name}\n`);
		}
	}

	console.log("🎉 Seeding complete!");
};

main().catch(console.error);
