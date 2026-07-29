import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => {
	return {
		name: "LK Gloss & Detail — Mobile Autopflege",
		short_name: "LK Detailing",
		description:
			"Mobile Autopflege & Detailing mit KI-gestützter Analyse | Neuhausen auf den Fildern",
		start_url: "/",
		display: "standalone",
		background_color: "#131313",
		theme_color: "#7b2dff",
		icons: [
			{
				src: "/favicon.ico",
				sizes: "any",
				type: "image/x-icon",
			},
			{
				src: "/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
};

export default manifest;
