/* eslint-disable no-console */
/**
 * Seed script for chatbot_knowledge table (Single-Language Language-Agnostic RAG).
 * Generates embeddings before touching Supabase and upserts deterministic seed UUIDs
 * in one atomic statement, preserving all admin-authored entries.
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
	id: string;
	content: string;
	language: "any";
	metadata: {
		category: "company_policy" | "booking_process" | "mobile_service" | "b2b" | "faq" | "general";
		title: string;
		keywords: string[];
		source: "seed_chatbot";
		seedKey: string;
	};
}

const seedData: SeedEntry[] = [
	{
		id: "11111111-1111-4111-8111-000000000001",
		language: "any",
		content:
			"LK Gloss & Detail ist ein zertifizierter mobiler Auto-Detailing-Service, gegründet von Lulezim Kodhimaj mit Sitz in Neuhausen auf den Fildern (Region Stuttgart), Deutschland. Über 250 zufriedene Kunden vertrauen auf unsere Qualität.",
		metadata: {
			category: "general",
			title: "Über LK Gloss & Detail",
			keywords: ["LK Gloss & Detail", "Lulezim Kodhimaj", "Neuhausen", "Stuttgart", "Detailing"],
			source: "seed_chatbot",
			seedKey: "about_company",
		},
	},
	{
		id: "11111111-1111-4111-8111-000000000002",
		language: "any",
		content:
			"Unser mobiler Service kommt mit kompletter Ausrüstung direkt zum Kunden — nach Hause oder an den Arbeitsplatz im Großraum Stuttgart. Für die Aufbereitung vor Ort sollte das Fahrzeug sicher zugänglich sein; falls Strom oder Wasser benötigt werden, klären wir das telefonisch vorab.",
		metadata: {
			category: "mobile_service",
			title: "Mobiler Vor-Ort-Service",
			keywords: ["mobil", "Vor-Ort", "Stuttgart", "Zuhause", "Arbeitsplatz"],
			source: "seed_chatbot",
			seedKey: "mobile_service",
		},
	},
	{
		id: "11111111-1111-4111-8111-000000000003",
		language: "any",
		content:
			"Termine können direkt über unsere Website auf der Buchungsseite angefragt werden: Leistungen auswählen, freies Datum wählen und Kontaktdaten absenden. Die Terminbestätigung und finale Abstimmung erfolgen persönlich per Telefon oder WhatsApp.",
		metadata: {
			category: "booking_process",
			title: "Terminbuchung & Bestätigung",
			keywords: ["Termin", "Buchung", "Datum", "Telefon", "Bestätigung"],
			source: "seed_chatbot",
			seedKey: "booking_process",
		},
	},
	{
		id: "11111111-1111-4111-8111-000000000004",
		language: "any",
		content:
			"Unsere kostenlose KI-Fahrzeugbewertung analysiert 4 Fotos Ihres Fahrzeugs (Front, Heck, Seite, Innenraum), erkennt die Fahrzeuggröße und erstellt einen unverbindlichen Pflegeplan auf Basis unserer aktuellen Servicepreise.",
		metadata: {
			category: "faq",
			title: "Kostenlose KI-Fahrzeugbewertung",
			keywords: ["KI", "Bewertung", "Fotos", "Kostenvoranschlag", "kostenlos"],
			source: "seed_chatbot",
			seedKey: "ai_assessment",
		},
	},
	{
		id: "11111111-1111-4111-8111-000000000005",
		language: "any",
		content:
			"Für die Innenraumaufbereitung arbeiten wir mit professionellen Dampfreinigern, schonenden Spezialprodukten für Leder und Textilien sowie Geruchsneutralisierung für ein hygienisch frisches Ergebnis.",
		metadata: {
			category: "faq",
			title: "Innenreinigung & Arbeitsweise",
			keywords: ["Innenreinigung", "Dampfreiniger", "Leder", "Geruch", "Textilien"],
			source: "seed_chatbot",
			seedKey: "interior_cleaning",
		},
	},
	{
		id: "11111111-1111-4111-8111-000000000006",
		language: "any",
		content:
			"Für Geschäftskunden (Autohäuser, Leasinggesellschaften, Autovermietungen und Fuhrparkmanager) bieten wir individuelle B2B-Flottenkonditionen und langfristige Partnerschaften. Anfragen bitte über das Kontaktformular oder telefonisch stellen.",
		metadata: {
			category: "b2b",
			title: "B2B & Flottenservice",
			keywords: ["B2B", "Flotte", "Autohaus", "Gewerbe", "Rabatt"],
			source: "seed_chatbot",
			seedKey: "b2b_fleet",
		},
	},
	{
		id: "11111111-1111-4111-8111-000000000007",
		language: "any",
		content:
			"Bei Terminänderungen oder Stornierungen bitten wir um rechtzeitige telefonische oder WhatsApp-Mitteilung mindestens 24 Stunden vor dem Termin, damit wir den Tag wieder freigeben können.",
		metadata: {
			category: "company_policy",
			title: "Stornierung & Terminänderung",
			keywords: ["Stornierung", "Absage", "Terminänderung", "24 Stunden"],
			source: "seed_chatbot",
			seedKey: "cancellation_policy",
		},
	},
	{
		id: "11111111-1111-4111-8111-000000000008",
		language: "any",
		content:
			"Sie erreichen uns über das Kontaktformular auf der Website, telefonisch oder direkt über den WhatsApp-Button. Wir melden uns in der Regel innerhalb von 24 Stunden zurück.",
		metadata: {
			category: "general",
			title: "Kontakt & Erreichbarkeit",
			keywords: ["Kontakt", "Telefon", "WhatsApp", "Rückruf", "Erreichbarkeit"],
			source: "seed_chatbot",
			seedKey: "contact_hours",
		},
	},
];

const LEGACY_SEED_LANGUAGES = ["de", "en", "el"] as const;
const LEGACY_SEED_TOPICS = [
	"about",
	"pricing_interior",
	"pricing_headlights",
	"pricing_paint",
	"booking",
	"ai_assessment",
	"b2b",
	"mobile_service",
	"interior_details",
	"founder",
	"contact",
] as const;

const main = async () => {
	console.log("🚀 Generating embeddings for default chatbot knowledge rules...\n");

	const embeddings = getOpenRouterEmbeddings();
	const vectors = await embeddings.embedDocuments(seedData.map((entry) => entry.content));

	if (vectors.length !== seedData.length) {
		throw new Error(`Expected ${seedData.length} embeddings, received ${vectors.length}`);
	}

	const rows = seedData.map((entry, idx) => ({
		id: entry.id,
		content: entry.content,
		embedding: vectors[idx],
		language: entry.language,
		metadata: entry.metadata,
	}));

	console.log("🔄 Upserting managed seed rules atomically (preserving admin entries)...");
	const { error: upsertError } = await supabase
		.from("chatbot_knowledge")
		.upsert(rows, { onConflict: "id" });

	if (upsertError) {
		console.error(`❌ Atomic seed upsert failed: ${upsertError.message}`);
		process.exit(1);
	}

	const managedIds = `(${seedData.map((entry) => entry.id).join(",")})`;
	const { data: removedLegacy, error: cleanupError } = await supabase
		.from("chatbot_knowledge")
		.delete()
		.in("language", [...LEGACY_SEED_LANGUAGES])
		.in("metadata->>topic", [...LEGACY_SEED_TOPICS])
		.is("metadata->>title", null)
		.is("metadata->>source", null)
		.not("id", "in", managedIds)
		.select("id");

	if (cleanupError) {
		console.error(`❌ Legacy seed cleanup failed: ${cleanupError.message}`);
		process.exit(1);
	}

	if (removedLegacy && removedLegacy.length > 0) {
		console.log(`🧹 Cleaned up ${removedLegacy.length} legacy multilingual seed rows.`);
	}

	console.log(`🎉 Done! ${rows.length} managed language-agnostic rules seeded/updated.`);
};

main().catch((err) => {
	console.error("❌ Uncaught error:", err);
	process.exit(1);
});
