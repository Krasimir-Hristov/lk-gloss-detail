import { getTranslations, setRequestLocale } from "next-intl/server";

import { BreadcrumbJsonLd, WebPageJsonLd } from "@/components/shared/JsonLd";
import { getBaseUrl } from "@/constants/site";
import { BookingWizard } from "@/features/booking";
import { routing } from "@/i18n/routing";

import type { Metadata } from "next";

type Params = { locale: string };

export const generateMetadata = async ({
	params,
}: {
	params: Promise<Params>;
}): Promise<Metadata> => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Booking" });
	const baseUrl = getBaseUrl();

	const alternates = Object.fromEntries(
		routing.locales.map((loc) => [loc, `${baseUrl}/${loc}/booking`]),
	);

	return {
		title: t("title"),
		description: t("description"),
		alternates: {
			canonical: `${baseUrl}/${locale}/booking`,
			languages: {
				...alternates,
				"x-default": `${baseUrl}/${routing.defaultLocale}/booking`,
			},
		},
	};
};

const BookingPage = async ({ params }: { params: Promise<Params> }) => {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Booking" });
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
					{ name: pageTitle, url: `${localeUrl}/booking` },
				]}
			/>
			<WebPageJsonLd
				name={`${pageTitle} | LK Gloss & Detail`}
				description={pageDescription}
				url={`${localeUrl}/booking`}
				locale={locale}
			/>
			<section className="min-h-screen bg-[#121212] py-12">
				<BookingWizard />
			</section>
		</>
	);
};

export default BookingPage;
