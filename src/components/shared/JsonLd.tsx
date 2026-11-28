import { CONTACT_INFO } from "@/constants/contact";
import { getBaseUrl } from "@/constants/site";
import { resolveAppLocale, type AppLocale } from "@/i18n/locales";

const safeJsonLd = (data: Record<string, unknown>): string => {
	return JSON.stringify(data).replace(/<\/script>/gi, "<\\/script>");
};

type JsonLdProps = {
	data: Record<string, unknown>;
};

export const JsonLd = ({ data }: JsonLdProps) => (
	<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />
);

type LocalBusinessJsonLdProps = {
	locale: string;
};

export const LocalBusinessJsonLd = ({ locale }: LocalBusinessJsonLdProps) => {
	const baseUrl = getBaseUrl();
	const resolvedLocale = resolveAppLocale(locale);

	const names: Record<AppLocale, string> = {
		de: "LK Gloss & Detail",
		en: "LK Gloss & Detail",
		el: "LK Gloss & Detail",
		sq: "LK Gloss & Detail",
		tr: "LK Gloss & Detail",
	};

	const descriptions: Record<AppLocale, string> = {
		de: "Mobile Autopflege & Fahrzeugaufbereitung mit KI-gestützter Analyse. Professionelles Car Detailing in Deutschland.",
		en: "Mobile car care & vehicle detailing with AI-powered analysis. Professional car detailing service in Germany.",
		el: "Κινητή περιποίηση αυτοκινήτου με ανάλυση AI. Επαγγελματική υπηρεσία detailing στην Γερμανία.",
		sq: "Përkujdesje mobile për automjete & detailing me analizë AI. Shërbim profesional detailing në Gjermani.",
		tr: "Yapay zeka destekli analiz ile mobil araç bakımı ve detaylı temizlik. Almanya'da profesyonel araç detailing hizmeti.",
	};

	const serviceTypes: Record<AppLocale, string[]> = {
		de: ["Innenaufbereitung", "Lackkorrektur", "Keramikversiegelung", "Mobile Autopflege"],
		en: ["Interior Detailing", "Paint Correction", "Ceramic Coating", "Mobile Service"],
		el: ["Εσωτερική Περιποίηση", "Διόρθωση Βαφής", "Κεραμική Επικάλυψη", "Κινητή Υπηρεσία"],
		sq: ["Pastrim i Brendshëm", "Korrigjim i Bojësimit", "Veshje Qeramike", "Shërbim Mobil"],
		tr: ["İç Detaylı Temizlik", "Boya Düzeltme", "Seramik Kaplama", "Mobil Hizmet"],
	};

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "AutomotiveBusiness",
		name: names[resolvedLocale],
		description: descriptions[resolvedLocale],
		url: baseUrl,
		telephone: CONTACT_INFO.phone,
		email: CONTACT_INFO.email,
		address: {
			"@type": "PostalAddress",
			addressLocality: "Neuhausen auf den Fildern",
			addressRegion: "Baden-Württemberg",
			addressCountry: "DE",
		},
		geo: {
			"@type": "GeoCoordinates",
			latitude: "48.6694",
			longitude: "9.1386",
		},
		areaServed: {
			"@type": "Country",
			name: "Germany",
		},
		serviceType: serviceTypes[resolvedLocale],
		priceRange: "€€",
		openingHours: "Mo-Sa 08:00-18:00",
		inLanguage: resolvedLocale,
	};

	return <JsonLd data={jsonLd} />;
};

type BreadcrumbItem = {
	name: string;
	url: string;
};

type BreadcrumbJsonLdProps = {
	items: BreadcrumbItem[];
};

export const BreadcrumbJsonLd = ({ items }: BreadcrumbJsonLdProps) => {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: item.url,
		})),
	};

	return <JsonLd data={jsonLd} />;
};

type WebPageJsonLdProps = {
	name: string;
	description: string;
	url: string;
	locale: string;
};

export const WebPageJsonLd = ({ name, description, url, locale }: WebPageJsonLdProps) => {
	const baseUrl = getBaseUrl();

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		name,
		description,
		url,
		inLanguage: locale,
		publisher: {
			"@type": "Organization",
			name: "LK Gloss & Detail",
			url: baseUrl,
		},
	};

	return <JsonLd data={jsonLd} />;
};
