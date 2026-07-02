import { Sparkles, ShieldCheck, Lightbulb, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { headlightsCleaning, manWithVacum, mopSege } from "@/assets";

// ── Zod schema for i18n payload validation ──────────────────────────────

const ServiceSchema = z.object({
	title: z.string(),
	subtitle: z.string(),
	features: z.array(z.string()),
});

// ── Service metadata (icon + image, text comes from i18n) ──────────────

const SERVICES = [
	{ key: "interior", icon: Sparkles, image: manWithVacum },
	{ key: "headlights", icon: Lightbulb, image: headlightsCleaning },
	{ key: "paintCorrection", icon: ShieldCheck, image: mopSege },
] as const;

export const ServicesSection = () => {
	const t = useTranslations("HomePage");

	return (
		<section className="px-4 py-20 md:px-16 md:py-28">
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
					{SERVICES.map(({ key, icon: Icon, image }) => {
						const rawService = t.raw(`services.${key}`);
						const service = ServiceSchema.parse(rawService);
						return (
							<div
								key={key}
								className="group flex flex-col overflow-hidden rounded-xl border border-[#353534] bg-[#201f1f] transition-all hover:border-[#7b2dff]/40 hover:shadow-lg hover:shadow-[#7b2dff]/10"
							>
								{/* Image */}
								<div className="relative aspect-16/10 w-full overflow-hidden bg-[#131313]">
									<Image
										src={image}
										alt={service.title}
										fill
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
										className="object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									<div className="absolute inset-0 bg-linear-to-t from-[#201f1f] via-transparent to-transparent" />
									{/* Icon badge */}
									<div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#7b2dff]/30 bg-[#131313]/80 backdrop-blur-sm">
										<Icon className="h-6 w-6 text-[#d1bcff]" />
									</div>
								</div>

								{/* Content */}
								<div className="flex flex-1 flex-col p-6">
									<h3 className="text-lg font-bold text-[#e5e2e1]">{service.title}</h3>
									<p className="mt-1 text-sm text-[#d1bcff]">{service.subtitle}</p>
									<ul className="mt-4 flex-1 space-y-2.5">
										{service.features.map((feature) => (
											<li key={feature} className="flex items-start gap-2.5 text-sm text-[#ccc3d9]">
												<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7b2dff]" />
												{feature}
											</li>
										))}
									</ul>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};
