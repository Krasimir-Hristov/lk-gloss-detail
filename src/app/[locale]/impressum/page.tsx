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
	const t = await getTranslations({ locale, namespace: "Impressum" });

	const alternates = Object.fromEntries(
		routing.locales.map((loc) => [loc, `https://lkglossanddetail.de/${loc}/impressum`]),
	);

	return {
		title: t("title"),
		alternates: {
			languages: {
				...alternates,
				"x-default": "https://lkglossanddetail.de/de/impressum",
			},
		},
	};
};

const ImpressumPage = async ({ params }: { params: Promise<Params> }) => {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Impressum" });

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
						Die Angaben auf dieser Seite enthalten vorübergehend Musterdaten, da die Firma noch in
						Gründung/Registrierung ist. Sobald die Registrierung abgeschlossen ist, müssen diese
						durch die realen Firmendaten ersetzt werden.
					</p>
				</div>

				<div className="space-y-10 text-[#ccc3d9]">
					{/* --- Section 1: Angaben gemäß § 5 TMG --- */}
					<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
						<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
							Angaben gemäß § 5 TMG
						</h2>

						<div className="space-y-4">
							<div>
								<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
									Name des Diensteanbieters / Owner
								</h3>
								<p className="mt-1 text-base text-white">Lulezim Kodhimaj</p>
							</div>

							<div>
								<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
									Anschrift / Address
								</h3>
								{/* 
									TODO: Once the company is officially registered, 
									replace the placeholder address below with the actual business address.
								*/}
								<p className="mt-1 text-base text-white">
									Musterstraße 123
									<br />
									73794 Neuhausen auf den Fildern
									<br />
									Deutschland
								</p>
							</div>
						</div>
					</article>

					{/* --- Section 2: Kontakt --- */}
					<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
						<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
							Kontakt
						</h2>

						<div className="space-y-4">
							<div>
								<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
									Telefon
								</h3>
								{/* 
									TODO: Replace with actual business telephone number if it changes.
								*/}
								<p className="mt-1 text-base text-white">
									<a href="tel:+4915112345678" className="transition-colors hover:text-[#d1bcff]">
										+49 151 12345678
									</a>
								</p>
							</div>

							<div>
								<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
									E-Mail
								</h3>
								<p className="mt-1 text-base text-white">
									<a
										href="mailto:info@lkglossanddetail.de"
										className="transition-colors hover:text-[#d1bcff]"
									>
										info@lkglossanddetail.de
									</a>
								</p>
							</div>
						</div>
					</article>

					{/* --- Section 3: Umsatzsteuer-ID / Steuernummer --- */}
					<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
						<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
							Umsatzsteuer-ID / Steuernummer
						</h2>

						<div>
							<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
								Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz
							</h3>
							{/* 
								TODO: Replace with actual Steuernummer or USt-IdNr. once registered.
								If the business qualifies for the small business regulation (§ 19 UStG), 
								mention that VAT is not charged, e.g.:
								"Umsatzsteuer wird nicht ausgewiesen, da der Diensteanbieter ein Kleinunternehmer im Sinne des § 19 UStG ist."
							*/}
							<p className="mt-1 text-base text-white">Steuernummer: 99/999/99999 (In Gründung)</p>
						</div>
					</article>

					{/* --- Section 4: Berufsbezeichnung --- */}
					<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
						<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
							Berufsbezeichnung & Regelungen
						</h2>

						<div className="space-y-4">
							<div>
								<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
									Berufsbezeichnung
								</h3>
								<p className="mt-1 text-base text-white">
									Autopflege / Fahrzeugaufbereitung (Deutschland)
								</p>
							</div>

							<div>
								<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
									Aufsichtsbehörde
								</h3>
								<p className="mt-1 text-sm">
									Zuständige IHK / Handwerkskammer (wird nach Registrierung eingetragen)
								</p>
							</div>
						</div>
					</article>

					{/* --- Section 5: Streitschlichtung --- */}
					<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
						<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
							Verbraucherstreitbeilegung
						</h2>

						<p className="text-sm leading-relaxed">
							Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
							bereit:{" "}
							<a
								href="https://ec.europa.eu/consumers/odr"
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#d1bcff] underline transition-colors hover:text-white"
							>
								https://ec.europa.eu/consumers/odr
							</a>
							.<br />
							Unsere E-Mail-Adresse finden Sie oben im Impressum.
						</p>
						<p className="mt-4 text-sm leading-relaxed">
							Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
							Verbraucherschlichtungsstelle teilzunehmen.
						</p>
					</article>

					{/* --- Section 6: Haftung & Urheberrecht --- */}
					<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
						<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
							Rechtliche Hinweise
						</h2>

						<div className="space-y-6 text-sm leading-relaxed">
							<div>
								<h3 className="mb-2 font-semibold text-white">Haftung für Inhalte</h3>
								<p>
									Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen
									Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
									als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte
									fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
									rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung
									der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon
									unberührt. Eine diesbezügliche Haftung is jedoch erst ab dem Zeitpunkt der
									Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von
									entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
								</p>
							</div>

							<div>
								<h3 className="mb-2 font-semibold text-white">Haftung für Links</h3>
								<p>
									Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
									keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
									Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
									Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden
									zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
									Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente
									inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte
									einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen
									werden wir derartige Links umgehend entfernen.
								</p>
							</div>

							<div>
								<h3 className="mb-2 font-semibold text-white">Urheberrecht</h3>
								<p>
									Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
									unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
									Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
									bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
									Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen
									Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber
									erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden
									Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine
									Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden
									Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte
									umgehend entfernen.
								</p>
							</div>
						</div>
					</article>
				</div>
			</div>
		</section>
	);
};

export default ImpressumPage;
