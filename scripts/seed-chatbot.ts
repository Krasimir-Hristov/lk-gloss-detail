/* eslint-disable no-console */
/**
 * Seed script for chatbot_knowledge table (Single-Language Language-Agnostic RAG).
 * Embeds ~8 concise company/policy/booking/B2B rules with language = 'any'.
 * Live service names, durations, and prices are injected directly from the `services` table at runtime.
 *
 * Usage:
 *   pnpm tsx scripts/seed-chatbot.ts
 */

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import { getOpenRouterEmbeddings } from "../src/lib/chatbot/embeddings";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !process.env.OPENROUTER_API_KEY) {
	console.error(
		"Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY, or OPENROUTER_API_KEY in .env",
	);
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: { persistSession: false },
});

interface SeedEntry {
	content: string;
	language: "any";
	metadata: {
		category: "company_policy" | "booking_process" | "mobile_service" | "b2b" | "faq" | "general";
		title: string;
		keywords: string[];
	};
}

const seedData: SeedEntry[] = [
	{
		language: "any",
		content:
			"LK Gloss & Detail ist ein zertifizierter mobiler Auto-Detailing-Service, gegründet von Lulezim Kodhimaj mit Sitz in Neuhausen auf den Fildern (Region Stuttgart), Deutschland. Über 250 zufriedene Kunden vertrauen auf unsere Qualität.",
		metadata: {
			category: "general",
			title: "Über LK Gloss & Detail",
			keywords: ["LK Gloss & Detail", "Lulezim Kodhimaj", "Neuhausen", "Stuttgart", "Detailing"],
		},
	},
	{
		language: "any",
		content:
			"Unser mobiler Service kommt mit kompletter Ausrüstung direkt zum Kunden — nach Hause oder an den Arbeitsplatz im Großraum Stuttgart. Für die Aufbereitung vor Ort sollte das Fahrzeug sicher zugänglich sein; falls Strom oder Wasser benötigt werden, klären wir das telefonisch vorab.",
		metadata: {
			category: "mobile_service",
			title: "Mobiler Vor-Ort-Service",
			keywords: ["mobil", "Vor-Ort", "Stuttgart", "Zuhause", "Arbeitsplatz"],
		},
	},
	{
		language: "any",
		content:
			"Termine können direkt über unsere Website auf der Buchungsseite angefragt werden: Leistungen auswählen, freies Datum wählen und Kontaktdaten absenden. Die Terminbestätigung und finale Abstimmung erfolgen persönlich per Telefon oder WhatsApp.",
		metadata: {
			category: "booking_process",
			title: "Terminbuchung & Bestätigung",
			keywords: ["Termin", "Buchung", "Datum", "Telefon", "Bestätigung"],
		},
	},
	{
		language: "any",
		content:
			"Unsere kostenlose KI-Fahrzeugbewertung analysiert 4 Fotos Ihres Fahrzeugs (Front, Heck, Seite, Innenraum), erkennt die Fahrzeuggröße und erstellt einen unverbindlichen Pflegeplan auf Basis unserer aktuellen Servicepreise.",
		metadata: {
			category: "faq",
			title: "Kostenlose KI-Fahrzeugbewertung",
			keywords: ["KI", "Bewertung", "Fotos", "Kostenvoranschlag", "kostenlos"],
		},
	},
	{
		language: "any",
		content:
			"Für die Innenraumaufbereitung arbeiten wir mit professionellen Dampfreinigern, schonenden Spezialprodukten für Leder und Textilien sowie Geruchsneutralisierung für ein hygienisch frisches Ergebnis.",
		metadata: {
			category: "faq",
			title: "Innenreinigung & Arbeitsweise",
			keywords: ["Innenreinigung", "Dampfreiniger", "Leder", "Geruch", "Textilien"],
		},
	},
	{
		language: "any",
		content:
			"Für Geschäftskunden (Autohäuser, Leasinggesellschaften, Autovermietungen und Fuhrparkmanager) bieten wir individuelle B2B-Flottenkonditionen und langfristige Partnerschaften. Anfragen bitte über das Kontaktformular oder telefonisch stellen.",
		metadata: {
			category: "b2b",
			title: "B2B & Flottenservice",
			keywords: ["B2B", "Flotte", "Autohaus", "Gewerbe", "Rabatt"],
		},
	},
	{
		language: "any",
		content:
			"Bei Terminänderungen oder Stornierungen bitten wir um rechtzeitige telefonische oder WhatsApp-Mitteilung mindestens 24 Stunden vor dem Termin, damit wir den Tag wieder freigeben können.",
		metadata: {
			category: "company_policy",
			title: "Stornierung & Terminänderung",
			keywords: ["Stornierung", "Absage", "Terminänderung", "24 Stunden"],
		},
	},
	{
		language: "any",
		content:
			"Sie erreichen uns über das Kontaktformular auf der Website, telefonisch oder direkt über den WhatsApp-Button. Wir melden uns in der Regel innerhalb von 24 Stunden zurück.",
		metadata: {
			category: "general",
			title: "Kontakt & Erreichbarkeit",
			keywords: ["Kontakt", "Telefon", "WhatsApp", "Rückruf", "Erreichbarkeit"],
		},
	},
];

const main = async () => {
	console.log("🚀 Seeding single-language chatbot knowledge base...\n");

	const { error: deleteError } = await supabase
		.from("chatbot_knowledge")
		.delete()
		.neq("id", "00000000-0000-0000-0000-000000000000");

	if (deleteError) {
		console.warn("⚠️ Could not clear existing entries (table may be empty):", deleteError.message);
	} else {
		console.log("🧹 Cleared existing entries.\n");
	}

	const embeddings = getOpenRouterEmbeddings();
	const vectors = await embeddings.embedDocuments(seedData.map((entry) => entry.content));

	const rows = seedData.map((entry, idx) => ({
		content: entry.content,
		embedding: vectors[idx],
		language: entry.language,
		metadata: entry.metadata,
	}));

	const { error: insertError } = await supabase.from("chatbot_knowledge").insert(rows);

	if (insertError) {
		console.error(`❌ Batch insert failed: ${insertError.message}`);
		process.exit(1);
	}

	console.log(`🎉 Done! ${rows.length} language-agnostic rules seeded.`);
};

main().catch((err) => {
	console.error("❌ Uncaught error:", err);
	process.exit(1);
});
