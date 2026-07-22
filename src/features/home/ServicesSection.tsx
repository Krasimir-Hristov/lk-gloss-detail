import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { getLocalizedText } from "@/features/admin/types/services.types";
import { getIcon } from "@/lib/icon-map";

import type { PublicService } from "@/features/services/actions/get-public-services";

// ── Zod schema for i18n payload validation ──────────────────────────────

type ServicesSectionProps = {
	services: PublicService[];
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({ services }) => {
	const t = useTranslations("HomePage");
	const locale = useLocale();

	// Show all active services
	const displayServices = services;

	return (
		<section id="services" className="px-4 py-20 md:px-16 md:py-28">
			<div className="mx-auto max-w-7xl">
				{/* Section header */}
				<div className="mb-16 text-center">
					<div className="mx-auto mb-4 h-1 w-16 rounded-full bg-linear-to-r from-[#7b2dff] to-[#d8b4fe]" />
					<h2 className="text-3xl font-bold text-[#e5e2e1] md:text-4xl">
						{t("servicesPreview.title")}
					</h2>
					<p className="mt-3 text-lg text-[#ccc3d9]">{t("servicesPreview.description")}</p>
				</div>

				{/* Service cards grid */}
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{displayServices.map((service) => {
						const IconComponent = getIcon(service.icon);
						const serviceName = getLocalizedText(service.name, locale);
						const serviceDesc = getLocalizedText(service.short_description, locale);

						return (
							<article
								key={service.id}
								className="group flex flex-col overflow-hidden rounded-xl border border-[#353534] bg-[#201f1f] transition-all hover:border-[#7b2dff]/40 hover:shadow-lg hover:shadow-[#7b2dff]/10"
							>
								{/* Image */}
								<div className="relative aspect-16/10 w-full overflow-hidden bg-[#131313]">
									{service.image_url ? (
										<Image
											src={service.image_url}
											alt={serviceName}
											fill
											sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
											className="object-cover transition-transform duration-500 group-hover:scale-105"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-[#201f1f]">
											{React.createElement(IconComponent, {
												className: "h-16 w-16 text-[#7b2dff]/30",
											})}
										</div>
									)}
									<div className="absolute inset-0 bg-linear-to-t from-[#201f1f] via-transparent to-transparent" />
									{/* Icon badge */}
									<div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#7b2dff]/30 bg-[#131313]/80 backdrop-blur-sm">
										{React.createElement(IconComponent, { className: "h-6 w-6 text-[#d1bcff]" })}
									</div>
								</div>

								{/* Content */}
								<div className="flex flex-1 flex-col p-6">
									<h3 className="text-lg font-bold text-[#e5e2e1]">{serviceName}</h3>
									<p className="mt-1 text-sm text-[#d1bcff]">{serviceDesc}</p>
									<div className="mt-4 flex-1">
										<p className="text-xs text-[#ccc3d9]">
											{t("servicesPreview.from")} €{service.price_small} • {service.duration_hours}h
										</p>
									</div>
								</div>
							</article>
						);
					})}
				</div>
			</div>
		</section>
	);
};
