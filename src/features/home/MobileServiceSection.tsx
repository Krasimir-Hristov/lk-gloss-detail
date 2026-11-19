import { CalendarClock, MapPin, ThumbsUp, Truck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { mobileBioDetailing } from "@/assets";
import { RevealSection } from "@/features/home/components/RevealSection";

const MobileFeatureSchema = z.object({
	title: z.string(),
	desc: z.string(),
});

const MOBILE_FEATURE_ICONS = [
	{ key: "onSite", icon: MapPin },
	{ key: "valueIncrease", icon: ThumbsUp },
	{ key: "noAppointment", icon: CalendarClock },
	{ key: "noStress", icon: Truck },
] as const;

export const MobileServiceSection = () => {
	const t = useTranslations("HomePage");

	return (
		<section className="relative overflow-hidden border-t border-white/[0.06] bg-[#060609] px-4 py-16 sm:py-24 md:px-12 md:py-28">
			{/* Ambient spotlight */}
			<div className="pointer-events-none absolute top-1/2 left-1/4 h-96 w-96 -translate-y-1/2 rounded-full bg-[#7b2dff]/12 blur-[140px]" />

			<div className="relative mx-auto max-w-7xl">
				{/* Editorial Split Header */}
				<RevealSection className="mb-10 flex flex-col items-start justify-between gap-5 md:mb-14 md:flex-row md:items-end">
					<div className="min-w-0 space-y-3">
						<div className="inline-flex items-center gap-2.5">
							<span className="h-px w-8 bg-linear-to-r from-[#7b2dff] to-[#d8b4fe]" />
							<span className="font-mono text-xs font-semibold tracking-[0.22em] text-[#d1bcff] uppercase">
								02
							</span>
						</div>
						<h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] break-words sm:text-4xl md:text-5xl">
							<span className="metallic-text">{t("mobileService.title")}</span>
						</h2>
					</div>
					<p className="max-w-xl text-base leading-relaxed text-[#b8b2c7] sm:text-lg md:text-right">
						{t("mobileService.description")}
					</p>
				</RevealSection>

				{/* Tight, Balanced 12-Column Bento Row */}
				<div className="grid items-stretch gap-5 lg:grid-cols-12 lg:gap-6">
					{/* Left: Framed Editorial Photography (6 cols) */}
					<RevealSection className="min-w-0 lg:col-span-6">
						<div className="obsidian-card group relative h-full min-h-[240px] overflow-hidden rounded-3xl sm:min-h-[340px]">
							<Image
								src={mobileBioDetailing}
								alt={t("mobileService.title")}
								placeholder="blur"
								fill
								sizes="(max-width: 1024px) 100vw, 50vw"
								className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
							/>
							<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#07070a]/70 via-transparent to-transparent" />
						</div>
					</RevealSection>

					{/* Right: Compact 2x2 Obsidian Bento Tiles (6 cols — zero hollow void) */}
					<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-6">
						{MOBILE_FEATURE_ICONS.map(({ key, icon: Icon }, index) => {
							const rawFeature = t.raw(`mobileService.features.${key}`);
							const feature = MobileFeatureSchema.parse(rawFeature);
							const tileIndex = String(index + 1).padStart(2, "0");

							return (
								<RevealSection key={key} delay={index * 0.06} className="h-full">
									<div className="obsidian-card group relative flex h-full flex-col justify-center gap-4 overflow-hidden rounded-2xl p-5 transition-all duration-400 hover:-translate-y-1 hover:border-[#a855f7]/50 hover:shadow-[0_18px_45px_-16px_rgba(123,45,255,0.3)] sm:p-6">
										{/* Top subtle corner glow */}
										<div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-[#7b2dff]/12 blur-2xl transition-opacity duration-300 group-hover:bg-[#c026ff]/20" />

										<div className="flex items-center justify-between">
											<div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#7b2dff]/35 bg-[#7b2dff]/12 text-[#d8b4fe] transition-all duration-300 group-hover:border-[#c026ff]/60 group-hover:bg-[#7b2dff] group-hover:text-white">
												<Icon className="h-5 w-5" aria-hidden="true" />
											</div>
											<span className="font-mono text-[11px] font-semibold tracking-widest text-white/25 transition-colors group-hover:text-[#d8b4fe]">
												{tileIndex}
											</span>
										</div>

										<div className="space-y-1.5">
											<h3 className="font-display text-base font-bold text-white sm:text-lg">
												{feature.title}
											</h3>
											<p className="text-sm leading-relaxed text-[#b8b2c7]">{feature.desc}</p>
										</div>
									</div>
								</RevealSection>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
};
