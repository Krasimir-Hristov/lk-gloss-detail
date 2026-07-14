/* eslint-disable no-console */
/**
 * Seed script for chatbot_knowledge table.
 * Embeds Q&A pairs and inserts them into Supabase for RAG.
 *
 * Usage:
 *   pnpm tsx scripts/seed-chatbot.ts
 *
 * Prerequisites:
 *   1. Run the migration first: npx supabase db push
 *   2. .env must have NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, OPENROUTER_API_KEY
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

// ── Config ──────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;
const openRouterKey = process.env.OPENROUTER_API_KEY!;

if (!supabaseUrl || !supabaseKey || !openRouterKey) {
	console.error(
		"Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, or OPENROUTER_API_KEY in .env",
	);
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: { persistSession: false },
});

// ── LangChain Embeddings (OpenRouter via @langchain/openai) ─────────────────

const embeddings = new OpenAIEmbeddings({
	apiKey: openRouterKey,
	modelName: "openai/text-embedding-3-small",
	configuration: {
		baseURL: "https://openrouter.ai/api/v1",
	},
});

async function getEmbedding(text: string): Promise<number[]> {
	return embeddings.embedQuery(text);
}

// ── Seed Data ───────────────────────────────────────────────────────────────

interface SeedEntry {
	content: string;
	language: "de" | "en" | "el";
	metadata: Record<string, string>;
}

const seedData: SeedEntry[] = [
	// ── German (de) ─────────────────────────────────────────────────────
	{
		language: "de",
		content:
			"LK Gloss & Detail ist ein mobiler Auto-Detailing-Service mit Sitz in Neuhausen auf den Fildern, Deutschland. Wir kommen direkt zu Ihnen nach Hause oder an Ihren Arbeitsplatz. Unsere Dienstleistungen umfassen professionelle Innenreinigung, Scheinwerferaufbereitung und Lackkorrektur mit Keramikversiegelung.",
		metadata: { topic: "about", category: "company" },
	},
	{
		language: "de",
		content:
			"Unsere Preise für die Innenreinigung: Kleinwagen ab 89€, Mittelklasse ab 119€, große Fahrzeuge ab 149€, SUV ab 179€. Die genaue Preisangabe hängt vom Zustand und der Größe Ihres Fahrzeugs ab. Nutzen Sie unsere kostenlose KI-Bewertung für einen persönlichen Kostenvoranschlag.",
		metadata: { topic: "pricing_interior", category: "pricing" },
	},
	{
		language: "de",
		content:
			"Die Scheinwerferaufbereitung kostet pauschal 49€ pro Paar, unabhängig von der Fahrzeuggröße. Wir entfernen Vergilbung, Kratzer und Trübungen und versiegeln die Scheinwerfer mit einem langlebigen UV-Schutz. Dauer: ca. 1 Stunde.",
		metadata: { topic: "pricing_headlights", category: "pricing" },
	},
	{
		language: "de",
		content:
			"Lackkorrektur und Keramikversiegelung: Kleinwagen ab 199€, Mittelklasse ab 299€, große Fahrzeuge ab 399€, SUV ab 499€. Dies ist eine 3-Stufen-Behandlung: Reinigung, Politur und Versiegelung für langanhaltenden Schutz und tiefen Glanz. Dauer: ca. 4 Stunden.",
		metadata: { topic: "pricing_paint", category: "pricing" },
	},
	{
		language: "de",
		content:
			"Sie können einen Termin ganz einfach über unsere Website buchen. Gehen Sie auf die Buchungsseite und wählen Sie Ihre gewünschten Leistungen, Ihr bevorzugtes Datum und geben Sie Ihre Kontaktdaten ein. Wir melden uns dann bei Ihnen zur Bestätigung.",
		metadata: { topic: "booking", category: "process" },
	},
	{
		language: "de",
		content:
			"Die KI-Fahrzeugbewertung funktioniert so: Sie laden 4 Fotos Ihres Fahrzeugs hoch (Front, Heck, Seite, Innenraum). Unsere KI analysiert den Zustand und erstellt einen persönlichen Aufbereitungsplan mit Preisangabe. Die Analyse ist komplett kostenlos und unverbindlich.",
		metadata: { topic: "ai_assessment", category: "process" },
	},
	{
		language: "de",
		content:
			"Für Geschäftskunden bieten wir spezielle Flottenrabatte und Langzeitverträge an. Wir arbeiten mit Autohäusern, Leasinggesellschaften, Autovermietungen und Fuhrparkmanagern zusammen. Kontaktieren Sie uns für ein individuelles Angebot.",
		metadata: { topic: "b2b", category: "business" },
	},
	{
		language: "de",
		content:
			"Unsere mobile Service bedeutet: Sie müssen nirgendwo hinfahren. Wir kommen mit unserer kompletten Ausrüstung direkt zu Ihnen — ob zu Hause oder am Arbeitsplatz. Sie sparen Zeit und Aufwand, während wir Ihr Fahrzeug professionell aufbereiten.",
		metadata: { topic: "mobile_service", category: "service" },
	},
	{
		language: "de",
		content:
			"Für die Innenreinigung verwenden wir Dampfreiniger und Spezialprodukte. Wir reinigen alle Oberflächen gründlich, behandeln Leder und Textilien und neutralisieren Gerüche. Das Ergebnis ist ein frischer, sauberer Innenraum wie am ersten Tag.",
		metadata: { topic: "interior_details", category: "service" },
	},
	{
		language: "de",
		content:
			"LK Gloss & Detail wurde von Lulezim Kodhimaj gegründet. Wir sind ein zertifiziertes Detailing-Studio mit über 250 zufriedenen Kunden. Qualität und Kundenzufriedenheit stehen bei uns an erster Stelle.",
		metadata: { topic: "founder", category: "company" },
	},
	{
		language: "de",
		content:
			"Sie erreichen uns telefonisch oder per E-Mail über das Kontaktformular auf unserer Website. Für schnelle Fragen können Sie auch unseren WhatsApp-Chat nutzen. Wir antworten in der Regel innerhalb von 24 Stunden.",
		metadata: { topic: "contact", category: "contact" },
	},

	// ── English (en) ─────────────────────────────────────────────────────
	{
		language: "en",
		content:
			"LK Gloss & Detail is a mobile car detailing service based in Neuhausen auf den Fildern, Germany. We come directly to your home or workplace. Our services include professional interior cleaning, headlight restoration, and paint correction with ceramic coating.",
		metadata: { topic: "about", category: "company" },
	},
	{
		language: "en",
		content:
			"Our interior cleaning prices: small cars from €89, medium cars from €119, large cars from €149, SUVs from €179. The exact price depends on your vehicle's condition and size. Use our free AI assessment for a personalized quote.",
		metadata: { topic: "pricing_interior", category: "pricing" },
	},
	{
		language: "en",
		content:
			"Headlight restoration costs a flat €49 per pair, regardless of vehicle size. We remove yellowing, scratches, and haze and seal the headlights with long-lasting UV protection. Duration: approx. 1 hour.",
		metadata: { topic: "pricing_headlights", category: "pricing" },
	},
	{
		language: "en",
		content:
			"Paint correction and ceramic coating: small cars from €199, medium cars from €299, large cars from €399, SUVs from €499. This is a 3-stage treatment: cleaning, polishing, and sealing for long-lasting protection and deep shine. Duration: approx. 4 hours.",
		metadata: { topic: "pricing_paint", category: "pricing" },
	},
	{
		language: "en",
		content:
			"You can book an appointment easily through our website. Go to the booking page and select your desired services, preferred date, and enter your contact details. We will then contact you for confirmation.",
		metadata: { topic: "booking", category: "process" },
	},
	{
		language: "en",
		content:
			"The AI vehicle assessment works like this: you upload 4 photos of your vehicle (front, rear, side, interior). Our AI analyzes the condition and creates a personalized detailing plan with pricing. The assessment is completely free and non-binding.",
		metadata: { topic: "ai_assessment", category: "process" },
	},
	{
		language: "en",
		content:
			"For business customers, we offer special fleet discounts and long-term contracts. We work with dealerships, leasing companies, car rental agencies, and fleet managers. Contact us for a custom quote.",
		metadata: { topic: "b2b", category: "business" },
	},
	{
		language: "en",
		content:
			"Our mobile service means you don't have to go anywhere. We come with our complete equipment directly to you — whether at home or at work. You save time and effort while we professionally detail your vehicle.",
		metadata: { topic: "mobile_service", category: "service" },
	},
	{
		language: "en",
		content:
			"For interior cleaning, we use steam cleaners and specialty products. We thoroughly clean all surfaces, treat leather and textiles, and neutralize odors. The result is a fresh, clean interior like new.",
		metadata: { topic: "interior_details", category: "service" },
	},
	{
		language: "en",
		content:
			"LK Gloss & Detail was founded by Lulezim Kodhimaj. We are a certified detailing studio with over 250 satisfied customers. Quality and customer satisfaction are our top priorities.",
		metadata: { topic: "founder", category: "company" },
	},
	{
		language: "en",
		content:
			"You can reach us by phone or email via the contact form on our website. For quick questions, you can also use our WhatsApp chat. We typically respond within 24 hours.",
		metadata: { topic: "contact", category: "contact" },
	},

	// ── Greek (el) ──────────────────────────────────────────────────────
	{
		language: "el",
		content:
			"Η LK Gloss & Detail είναι μια κινητή υπηρεσία detailing αυτοκινήτων με έδρα το Neuhausen auf den Fildern, Γερμανία. Ερχόμαστε απευθείας στο σπίτι ή στην εργασία σας. Οι υπηρεσίες μας περιλαμβάνουν επαγγελματικό εσωτερικό καθαρισμό, αποκατάσταση φαναριών και διόρθωση βαφής με κεραμική σφράγιση.",
		metadata: { topic: "about", category: "company" },
	},
	{
		language: "el",
		content:
			"Οι τιμές μας για εσωτερικό καθαρισμό: μικρά αυτοκίνητα από 89€, μεσαία από 119€, μεγάλα από 149€, SUV από 179€. Η ακριβής τιμή εξαρτάται από την κατάσταση και το μέγεθος του οχήματός σας. Χρησιμοποιήστε τη δωρεάν αξιολόγηση AI για προσωπική προσφορά.",
		metadata: { topic: "pricing_interior", category: "pricing" },
	},
	{
		language: "el",
		content:
			"Η αποκατάσταση φαναριών κοστίζει 49€ ανά ζευγάρι, ανεξαρτήτως μεγέθους οχήματος. Αφαιρούμε κιτρίνισμα, γρατζουνιές και θολούρα και σφραγίζουμε τα φανάρια με μακροχρόνια προστασία UV. Διάρκεια: περίπου 1 ώρα.",
		metadata: { topic: "pricing_headlights", category: "pricing" },
	},
	{
		language: "el",
		content:
			"Διόρθωση βαφής και κεραμική σφράγιση: μικρά αυτοκίνητα από 199€, μεσαία από 299€, μεγάλα από 399€, SUV από 499€. Αυτή είναι μια θεραπεία 3 σταδίων: καθαρισμός, γυάλισμα και σφράγιση για μακροχρόνια προστασία και βαθιά λάμψη. Διάρκεια: περίπου 4 ώρες.",
		metadata: { topic: "pricing_paint", category: "pricing" },
	},
	{
		language: "el",
		content:
			"Μπορείτε να κλείσετε ραντεβού εύκολα μέσω της ιστοσελίδας μας. Μεταβείτε στη σελίδα κρατήσεων και επιλέξτε τις επιθυμητές υπηρεσίες, την προτιμώμενη ημερομηνία και εισάγετε τα στοιχεία επικοινωνίας σας. Θα επικοινωνήσουμε μαζί σας για επιβεβαίωση.",
		metadata: { topic: "booking", category: "process" },
	},
	{
		language: "el",
		content:
			"Η αξιολόγηση οχήματος με AI λειτουργεί ως εξής: ανεβάζετε 4 φωτογραφίες του οχήματός σας (μπροστά, πίσω, πλάι, εσωτερικό). Το AI μας αναλύει την κατάσταση και δημιουργεί ένα εξατομικευμένο πλάνο περιποίησης με τιμές. Η αξιολόγηση είναι εντελώς δωρεάν και χωρίς υποχρέωση.",
		metadata: { topic: "ai_assessment", category: "process" },
	},
	{
		language: "el",
		content:
			"Για επαγγελματίες πελάτες, προσφέρουμε ειδικές εκπτώσεις στόλου και μακροπρόθεσμα συμβόλαια. Συνεργαζόμαστε με αντιπροσωπείες, εταιρείες leasing, ενοικιάσεις αυτοκινήτων και διαχειριστές στόλων. Επικοινωνήστε μαζί μας για προσαρμοσμένη προσφορά.",
		metadata: { topic: "b2b", category: "business" },
	},
	{
		language: "el",
		content:
			"Η κινητή μας υπηρεσία σημαίνει ότι δεν χρειάζεται να πάτε πουθενά. Ερχόμαστε με τον πλήρη εξοπλισμό μας απευθείας σε εσάς — είτε στο σπίτι είτε στην εργασία. Εξοικονομείτε χρόνο και κόπο ενώ εμείς περιποιούμαστε επαγγελματικά το όχημά σας.",
		metadata: { topic: "mobile_service", category: "service" },
	},
	{
		language: "el",
		content:
			"Για τον εσωτερικό καθαρισμό, χρησιμοποιούμε ατμοκαθαριστές και ειδικά προϊόντα. Καθαρίζουμε σχολαστικά όλες τις επιφάνειες, περιποιούμαστε δέρμα και υφάσματα και εξουδετερώνουμε οσμές. Το αποτέλεσμα είναι ένα φρέσκο, καθαρό εσωτερικό όπως καινούργιο.",
		metadata: { topic: "interior_details", category: "service" },
	},
	{
		language: "el",
		content:
			"Η LK Gloss & Detail ιδρύθηκε από τον Lulezim Kodhimaj. Είμαστε ένα πιστοποιημένο στούντιο detailing με πάνω από 250 ικανοποιημένους πελάτες. Η ποιότητα και η ικανοποίηση των πελατών είναι η κορυφαία μας προτεραιότητα.",
		metadata: { topic: "founder", category: "company" },
	},
	{
		language: "el",
		content:
			"Μπορείτε να επικοινωνήσετε μαζί μας τηλεφωνικά ή μέσω email από τη φόρμα επικοινωνίας στην ιστοσελίδα μας. Για γρήγορες ερωτήσεις, μπορείτε επίσης να χρησιμοποιήσετε το WhatsApp. Συνήθως απαντάμε εντός 24 ωρών.",
		metadata: { topic: "contact", category: "contact" },
	},
];

// ── Main ────────────────────────────────────────────────────────────────────

const main = async () => {
	console.log("🚀 Seeding chatbot knowledge base...\n");

	// Clear existing entries (so we can re-run safely)
	const { error: deleteError } = await supabase
		.from("chatbot_knowledge")
		.delete()
		.neq("id", "00000000-0000-0000-0000-000000000000");
	if (deleteError) {
		console.warn("⚠️ Could not clear existing entries (table may be empty):", deleteError.message);
	} else {
		console.log("🧹 Cleared existing entries.\n");
	}

	let successCount = 0;
	let failCount = 0;

	for (let i = 0; i < seedData.length; i++) {
		const entry = seedData[i];
		const flag = entry.language === "de" ? "🇩🇪" : entry.language === "en" ? "🇬🇧" : "🇬🇷";

		try {
			console.log(
				`[${i + 1}/${seedData.length}] ${flag} Embedding: "${entry.content.slice(0, 80)}..."`,
			);

			const embedding = await getEmbedding(entry.content);

			const { error: insertError } = await supabase.from("chatbot_knowledge").insert({
				content: entry.content,
				embedding,
				language: entry.language,
				metadata: entry.metadata,
			});

			if (insertError) {
				console.error(`  ❌ Insert failed: ${insertError.message}`);
				failCount++;
			} else {
				console.log(`  ✅ Inserted (${entry.metadata.topic})`);
				successCount++;
			}
		} catch (err) {
			console.error(`  ❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
			failCount++;
		}

		// Small delay to avoid rate limiting
		await new Promise((r) => setTimeout(r, 200));
	}

	console.log(`\n🎉 Done! ${successCount} inserted, ${failCount} failed.`);
};

main().catch(console.error);
