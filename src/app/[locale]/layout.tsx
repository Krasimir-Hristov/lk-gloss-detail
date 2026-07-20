import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Providers } from "@/components/providers";
import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";
import ScrollToTop from "@/components/shared/ScrollToTop";
import { WhatsAppFloatingButton } from "@/components/shared/WhatsAppFloatingButton";
import { ChatbotWidget } from "@/features/chatbot";
import { routing } from "@/i18n/routing";

import type { Metadata } from "next";

import "../globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

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

	const headersList = await headers();
	const pathname = headersList.get("x-pathname") || "";
	const isAdminRoute = /^\/(de|en|el)\/admin(\/|$)/.test(pathname);

	return (
		<html
			lang={locale}
			data-scroll-behavior="smooth"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<head>
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
				/>
			</head>
			<body className="flex min-h-full flex-col bg-[#131313] font-sans text-[#e5e2e1]">
				<Providers>
					<NextIntlClientProvider messages={messages} locale={locale}>
						{isAdminRoute ? (
							<main className="flex min-h-screen flex-1 flex-col">{children}</main>
						) : (
							<>
								<Navbar />
								<main className="flex-1 pt-20">{children}</main>
								<Footer />
								<ScrollToTop />
								<ChatbotWidget />
								<WhatsAppFloatingButton />
								<CookieConsentBanner />
							</>
						)}
					</NextIntlClientProvider>
				</Providers>
			</body>
		</html>
	);
};

export default LocaleLayout;
