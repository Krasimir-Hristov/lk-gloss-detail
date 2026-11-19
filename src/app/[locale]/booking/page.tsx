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
			<section className="relative min-h-screen overflow-x-clip bg-[#07070a] pt-8 pb-20 sm:pt-12 md:pt-14 md:pb-28">
				{/* Atelier Grid & Rim-Lit Studio Ambient Glows */}
				<div className="atelier-grid pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_top,black_25%,transparent_80%)] opacity-55" />
				<div className="pointer-events-none absolute -top-32 -left-24 h-112 w-112 rounded-full bg-[#7b2dff]/16 blur-[140px]" />
				<div className="pointer-events-none absolute top-1/3 -right-32 h-128 w-128 rounded-full bg-[#c026ff]/11 blur-[150px]" />

				<BookingWizard />
			</section>
		</>
	);
};

export default BookingPage;
