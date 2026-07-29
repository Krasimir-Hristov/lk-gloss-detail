import { getTranslations, setRequestLocale } from "next-intl/server";

import { BreadcrumbJsonLd, WebPageJsonLd } from "@/components/shared/JsonLd";
import { getBaseUrl } from "@/constants/site";
import { AssessmentWizard } from "@/features/assessment";
import { routing } from "@/i18n/routing";

import type { Metadata } from "next";

type Params = { locale: string };

export const generateMetadata = async ({
	params,
}: {
	params: Promise<Params>;
}): Promise<Metadata> => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Assessment" });
	const baseUrl = getBaseUrl();

	const alternates = Object.fromEntries(
		routing.locales.map((loc) => [loc, `${baseUrl}/${loc}/assessment`]),
	);

	return {
		title: t("title"),
		description:
			locale === "de"
				? "Kostenlose KI-Fahrzeugbewertung & Zustandsschätzung für Ihre Autopflege"
				: locale === "el"
					? "Δωρεάν ανάλυση οχήματος με τεχνητή νοημοσύνη για την περιποίηση του αυτοκινήτου σας"
					: "Free AI vehicle assessment & condition estimate for your car care",
		alternates: {
			languages: {
				...alternates,
				"x-default": `${baseUrl}/de/assessment`,
			},
		},
	};
};

const AssessmentPage = async ({ params }: { params: Promise<Params> }) => {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Assessment" });

	const baseUrl = getBaseUrl();
	const localeUrl = `${baseUrl}/${locale}`;
	const pageTitle = t("title");

	return (
		<>
			<BreadcrumbJsonLd
				items={[
					{ name: "Home", url: localeUrl },
					{ name: pageTitle, url: `${localeUrl}/assessment` },
				]}
			/>
			<WebPageJsonLd
				name={`${pageTitle} | LK Gloss & Detail`}
				description="AI-Powered Vehicle Assessment & Price Calculator"
				url={`${localeUrl}/assessment`}
				locale={locale}
			/>
			<AssessmentWizard />
		</>
	);
};

export default AssessmentPage;
