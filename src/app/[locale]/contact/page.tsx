import { getTranslations, setRequestLocale } from "next-intl/server";
import * as React from "react";

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

	const alternates = Object.fromEntries(
		routing.locales.map((loc) => [loc, `https://lkglossanddetail.de/${loc}/contact`]),
	);

	return {
		title: t("title"),
		alternates: {
			languages: {
				...alternates,
				"x-default": "https://lkglossanddetail.de/de/contact",
			},
		},
	};
};

const ContactPage = async ({ params }: { params: Promise<Params> }) => {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Contact" });

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: "LK Gloss & Detail",
		url: "https://lkglossanddetail.de",
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
