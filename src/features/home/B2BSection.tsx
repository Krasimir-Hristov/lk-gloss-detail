import { ArrowRight, Building2, Handshake, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { b2bLuxuryFleet } from "@/assets";
import { RevealSection } from "@/features/home/components/RevealSection";

type B2BSectionProps = {
	locale: string;
};

const B2B_FEATURE_ICONS = [
	{ key: "fleet", icon: Building2 },
	{ key: "contracts", icon: Handshake },
	{ key: "priority", icon: Zap },
] as const;

export const B2BSection = ({ locale }: B2BSectionProps) => {
	const t = useTranslations("HomePage");

	return (
		<section className="relative overflow-hidden bg-[#07070a] px-4 py-16 sm:py-24 md:px-12 md:py-32">
			<div className="pointer-events-none absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7b2dff]/10 blur-[140px]" />

			<div className="relative mx-auto max-w-7xl">
				<RevealSection>
					<div className="obsidian-card overflow-hidden rounded-3xl">
						{/* Cinematic Architectural Fleet Visual Header */}
						<div className="group relative flex min-h-65 w-full flex-col justify-end overflow-hidden sm:aspect-21/9 sm:min-h-75">
							<Image
								src={b2bLuxuryFleet}
								alt={t("b2b.title")}
								placeholder="blur"
								fill
								sizes="(max-width: 1280px) 100vw, 1280px"
								className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
							/>
							<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0d0d13] via-[#0d0d13]/60 to-black/30" />

							{/* Overlay Header */}
							<div className="relative z-10 p-5 pt-20 sm:p-10 sm:pt-10">
								<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/65 px-3 py-1 backdrop-blur-md sm:px-3.5 sm:py-1.5">
									<Building2 className="h-3.5 w-3.5 text-[#d8b4fe]" aria-hidden="true" />
									<span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#e5d4ff] uppercase sm:text-[11px] sm:tracking-[0.2em]">
										05 · B2B
									</span>
								</div>
								<h2 className="font-display text-2xl leading-[1.1] font-extrabold tracking-[-0.02em] wrap-break-word hyphens-auto sm:text-4xl md:text-5xl">
									<span className="metallic-text">{t("b2b.title")}</span>
								</h2>
								<p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#d1cbe0] sm:text-lg">
									{t("b2b.subtitle")}
								</p>
							</div>
						</div>

						{/* Content Grid */}
						<div className="grid gap-7 p-5 sm:gap-8 sm:p-10 lg:grid-cols-12 lg:items-center lg:gap-12">
							{/* Left: Executive Copy & CTA (exact existing link) */}
							<div className="flex min-w-0 flex-col gap-5 sm:gap-6 lg:col-span-5">
								<p className="text-sm leading-relaxed text-[#b8b2c7] sm:text-lg">
									{t("b2b.description")}
								</p>

								<div>
									<Link
										href={`/${locale}#contact`}
										aria-label={t("b2b.ctaButton")}
										className="group font-display inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-5 py-4 text-center text-sm font-bold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_32px_-6px_rgba(123,45,255,0.5)] transition-all duration-300 hover:scale-[1.015] hover:brightness-110 active:scale-[0.98] sm:w-auto sm:px-8"
									>
										<span>{t("b2b.ctaButton")}</span>
										<ArrowRight
											className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
											aria-hidden="true"
										/>
									</Link>
								</div>
							</div>

							{/* Right: Structured Glass Feature Rows */}
							<div className="grid min-w-0 gap-3.5 sm:gap-4 lg:col-span-7">
								{B2B_FEATURE_ICONS.map(({ key, icon: Icon }, index) => {
									const title = t(`b2b.features.${key}.title`);
									const desc = t(`b2b.features.${key}.desc`);
									const idx = String(index + 1).padStart(2, "0");

									return (
										<div
											key={key}
											className="group flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/2.5 p-4 transition-all duration-300 hover:border-[#a855f7]/45 hover:bg-white/4.5 sm:gap-4 sm:p-5"
										>
											<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#7b2dff]/35 bg-[#7b2dff]/15 text-[#d8b4fe] transition-colors group-hover:bg-[#7b2dff] group-hover:text-white sm:h-12 sm:w-12">
												<Icon className="h-5 w-5" aria-hidden="true" />
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-start justify-between gap-2">
													<h3 className="font-display text-sm font-bold text-white sm:text-base">
														{title}
													</h3>
													<span className="shrink-0 font-mono text-[11px] font-semibold text-white/25 group-hover:text-[#d8b4fe]">
														{idx}
													</span>
												</div>
												<p className="mt-1 text-xs leading-relaxed text-[#b8b2c7] sm:text-sm">
													{desc}
												</p>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</RevealSection>
			</div>
		</section>
	);
};
