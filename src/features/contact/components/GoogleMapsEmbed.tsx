"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

export const GoogleMapsEmbed: React.FC = () => {
	const t = useTranslations("Contact");

	return (
		<div className="overflow-hidden rounded-2xl border border-[#4a4456] bg-[#1a1a2e]">
			<div className="border-b border-[#4a4456] p-4">
				<h3 className="text-sm font-semibold text-white">{t("mapTitle")}</h3>
			</div>
			<iframe
				title="LK Gloss & Detail Standort"
				src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2633.751055555!2d9.283!3d48.683!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDjCsDQwJzU4LjgiTiA5wrAxNic1OC44IkU!5e0!3m2!1sde!2sde!4v1700000000000"
				width="100%"
				height="300"
				style={{ border: 0 }}
				sandbox="allow-scripts allow-same-origin allow-popups"
				allowFullScreen
				loading="lazy"
				referrerPolicy="no-referrer-when-downgrade"
				className="w-full"
			/>
		</div>
	);
};
