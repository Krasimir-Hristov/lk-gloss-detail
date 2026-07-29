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
		description:
			locale === "de"
				? "Buchen Sie jetzt Ihren mobilen Autopflege-Termin online bei LK Gloss & Detail"
				: locale === "el"
					? "Κάντε κράτηση για την περιποίηση του αυτοκινήτου σας online"
					: "Book your mobile car detailing appointment online with LK Gloss & Detail",
		alternates: {
			languages: {
				...alternates,
				"x-default": `${baseUrl}/de/booking`,
			},
		},
	};
};

const BookingPage = async ({ params }: { params: Promise<Params> }) => {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Booking" });

	const baseUrl = getBaseUrl();
	const localeUrl = `${baseUrl}/${locale}`;
	const pageTitle = t("title");

	return (
		<>
			<BreadcrumbJsonLd
				items={[
					{ name: "Home", url: localeUrl },
					{ name: pageTitle, url: `${localeUrl}/booking` },
				]}
			/>
			<WebPageJsonLd
				name={`${pageTitle} | LK Gloss & Detail`}
				description="Online Mobile Car Detailing Booking System"
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
