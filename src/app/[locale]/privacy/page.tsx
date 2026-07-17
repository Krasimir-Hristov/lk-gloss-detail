import { getTranslations, setRequestLocale } from "next-intl/server";
import * as React from "react";

import { routing } from "@/i18n/routing";

import type { Metadata } from "next";

type Params = { locale: string };

export const generateMetadata = async ({
	params,
}: {
	params: Promise<Params>;
}): Promise<Metadata> => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Privacy" });

	const alternates = Object.fromEntries(
		routing.locales.map((loc) => [loc, `https://lkglossanddetail.de/${loc}/privacy`]),
	);

	return {
		title: t("title"),
		alternates: {
			languages: {
				...alternates,
				"x-default": "https://lkglossanddetail.de/de/privacy",
			},
		},
	};
};

const PrivacyPage = async ({ params }: { params: Promise<Params> }) => {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Privacy" });

	return (
		<section className="min-h-screen bg-[#121212] py-16 md:py-24">
			<div className="mx-auto max-w-4xl px-4 md:px-8">
				<h1 className="mb-8 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
					{t("title")}
				</h1>

				{/* Warning Banner explaining placeholder data */}
				<div className="mb-10 border-l-4 border-[#7b2dff] bg-[#1a1528] p-4 text-[#ccc3d9] shadow-sm">
					<p className="text-sm font-semibold text-[#d1bcff]">Hinweis / Notice:</p>
					<p className="mt-1 text-xs">
						Die Angaben zur verantwortlichen Stelle enthalten vorübergehend Musterdaten, da die
						Registrierung der Firma noch läuft. Ersetzen Sie diese Daten nach Abschluss der
						Registrierung durch Ihre echten Daten.
					</p>
				</div>

				<div className="space-y-10 text-sm leading-relaxed text-[#ccc3d9]">
					{/* --- Section 1: Allgemeine Hinweise --- */}
					<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
						<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
							1. Datenschutz auf einen Blick
						</h2>

						<h3 className="mt-4 font-semibold text-white">Allgemeine Hinweise</h3>
						<p className="mt-2">
							Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
							personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
							Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
							Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem
							Text aufgeführten Datenschutzerklärung.
						</p>

						<h3 className="mt-4 font-semibold text-white">Datenerfassung auf dieser Website</h3>
						<p className="mt-2 font-medium text-[#d1bcff]">
							Wer ist verantwortlich für die Datenerfassung auf dieser Website?
						</p>
						<p className="mt-1">
							Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
							Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle“ in dieser
							Datenschutzerklärung entnehmen.
						</p>

						<p className="mt-4 font-medium text-[#d1bcff]">Wie erfassen wir Ihre Daten?</p>
						<p className="mt-1">
							Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei
							kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular, das
							Buchungsformular oder im Rahmen der KI-Fahrzeugbewertung eingeben.
						</p>
						<p className="mt-2">
							Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website
							durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B.
							Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser
							Daten erfolgt automatisch, sobald Sie diese Website betreten.
						</p>

						<p className="mt-4 font-medium text-[#d1bcff]">Wofür nutzen wir Ihre Daten?</p>
						<p className="mt-1">
							Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu
							gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet
							werden. Daten aus dem Kontaktformular, dem Buchungssystem und der KI-Bewertung dienen
							ausschließlich der Bearbeitung Ihrer Anfragen und der Ausführung unserer
							Dienstleistungen.
						</p>
					</article>

					{/* --- Section 2: Verantwortliche Stelle --- */}
					<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
						<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
							2. Allgemeine Hinweise und Pflichtinformationen
						</h2>

						<h3 className="mt-4 font-semibold text-white">Hinweis zur verantwortlichen Stelle</h3>
						<p className="mt-2">
							Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
						</p>

						{/* 
							TODO: Update address and contact details once the company registration is completed.
						*/}
						<div className="mt-3 rounded-lg bg-[#121212] p-4 text-white">
							<p className="font-bold">Lulezim Kodhimaj</p>
							<p className="mt-1 text-[#ccc3d9]">
								Musterstraße 123
								<br />
								73794 Neuhausen auf den Fildern
								<br />
								Deutschland
							</p>
							<p className="mt-2 text-[#ccc3d9]">
								Telefon:{" "}
								<a href="tel:+4915112345678" className="text-[#d1bcff] hover:underline">
									+49 151 12345678
								</a>
								<br />
								E-Mail:{" "}
								<a
									href="mailto:info@lkglossanddetail.de"
									className="text-[#d1bcff] hover:underline"
								>
									info@lkglossanddetail.de
								</a>
							</p>
						</div>

						<p className="mt-4">
							Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder
							gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von
							personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
						</p>

						<h3 className="mt-6 font-semibold text-white">Speicherdauer</h3>
						<p className="mt-2">
							Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt
							wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die
							Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschbegehren geltend machen
							oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht,
							es sei denn, wir haben andere rechtlich zulässige Gründe für die Speicherung Ihrer
							personenbezogenen Daten (z. B. steuer- oder handelsrechtliche Aufbewahrungsfristen);
							im letztgenannten Fall erfolgt die Löschung nach Fortfall dieser Gründe.
						</p>

						<h3 className="mt-6 font-semibold text-white">
							Hinweis zur Datenweitergabe in die USA und sonstige Drittstaaten
						</h3>
						<p className="mt-2">
							Wir verwenden unter anderem Tools von Unternehmen mit Sitz in den USA oder sonstigen
							datenschutzrechtlich nicht sicheren Drittstaaten. Wenn diese Tools aktiv sind, können
							Ihre personenbezogene Daten in diese Drittstaaten übertragen und dort verarbeitet
							werden. Wir weisen darauf hin, dass in diesen Ländern kein mit der EU vergleichbares
							Datenschutzniveau garantiert werden kann.
						</p>
					</article>

					{/* --- Section 3: Datenerfassung --- */}
					<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
						<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
							3. Datenerfassung auf unserer Website
						</h2>

						<h3 className="mt-4 font-semibold text-white">Hosting</h3>
						<p className="mt-2">Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</p>
						{/* 
							TODO: If the hosting provider changes, update this description.
						*/}
						<p className="mt-1">
							<strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, USA. Details
							entnehmen Sie der Datenschutzerklärung von Vercel:{" "}
							<a
								href="https://vercel.com/legal/privacy-policy"
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#d1bcff] underline hover:text-white"
							>
								https://vercel.com/legal/privacy-policy
							</a>
							. Die Verwendung von Vercel erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir
							haben ein berechtigtes Interesse an einer möglichst zuverlässigen Darstellung unserer
							Website.
						</p>

						<h3 className="mt-6 font-semibold text-white">Cookies & Local Storage</h3>
						<p className="mt-2">
							Unsere Website verwendet Session Storage und Cookies zur Speicherung Ihrer
							ausgewählten Sprache (Locale) sowie zur Gewährleistung des Buchungs- und
							Bewertungsprozesses. Es werden keine unnötigen Tracking- oder
							Drittanbieter-Werbecookies ohne Ihre ausdrückliche Zustimmung verwendet.
						</p>

						<h3 className="mt-6 font-semibold text-white">Kontaktformular & Buchungssystem</h3>
						<p className="mt-2">
							Wenn Sie uns per Kontaktformular Anfragen zukommen lassen oder einen Termin über das
							Buchungssystem vereinbaren, werden Ihre Angaben aus dem jeweiligen Formular inklusive
							der von Ihnen dort angegebenen Kontaktdaten (Name, E-Mail-Adresse, Telefonnummer,
							Fahrzeugdetails, Wunschtermin) zur Bearbeitung der Anfrage und für den Fall von
							Anschlussfragen bei uns gespeichert. Diese Daten werden in unserer sicheren Datenbank
							(Supabase) gespeichert und wir nutzen Resend Inc. zur Versendung von
							E-Mail-Benachrichtigungen. Die Verarbeitung dieser Daten erfolgt auf Grundlage von
							Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines Vertrags
							zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist.
						</p>

						<h3 className="mt-6 font-semibold text-white">KI-Fahrzeugbewertung & Fotoanalyse</h3>
						<p className="mt-2">
							Unsere Website bietet eine KI-gestützte Fotoanalyse zur Bewertung des Zustands Ihres
							Fahrzeugs an. Dabei laden Sie Fotos Ihres Fahrzeugs hoch (z. B. Front, Heck, Seite,
							Innenraum).
						</p>
						<ul className="mt-2 list-disc space-y-2 pl-5">
							<li>
								<strong>Zweck der Verarbeitung:</strong> Die Fotos werden analysiert, um optische
								Schäden, Verschmutzungen oder Kratzer zu erkennen und darauf basierend eine
								unverbindliche Preisschätzung für die Aufbereitung abzugeben.
							</li>
							<li>
								<strong>AI/LLM Processing (Gemini API):</strong> Die Bilddaten werden an die Gemini
								API (Google Cloud / Google AI) zur Analyse übertragen. Die Datenverarbeitung erfolgt
								unter strikter Einhaltung der Sicherheitsrichtlinien. Es werden keine
								personenbezogenen Daten (wie Gesichter oder Kennzeichen) analysiert. Wir bitten Sie,
								vor dem Upload darauf zu achten, dass keine Personen auf den Bildern zu sehen sind.
							</li>
							<li>
								<strong>Rechtsgrundlage:</strong> Die Verarbeitung der Bilddaten zur Bewertung Ihres
								Fahrzeugs erfolgt auf Grundlage Ihrer Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO,
								die Sie vor dem Hochladen erteilen.
							</li>
							<li>
								<strong>Speicherdauer:</strong> Die Fotos werden nur so lange wie nötig verarbeitet,
								um den Bericht zu generieren und Ihnen das Ergebnis anzuzeigen, und werden nicht für
								Trainingszwecke der KI verwendet.
							</li>
						</ul>
					</article>

					{/* --- Section 4: Betroffenenrechte --- */}
					<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
						<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
							4. Ihre Rechte als betroffene Person
						</h2>

						<p className="mt-2">
							Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf:
						</p>
						<ul className="mt-2 list-disc space-y-1 pl-5 text-white">
							<li>
								Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und
								Empfänger und den Zweck der Datenverarbeitung (Art. 15 DSGVO)
							</li>
							<li>
								Berichtigung unrichtiger oder Vervollständigung unvollständiger Daten (Art. 16
								DSGVO)
							</li>
							<li>Löschung Ihrer bei uns gespeicherten Daten (Art. 17 DSGVO)</li>
							<li>Einschränkung der Verarbeitung Ihrer Daten (Art. 18 DSGVO)</li>
							<li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
							<li>
								Widerruf Ihrer erteilten Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3
								DSGVO)
							</li>
							<li>
								Widerspruch gegen die Verarbeitung Ihrer Daten aufgrund berechtigter Interessen
								(Art. 21 DSGVO)
							</li>
						</ul>
						<p className="mt-4">
							Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit unter
							den oben im Abschnitt „Kontakt“ angegebenen Wegen an uns wenden. Ihnen steht des
							Weiteren ein Beschwerderecht bei der zuständigen Datenschutz-Aufsichtsbehörde zu.
						</p>
					</article>
				</div>
			</div>
		</section>
	);
};

export default PrivacyPage;
