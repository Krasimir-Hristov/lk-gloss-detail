import { CalendarCheck, Camera, Cpu } from "lucide-react";
import { useTranslations } from "next-intl";

import { RevealSection } from "@/features/home/components/RevealSection";

const STEPS = [
	{ key: "step1", icon: Camera },
	{ key: "step2", icon: Cpu },
	{ key: "step3", icon: CalendarCheck },
] as const;

export const HowItWorksSection = () => {
	const t = useTranslations("HomePage");

	return (
		<section className="relative overflow-hidden border-y border-white/[0.06] bg-[#050508] px-4 py-16 sm:py-24 md:px-12 md:py-32">
			{/* Ambient center glow */}
			<div className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7b2dff]/10 blur-[140px]" />

			<div className="relative mx-auto max-w-7xl">
				{/* Section Header */}
				<RevealSection className="mb-12 text-center md:mb-16">
					<div className="mb-3 inline-flex items-center gap-2.5">
						<span className="h-px w-8 bg-linear-to-r from-transparent to-[#7b2dff]" />
						<span className="font-mono text-xs font-semibold tracking-[0.22em] text-[#d1bcff] uppercase">
							04
						</span>
						<span className="h-px w-8 bg-linear-to-l from-transparent to-[#7b2dff]" />
					</div>
					<h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] break-words sm:text-4xl md:text-5xl">
						<span className="metallic-text">{t("howItWorks.title")}</span>
					</h2>
				</RevealSection>

				{/* Illuminated 3-Step Concierge Rail */}
				<div className="relative">
					{/* Desktop connecting light-rail */}
					<div className="pointer-events-none absolute top-14 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-[#7b2dff]/20 via-[#c026ff]/70 to-[#7b2dff]/20 md:block" />

					<div className="grid gap-5 md:grid-cols-3 md:gap-7">
						{STEPS.map(({ key, icon: Icon }, index) => {
							const title = t(`howItWorks.${key}`);
							const desc = t(`howItWorks.${key}Desc`);
							const stepNum = String(index + 1).padStart(2, "0");
							const isHighlighted = index === 1;

							return (
								<RevealSection key={key} delay={index * 0.08} className="h-full min-w-0">
									<article
										className={`obsidian-card group relative flex h-full flex-col overflow-hidden rounded-3xl p-5 transition-all duration-400 hover:-translate-y-1 sm:p-8 ${
											isHighlighted
												? "border-[#a855f7]/45 shadow-[0_20px_60px_-20px_rgba(123,45,255,0.4)]"
												: "hover:border-[#a855f7]/45"
										}`}
									>
										{/* Oversized recessed step numeral */}
										<span
											aria-hidden="true"
											className="font-display pointer-events-none absolute -top-2 right-5 text-7xl font-black tracking-tighter text-white/[0.035] transition-colors duration-400 group-hover:text-[#7b2dff]/15"
										>
											{stepNum}
										</span>

										{/* Top row: Icon Medallion + Step Pill */}
										<div className="relative mb-8 flex items-center justify-between">
											<div
												className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 ${
													isHighlighted
														? "border-[#c026ff]/60 bg-linear-to-br from-[#7b2dff] to-[#c026ff] text-white shadow-[0_0_26px_rgba(192,38,255,0.45)]"
														: "border-[#7b2dff]/35 bg-[#7b2dff]/12 text-[#d8b4fe] group-hover:border-[#c026ff]/60 group-hover:bg-[#7b2dff] group-hover:text-white"
												}`}
											>
												<Icon className="h-6 w-6" aria-hidden="true" />
											</div>

											<span
												className={`rounded-full px-3 py-1 font-mono text-xs font-bold tracking-widest ${
													isHighlighted
														? "border border-[#c026ff]/50 bg-[#7b2dff]/25 text-[#f3e8ff]"
														: "border border-white/10 bg-white/[0.04] text-[#b8b2c7]"
												}`}
											>
												{stepNum}
											</span>
										</div>

										<h3 className="font-display text-xl font-bold tracking-tight text-white">
											{title}
										</h3>
										<p className="mt-3 text-sm leading-relaxed text-[#b8b2c7] sm:text-base">
											{desc}
										</p>
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
