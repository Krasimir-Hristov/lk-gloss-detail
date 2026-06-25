type JsonLdProps = {
	data: Record<string, unknown>;
};

export const JsonLd = ({ data }: JsonLdProps) => (
	<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
);

export const LocalBusinessJsonLd = () => {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "AutomotiveBusiness",
		name: "LK Gloss & Detail",
		description:
			"Mobile Autopflege & Fahrzeugaufbereitung mit KI-gestützter Analyse. Professionelles Car Detailing in Deutschland.",
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
		serviceType: ["Innenaufbereitung", "Lackkorrektur", "Keramikversiegelung", "Mobile Autopflege"],
		priceRange: "€€",
		openingHours: "Mo-Sa 08:00-18:00",
	};

	return <JsonLd data={jsonLd} />;
};
