"use client";

import { Wrench, Phone, Mail, ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { CONTACT_INFO } from "@/constants/contact";

export const ServicesFallback: React.FC = () => {
	const t = useTranslations("Errors.servicesUnavailable");

	const handleScrollToContact = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		const contactSection = document.getElementById("contact");
		if (contactSection) {
			contactSection.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<div
			role="alert"
			aria-live="polite"
			className="relative overflow-hidden rounded-2xl border border-[#7b2dff]/30 bg-linear-to-b from-[#201f1f] to-[#161616] p-8 text-center shadow-xl md:p-12"
		>
			{/* Ambient background glow */}
			<div className="pointer-events-none absolute -top-12 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#7b2dff]/10 blur-3xl" />

			<div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#7b2dff]/30 bg-[#7b2dff]/15 text-[#d1bcff]">
					<Wrench className="h-8 w-8" aria-hidden="true" />
				</div>

				<h3 className="text-xl font-bold text-[#e5e2e1] sm:text-2xl">{t("title")}</h3>

				<p className="max-w-lg text-sm leading-relaxed text-[#ccc3d9] sm:text-base">
					{t("description")}
				</p>

				<p className="text-xs font-medium text-[#d1bcff] sm:text-sm">{t("contactCallout")}</p>

				{/* Action options */}
				<div className="mt-2 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
					<a
						href={`tel:${CONTACT_INFO.phoneRaw}`}
						aria-label={`${t("phone")}: ${CONTACT_INFO.phone}`}
						className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7b2dff] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#7b2dff]/25 transition-all hover:bg-[#7b2dff]/90 active:scale-95 sm:w-auto"
					>
						<Phone className="h-4 w-4" aria-hidden="true" />
						<span>
							{t("phone")} ({CONTACT_INFO.phone})
						</span>
					</a>

					<a
						href={`mailto:${CONTACT_INFO.email}`}
						aria-label={`${t("email")}: ${CONTACT_INFO.email}`}
						className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#4a4456] bg-[#2a2830] px-6 py-3.5 text-sm font-semibold text-[#e5e2e1] transition-all hover:border-[#7b2dff]/50 hover:bg-[#32303a] active:scale-95 sm:w-auto"
					>
						<Mail className="h-4 w-4" aria-hidden="true" />
						<span>{t("email")}</span>
					</a>

					<a
						href="#contact"
						onClick={handleScrollToContact}
						aria-label={t("leaveNumber")}
						className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#7b2dff]/40 px-6 py-3.5 text-sm font-semibold text-[#d1bcff] transition-all hover:border-[#7b2dff] hover:bg-[#7b2dff]/10 active:scale-95 sm:w-auto"
					>
						<ArrowDown className="h-4 w-4" aria-hidden="true" />
						<span>{t("leaveNumber")}</span>
					</a>
				</div>
			</div>
		</div>
	);
};
