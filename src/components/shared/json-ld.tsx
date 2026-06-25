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
	const names: Record<string, string> = {
		de: "LK Gloss & Detail",
		en: "LK Gloss & Detail",
		el: "LK Gloss & Detail",
	};

	const descriptions: Record<string, string> = {
		de: "Mobile Autopflege & Fahrzeugaufbereitung mit KI-gestützter Analyse. Professionelles Car Detailing in Deutschland.",
		en: "Mobile car care & vehicle detailing with AI-powered analysis. Professional car detailing service in Germany.",
		el: "Κινητή περιποίηση αυτοκινήτου με ανάλυση AI. Επαγγελματική υπηρεσία detailing στην Γερμανία.",
	};

	const serviceTypes: Record<string, string[]> = {
		de: ["Innenaufbereitung", "Lackkorrektur", "Keramikversiegelung", "Mobile Autopflege"],
		en: ["Interior Detailing", "Paint Correction", "Ceramic Coating", "Mobile Service"],
		el: ["Εσωτερική Περιποίηση", "Διόρθωση Βαφής", "Κεραμική Επικάλυψη", "Κινητή Υπηρεσία"],
	};

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "AutomotiveBusiness",
		name: names[locale] ?? names.de,
		description: descriptions[locale] ?? descriptions.de,
		url: "https://lkglossanddetail.de",
		telephone: "+49",
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
		serviceType: serviceTypes[locale] ?? serviceTypes.de,
		priceRange: "€€",
		openingHours: "Mo-Sa 08:00-18:00",
		inLanguage: locale,
	};

	return <JsonLd data={jsonLd} />;
};
