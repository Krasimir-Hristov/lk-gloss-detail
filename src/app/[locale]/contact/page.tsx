import { getTranslations, setRequestLocale } from "next-intl/server";
import * as React from "react";

import { BreadcrumbJsonLd, WebPageJsonLd } from "@/components/shared/JsonLd";
import { getBaseUrl } from "@/constants/site";
import { ContactForm, ContactDetailsCard, GoogleMapsEmbed } from "@/features/contact";
import { routing } from "@/i18n/routing";

import type { Metadata } from "next";

type Params = { locale: string };

export const generateMetadata = async ({
	params,
}: {
	params: Promise<Params>;
}): Promise<Metadata> => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Contact" });
	const baseUrl = getBaseUrl();

	const alternates = Object.fromEntries(
		routing.locales.map((loc) => [loc, `${baseUrl}/${loc}/contact`]),
	);

	return {
		title: t("title"),
		description:
			locale === "de"
				? "Kontaktieren Sie LK Gloss & Detail für mobile Autopflege und Anfragen in Neuhausen auf den Fildern"
				: locale === "el"
					? "Επικοινωνήστε με την LK Gloss & Detail για απορίες και υπηρεσίες περιποίησης"
					: "Contact LK Gloss & Detail for mobile car care inquiries in Neuhausen auf den Fildern",
		alternates: {
			languages: {
				...alternates,
				"x-default": `${baseUrl}/de/contact`,
			},
		},
	};
};

const ContactPage = async ({ params }: { params: Promise<Params> }) => {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Contact" });

	const baseUrl = getBaseUrl();
	const localeUrl = `${baseUrl}/${locale}`;
	const pageTitle = t("title");

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: "LK Gloss & Detail",
		url: baseUrl,
		contactPoint: {
			"@type": "ContactPoint",
			contactType: "customer service",
			availableLanguage: ["de", "en", "el"],
		},
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<BreadcrumbJsonLd
				items={[
					{ name: "Home", url: localeUrl },
					{ name: pageTitle, url: `${localeUrl}/contact` },
				]}
			/>
			<WebPageJsonLd
				name={`${pageTitle} | LK Gloss & Detail`}
				description="Contact LK Gloss & Detail Mobile Car Care"
				url={`${localeUrl}/contact`}
				locale={locale}
			/>
			<section className="min-h-screen bg-[#121212] py-16 md:py-24">
				<div className="mx-auto max-w-6xl px-4 md:px-8">
					<div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
						<div>
							<h2 className="mb-6 text-3xl font-bold text-[#e5e2e1]">{t("title")}</h2>
							<ContactForm />
						</div>

						<div className="flex flex-col gap-6">
							<ContactDetailsCard />
							<GoogleMapsEmbed />
						</div>
					</div>
				</div>
			</section>
		</>
	);
};

export default ContactPage;
