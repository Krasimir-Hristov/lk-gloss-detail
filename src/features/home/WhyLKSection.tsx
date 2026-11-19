import { Award, BrainCircuit, Truck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { paintGlossMacro } from "@/assets";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { RevealSection } from "@/features/home/components/RevealSection";

const USP_ICONS = [
	{ key: "mobile", icon: Truck },
	{ key: "professional", icon: Award },
	{ key: "aiPowered", icon: BrainCircuit },
] as const;

export const WhyLKSection = () => {
	const t = useTranslations("HomePage");

	return (
		<section className="relative overflow-hidden border-t border-white/[0.06] bg-[#07070a] px-4 py-16 sm:py-24 md:px-12 md:py-32">
			<div className="pointer-events-none absolute top-1/2 -left-24 h-80 w-80 -translate-y-1/2 rounded-full bg-[#7b2dff]/10 blur-[130px]" />

			<div className="relative mx-auto max-w-7xl">
				{/* Section Header */}
				<RevealSection className="mb-12 space-y-3 md:mb-16">
					<div className="inline-flex items-center gap-2.5">
						<span className="h-px w-8 bg-linear-to-r from-[#7b2dff] to-[#d8b4fe]" />
						<span className="font-mono text-xs font-semibold tracking-[0.22em] text-[#d1bcff] uppercase">
							03
						</span>
					</div>
					<h2 className="font-display text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl md:text-5xl">
						<span className="metallic-text">{t("whyLK.title")}</span>
					</h2>
				</RevealSection>

				{/* Asymmetric 5/7 Manifesto Split */}
				<div className="grid items-stretch gap-6 lg:grid-cols-12 lg:gap-7">
					{/* Left: Macro Hydrophobic Paint Showcase */}
					<RevealSection className="lg:col-span-5">
						<div className="obsidian-card group relative h-full min-h-[300px] overflow-hidden rounded-3xl sm:min-h-[380px]">
							<Image
								src={paintGlossMacro}
								alt={t("whyLK.title")}
								placeholder="blur"
								fill
								sizes="(max-width: 1024px) 100vw, 42vw"
								className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
							/>
							<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#07070a]/90 via-[#07070a]/20 to-transparent" />

							<div className="absolute right-5 bottom-5 left-5">
								<div className="glass-panel inline-flex items-center rounded-2xl px-4 py-3">
									<BrandLogo size="sm" />
								</div>
							</div>
						</div>
					</RevealSection>

					{/* Right: 3 Sculpted Obsidian Manifesto Pillars */}
					<div className="flex flex-col justify-between gap-4 sm:gap-5 lg:col-span-7">
						{USP_ICONS.map(({ key, icon: Icon }, index) => {
							const title = t(`whyLK.${key}`);
							const desc = t(`whyLK.${key}Desc`);
							const num = String(index + 1).padStart(2, "0");

							return (
								<RevealSection key={key} delay={index * 0.07}>
									<article className="obsidian-card group relative flex items-start gap-5 overflow-hidden rounded-2xl p-6 transition-all duration-400 hover:-translate-y-0.5 hover:border-[#a855f7]/50 hover:shadow-[0_18px_45px_-16px_rgba(123,45,255,0.3)] sm:p-7">
										<div className="pointer-events-none absolute top-0 right-8 left-8 h-px bg-linear-to-r from-transparent via-[#c026ff]/70 to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100" />

										<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#7b2dff]/35 bg-[#7b2dff]/12 text-[#d8b4fe] transition-all duration-300 group-hover:border-[#c026ff]/70 group-hover:bg-[#7b2dff] group-hover:text-white group-hover:shadow-[0_0_24px_rgba(123,45,255,0.45)]">
											<Icon className="h-6 w-6" aria-hidden="true" />
										</div>

										<div className="min-w-0 flex-1 space-y-2">
											<div className="flex items-center justify-between gap-3">
												<h3 className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
													{title}
												</h3>
												<span className="font-mono text-xs font-bold tracking-widest text-white/25 transition-colors group-hover:text-[#d8b4fe]">
													{num}
												</span>
											</div>
											<p className="text-sm leading-relaxed text-[#b8b2c7] sm:text-base">{desc}</p>
										</div>
									</article>
								</RevealSection>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
};
