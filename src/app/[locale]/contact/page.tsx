import { getTranslations, setRequestLocale } from "next-intl/server";
import * as React from "react";

import { BreadcrumbJsonLd, JsonLd, WebPageJsonLd } from "@/components/shared/JsonLd";
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
		description: t("description"),
		alternates: {
			canonical: `${baseUrl}/${locale}/contact`,
			languages: {
				...alternates,
				"x-default": `${baseUrl}/${routing.defaultLocale}/contact`,
			},
		},
	};
};

const ContactPage = async ({ params }: { params: Promise<Params> }) => {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Contact" });
	const tNav = await getTranslations({ locale, namespace: "Navigation" });

	const baseUrl = getBaseUrl();
	const localeUrl = `${baseUrl}/${locale}`;
	const pageTitle = t("title");
	const pageDescription = t("description");

	const organizationJsonLd = {
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
			<JsonLd data={organizationJsonLd} />
			<BreadcrumbJsonLd
				items={[
					{ name: tNav("home"), url: localeUrl },
					{ name: pageTitle, url: `${localeUrl}/contact` },
				]}
			/>
			<WebPageJsonLd
				name={`${pageTitle} | LK Gloss & Detail`}
				description={pageDescription}
				url={`${localeUrl}/contact`}
				locale={locale}
			/>
			<section className="min-h-screen bg-[#121212] py-16 md:py-24">
				<div className="mx-auto max-w-6xl px-4 md:px-8">
					<div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
						<div>
							<h2 className="mb-6 text-3xl font-bold text-[#e5e2e1]">{pageTitle}</h2>
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
