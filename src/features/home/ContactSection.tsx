import { ArrowUpRight, Mail, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { BrandLogo } from "@/components/shared/BrandLogo";
import { CONTACT_INFO } from "@/constants/contact";
import { ContactForm } from "@/features/contact";
import { RevealSection } from "@/features/home/components/RevealSection";

export const ContactSection: React.FC = () => {
	const t = useTranslations("Contact");

	return (
		<section
			id="contact"
			className="relative scroll-mt-20 overflow-x-clip border-t border-white/6 bg-[#060609] px-4 py-16 sm:py-24 md:px-12 md:py-32"
		>
			<div className="pointer-events-none absolute top-0 left-1/2 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-[#7b2dff]/60 to-transparent" />
			<div className="pointer-events-none absolute right-0 bottom-16 h-80 w-80 rounded-full bg-[#7b2dff]/10 blur-[130px]" />

			<div className="relative mx-auto max-w-7xl">
				{/* Editorial Section Header */}
				<RevealSection className="mb-12 text-center md:mb-16">
					<div className="mb-3 inline-flex items-center gap-2.5">
						<span className="h-px w-8 bg-linear-to-r from-transparent to-[#7b2dff]" />
						<span className="font-mono text-xs font-semibold tracking-[0.22em] text-[#d1bcff] uppercase">
							06
						</span>
						<span className="h-px w-8 bg-linear-to-l from-transparent to-[#7b2dff]" />
					</div>
					<h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] wrap-break-word sm:text-4xl md:text-5xl">
						<span className="metallic-text">{t("title")}</span>
					</h2>
				</RevealSection>

				<div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-12 lg:gap-8">
					{/* Left: Smoked Glass Contact Form Card (exact ContactForm preserved) */}
					<RevealSection className="min-w-0 lg:col-span-7">
						<div className="obsidian-card relative overflow-hidden rounded-3xl p-5 sm:p-8 md:p-10">
							<div className="pointer-events-none absolute top-0 right-10 left-10 h-px bg-linear-to-r from-transparent via-[#c026ff]/60 to-transparent" />
							<ContactForm />
						</div>
					</RevealSection>

					{/* Right: Atelier Concierge Direct Channels */}
					<RevealSection delay={0.08} className="flex min-w-0 flex-col gap-4 lg:col-span-5">
						{/* Brand Identity Card */}
						<div className="obsidian-card rounded-2xl p-5 sm:p-6">
							<BrandLogo size="lg" />
						</div>

						<a
							href={`tel:${CONTACT_INFO.phoneRaw}`}
							aria-label={`${t("details.phone")}: ${CONTACT_INFO.phone}`}
							className="obsidian-card group flex items-center justify-between gap-3 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#a855f7]/50 hover:shadow-[0_14px_38px_-14px_rgba(123,45,255,0.35)] sm:gap-4 sm:p-5"
						>
							<div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#7b2dff]/35 bg-[#7b2dff]/15 text-[#d8b4fe] transition-colors group-hover:bg-[#7b2dff] group-hover:text-white sm:h-12 sm:w-12">
									<Phone className="h-5 w-5" aria-hidden="true" />
								</div>
								<div className="min-w-0">
									<p className="font-mono text-[11px] font-semibold tracking-wider text-[#9b93ad] uppercase">
										{t("details.phone")}
									</p>
									<p className="font-display mt-0.5 truncate text-sm font-bold text-white sm:text-base">
										{CONTACT_INFO.phone}
									</p>
								</div>
							</div>
							<ArrowUpRight
								className="h-4 w-4 shrink-0 text-[#8c859e] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#d8b4fe]"
								aria-hidden="true"
							/>
						</a>

						<a
							href={`mailto:${CONTACT_INFO.email}`}
							aria-label={`${t("details.email")}: ${CONTACT_INFO.email}`}
							className="obsidian-card group flex items-center justify-between gap-3 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#a855f7]/50 hover:shadow-[0_14px_38px_-14px_rgba(123,45,255,0.35)] sm:gap-4 sm:p-5"
						>
							<div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#7b2dff]/35 bg-[#7b2dff]/15 text-[#d8b4fe] transition-colors group-hover:bg-[#7b2dff] group-hover:text-white sm:h-12 sm:w-12">
									<Mail className="h-5 w-5" aria-hidden="true" />
								</div>
								<div className="min-w-0">
									<p className="font-mono text-[11px] font-semibold tracking-wider text-[#9b93ad] uppercase">
										{t("details.email")}
									</p>
									<p className="font-display mt-0.5 text-xs font-bold break-all text-white min-[390px]:text-sm sm:truncate sm:text-base">
										{CONTACT_INFO.email}
									</p>
								</div>
							</div>
							<ArrowUpRight
								className="h-4 w-4 shrink-0 text-[#8c859e] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#d8b4fe]"
								aria-hidden="true"
							/>
						</a>

						<a
							href={CONTACT_INFO.whatsappUrl}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`${t("details.whatsapp")}: WhatsApp`}
							className="obsidian-card group flex items-center justify-between gap-3 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/45 hover:shadow-[0_14px_38px_-14px_rgba(16,185,129,0.28)] sm:gap-4 sm:p-5"
						>
							<div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-300 transition-colors group-hover:bg-emerald-500 group-hover:text-white sm:h-12 sm:w-12">
									<MessageCircle className="h-5 w-5" aria-hidden="true" />
								</div>
								<div className="min-w-0">
									<p className="font-mono text-[11px] font-semibold tracking-wider text-[#9b93ad] uppercase">
										{t("details.whatsapp")}
									</p>
									<p className="font-display mt-0.5 truncate text-sm font-bold text-white sm:text-base">
										WhatsApp
									</p>
								</div>
							</div>
							<ArrowUpRight
								className="h-4 w-4 shrink-0 text-[#8c859e] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-300"
								aria-hidden="true"
							/>
						</a>
					</RevealSection>
				</div>
			</div>
		</section>
	);
};
