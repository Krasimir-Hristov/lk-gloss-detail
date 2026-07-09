import { getTranslations, setRequestLocale } from "next-intl/server";

import { BookingWizard } from "@/features/booking";

import type { Metadata } from "next";

type Params = { locale: string };

export const generateMetadata = async ({ params }: { params: Params }): Promise<Metadata> => {
	const t = await getTranslations({ locale: params.locale, namespace: "Booking" });

	return {
		title: t("title"),
	};
};

const BookingPage = async ({ params }: { params: Promise<Params> }) => {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<section className="min-h-screen bg-[#121212] py-12">
			<BookingWizard />
		</section>
	);
};

export default BookingPage;
