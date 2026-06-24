import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

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

export const metadata: Metadata = {
	title: {
		default: "LK Gloss & Detail | Mobile Autopflege",
		template: "%s | LK Gloss & Detail",
	},
	description:
		"Mobile Autopflege & Fahrzeugaufbereitung mit KI-gestützter Analyse. Professional car detailing service in Germany.",
	other: {
		"hreflang-de": "https://lkglossanddetail.de/de",
		"hreflang-en": "https://lkglossanddetail.de/en",
		"hreflang-el": "https://lkglossanddetail.de/el",
		"hreflang-x-default": "https://lkglossanddetail.de/de",
	},
};

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;

	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	setRequestLocale(locale);
	const messages = await getMessages();

	return (
		<html
			lang={locale}
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<head>
				<link rel="alternate" hrefLang="de" href="https://lkglossanddetail.de/de" />
				<link rel="alternate" hrefLang="en" href="https://lkglossanddetail.de/en" />
				<link rel="alternate" hrefLang="el" href="https://lkglossanddetail.de/el" />
				<link rel="alternate" hrefLang="x-default" href="https://lkglossanddetail.de/de" />
			</head>
			<body className="flex min-h-full flex-col bg-[#131313] font-sans text-[#e5e2e1]">
				<NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
			</body>
		</html>
	);
}
