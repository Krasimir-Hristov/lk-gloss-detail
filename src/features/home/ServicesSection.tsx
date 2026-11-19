import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { getLocalizedText } from "@/features/admin/types/servicesTypes";
import { RevealSection } from "@/features/home/components/RevealSection";
import { ServicesFallback } from "@/features/home/components/ServicesFallback";
import { getIcon } from "@/lib/iconMap";

import type { PublicService } from "@/features/services/actions/getPublicServices";

type ServicesSectionProps = {
	services: PublicService[];
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({ services }) => {
	const t = useTranslations("HomePage");
	const locale = useLocale();

	const displayServices = services;
	const hasServices = displayServices && displayServices.length > 0;

	return (
		<section
			id="services"
			className="relative scroll-mt-20 border-t border-white/[0.06] bg-[#08080c] px-4 py-16 sm:py-24 md:px-12 md:py-32"
		>
			{/* Ambient subtle glow */}
			<div className="pointer-events-none absolute top-0 left-1/2 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-[#7b2dff]/60 to-transparent" />
			<div className="pointer-events-none absolute top-24 right-0 h-80 w-80 rounded-full bg-[#7b2dff]/8 blur-[120px]" />

			<div className="relative mx-auto max-w-7xl">
				{/* Editorial Section Header */}
				<RevealSection className="mb-12 flex flex-col items-start justify-between gap-5 md:mb-16 md:flex-row md:items-end">
					<div className="space-y-3">
						<div className="inline-flex items-center gap-2.5">
							<span className="h-px w-8 bg-linear-to-r from-[#7b2dff] to-[#d8b4fe]" />
							<span className="font-mono text-xs font-semibold tracking-[0.22em] text-[#d1bcff] uppercase">
								01
							</span>
						</div>
						<h2 className="font-display text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl md:text-5xl">
							<span className="metallic-text">{t("servicesPreview.title")}</span>
						</h2>
					</div>
					<p className="max-w-md text-base leading-relaxed text-[#b8b2c7] sm:text-lg md:text-right">
						{t("servicesPreview.description")}
					</p>
				</RevealSection>

				{!hasServices ? (
					<ServicesFallback />
				) : (
					/* Atelier Service Cards Grid */
					<div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
						{displayServices.map((service, index) => {
							const IconComponent = getIcon(service.icon);
							const serviceName = getLocalizedText(service.name, locale);
							const serviceDesc = getLocalizedText(service.short_description, locale);
							const cardNumber = String(index + 1).padStart(2, "0");

							return (
								<RevealSection key={service.id} delay={Math.min(index * 0.06, 0.24)}>
									<article className="obsidian-card group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1.5 hover:border-[#a855f7]/50 hover:shadow-[0_24px_60px_-20px_rgba(123,45,255,0.35)]">
										{/* Hover top specular edge */}
										<div className="pointer-events-none absolute top-0 right-6 left-6 z-10 h-px bg-linear-to-r from-transparent via-[#c026ff]/80 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

										{/* Image */}
										<div className="relative aspect-16/10 w-full overflow-hidden bg-[#0e0e14]">
											{service.image_url ? (
												<ImageWithFallback
													src={service.image_url}
													alt={serviceName}
													fill
													sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
													className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
												/>
											) : (
												<div className="carbon-pattern flex h-full w-full items-center justify-center bg-[#12111a]">
													{React.createElement(IconComponent, {
														className: "h-16 w-16 text-[#7b2dff]/35",
													})}
												</div>
											)}

											{/* Scrim */}
											<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0d0d13] via-[#0d0d13]/25 to-transparent" />

											{/* Monospace index tag */}
											<span className="absolute top-3.5 right-3.5 rounded-full border border-white/12 bg-black/65 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-[#d8b4fe] backdrop-blur-md">
												{cardNumber}
											</span>

											{/* Frosted Icon Medallion */}
											<div className="absolute bottom-3.5 left-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#7b2dff]/40 bg-[#0d0d13]/85 text-[#d1bcff] shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 group-hover:border-[#c026ff]/70 group-hover:bg-[#7b2dff] group-hover:text-white">
												{React.createElement(IconComponent, {
													className: "h-5 w-5",
													"aria-hidden": true,
												})}
											</div>
										</div>

										{/* Content */}
										<div className="flex flex-1 flex-col p-6">
											<h3 className="font-display text-lg font-bold tracking-tight text-white transition-colors group-hover:text-[#e9d5ff]">
												{serviceName}
											</h3>
											<p className="mt-2.5 flex-1 text-sm leading-relaxed text-[#b8b2c7]">
												{serviceDesc}
											</p>

											{/* Telemetry Price & Duration Footer */}
											<div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
												<div className="flex items-baseline gap-1.5">
													<span className="font-mono text-[11px] tracking-wider text-[#9b93ad] uppercase">
														{t("servicesPreview.from")}
													</span>
													<span className="font-display text-xl font-extrabold text-white">
														€{service.price_small}
													</span>
												</div>
												<div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-[#d1bcff]">
													<Clock className="h-3.5 w-3.5 text-[#a855f7]" aria-hidden="true" />
													<span>{service.duration_hours}h</span>
												</div>
											</div>
										</div>
									</article>
								</RevealSection>
							);
						})}
					</div>
				)}
			</div>
		</section>
	);
};
