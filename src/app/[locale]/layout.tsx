import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ScrollToTop from "@/components/shared/ScrollToTop";
import { ChatbotWidget } from "@/features/chatbot";
import { routing } from "@/i18n/routing";

import type { Metadata } from "next";

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export const generateMetadata = async ({ params }: Omit<Props, "children">): Promise<Metadata> => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Metadata" });

	return {
		title: {
			default: t("title"),
			template: t("template"),
		},
		description: t("description"),
		alternates: {
			languages: {
				de: "https://lkglossanddetail.de/de",
				en: "https://lkglossanddetail.de/en",
				el: "https://lkglossanddetail.de/el",
				"x-default": "https://lkglossanddetail.de/de",
			},
		},
	};
};

const LocaleLayout = async ({ children, params }: Props) => {
	const { locale } = await params;

	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	setRequestLocale(locale);
	const messages = await getMessages();

	return (
		<NextIntlClientProvider messages={messages}>
			<Navbar />
			<main className="flex-1 pt-20">{children}</main>
			<Footer />
			<ScrollToTop />
			<ChatbotWidget />
		</NextIntlClientProvider>
	);
};

export default LocaleLayout;
