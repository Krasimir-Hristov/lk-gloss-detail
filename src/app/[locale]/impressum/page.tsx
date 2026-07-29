import { getTranslations, setRequestLocale } from "next-intl/server";
import * as React from "react";

import { BreadcrumbJsonLd, WebPageJsonLd } from "@/components/shared/JsonLd";
import { CONTACT_INFO } from "@/constants/contact";
import { getBaseUrl } from "@/constants/site";
import { routing } from "@/i18n/routing";

import type { Metadata } from "next";

export const revalidate = 86400;

type Params = { locale: string };

export const generateMetadata = async ({
	params,
}: {
	params: Promise<Params>;
}): Promise<Metadata> => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Impressum" });
	const baseUrl = getBaseUrl();

	const alternates = Object.fromEntries(
		routing.locales.map((loc) => [loc, `${baseUrl}/${loc}/impressum`]),
	);

	return {
		title: t("title"),
		description: t("description"),
		alternates: {
			canonical: `${baseUrl}/${locale}/impressum`,
			languages: {
				...alternates,
				"x-default": `${baseUrl}/${routing.defaultLocale}/impressum`,
			},
		},
	};
};

const ImpressumPage = async ({ params }: { params: Promise<Params> }) => {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Impressum" });
	const tNav = await getTranslations({ locale, namespace: "Navigation" });

	const baseUrl = getBaseUrl();
	const localeUrl = `${baseUrl}/${locale}`;
	const pageTitle = t("title");
	const pageDescription = t("description");

	return (
		<>
			<BreadcrumbJsonLd
				items={[
					{ name: tNav("home"), url: localeUrl },
					{ name: pageTitle, url: `${localeUrl}/impressum` },
				]}
			/>
			<WebPageJsonLd
				name={`${pageTitle} | LK Gloss & Detail`}
				description={pageDescription}
				url={`${localeUrl}/impressum`}
				locale={locale}
			/>
			<section className="min-h-screen bg-[#121212] py-16 md:py-24">
				<div className="mx-auto max-w-4xl px-4 md:px-8">
					<h1 className="mb-8 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
						{t("title")}
					</h1>

					{/* Warning Banner explaining placeholder data */}
					<div className="mb-10 border-l-4 border-[#7b2dff] bg-[#1a1528] p-4 text-[#ccc3d9] shadow-sm">
						<p className="text-sm font-semibold text-[#d1bcff]">{t("noticeTitle")}</p>
						<p className="mt-1 text-xs">{t("noticeText")}</p>
					</div>

					<div className="space-y-10 text-[#ccc3d9]">
						{/* --- Section 1: Angaben gemäß § 5 TMG --- */}
						<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
							<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
								{t("tmgTitle")}
							</h2>

							<div className="space-y-4">
								<div>
									<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
										{t("ownerTitle")}
									</h3>
									<p className="mt-1 text-base text-white">Lulezim Kodhimaj</p>
								</div>

								<div>
									<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
										{t("addressTitle")}
									</h3>
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
								{t("contactTitle")}
							</h2>

							<div className="space-y-4">
								<div>
									<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
										{t("phoneTitle")}
									</h3>
									<p className="mt-1 text-base text-white">
										<a
											href={`tel:${CONTACT_INFO.phoneRaw}`}
											className="transition-colors hover:text-[#d1bcff]"
										>
											{CONTACT_INFO.phone}
										</a>
									</p>
								</div>

								<div>
									<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
										{t("emailTitle")}
									</h3>
									<p className="mt-1 text-base text-white">
										<a
											href={`mailto:${CONTACT_INFO.email}`}
											className="transition-colors hover:text-[#d1bcff]"
										>
											{CONTACT_INFO.email}
										</a>
									</p>
								</div>
							</div>
						</article>

						{/* --- Section 3: Umsatzsteuer-ID / Steuernummer --- */}
						<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
							<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
								{t("taxTitle")}
							</h2>

							<div>
								<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
									{t("taxSub")}
								</h3>
								<p className="mt-1 text-base text-white">
									Steuernummer: 99/999/99999 (In Gründung)
								</p>
							</div>
						</article>

						{/* --- Section 4: Berufsbezeichnung --- */}
						<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
							<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
								{t("professionTitle")}
							</h2>

							<div className="space-y-4">
								<div>
									<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
										{t("professionTitle")}
									</h3>
									<p className="mt-1 text-base text-white">{t("profession")}</p>
								</div>

								<div>
									<h3 className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
										Aufsichtsbehörde
									</h3>
									<p className="mt-1 text-sm">{t("authority")}</p>
								</div>
							</div>
						</article>

						{/* --- Section 5: Streitschlichtung --- */}
						<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
							<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
								{t("disputeTitle")}
							</h2>

							<p className="text-sm leading-relaxed">
								{t("disputeText")}{" "}
								<a
									href="https://ec.europa.eu/consumers/odr"
									target="_blank"
									rel="noopener noreferrer"
									className="text-[#d1bcff] underline transition-colors hover:text-white"
								>
									https://ec.europa.eu/consumers/odr
								</a>
							</p>
							<p className="mt-4 text-sm leading-relaxed">{t("disputeNotice")}</p>
						</article>

						{/* --- Section 6: Haftung & Urheberrecht --- */}
						<article className="rounded-2xl border border-[#4a4456] bg-[#1a1a2e] p-6 shadow-md md:p-8">
							<h2 className="mb-4 border-b border-[#4a4456] pb-2 text-xl font-bold text-white">
								{t("legalTitle")}
							</h2>

							<div className="space-y-6 text-sm leading-relaxed">
								<div>
									<h3 className="mb-2 font-semibold text-white">{t("liabilityContentTitle")}</h3>
									<p>{t("liabilityContentText")}</p>
								</div>

								<div>
									<h3 className="mb-2 font-semibold text-white">{t("liabilityLinksTitle")}</h3>
									<p>{t("liabilityLinksText")}</p>
								</div>

								<div>
									<h3 className="mb-2 font-semibold text-white">{t("copyrightTitle")}</h3>
									<p>{t("copyrightText")}</p>
								</div>
							</div>
						</article>
					</div>
				</div>
			</section>
		</>
	);
};

export default ImpressumPage;
