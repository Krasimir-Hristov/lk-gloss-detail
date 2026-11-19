import { ArrowRight, ScanLine, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { paintGlossMacro } from "@/assets";
import { RevealSection } from "@/features/home/components/RevealSection";
import { Link } from "@/i18n/routing";

const ValuationStatSchema = z.object({
	value: z.string(),
	label: z.string(),
});

const STAT_KEYS = ["valueIncrease", "fastAnalysis", "happyCustomers"] as const;

export const AiValuationSection = () => {
	const t = useTranslations("HomePage");

	return (
		<section className="relative overflow-hidden border-t border-white/[0.06] bg-[#08080c] px-4 py-16 sm:py-24 md:px-12 md:py-32">
			<div className="relative mx-auto max-w-7xl">
				<RevealSection>
					<div className="relative overflow-hidden rounded-3xl border border-[#7b2dff]/35 bg-linear-to-br from-[#130a26] via-[#0c0c12] to-[#110820] p-5 shadow-[0_0_90px_-20px_rgba(123,45,255,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] sm:p-10 lg:p-14">
						{/* Background Atelier Grid & Ambient Glows */}
						<div className="atelier-grid pointer-events-none absolute inset-0 opacity-45" />
						<div className="pointer-events-none absolute -top-32 left-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-[#7b2dff]/25 blur-[130px]" />
						<div className="pointer-events-none absolute -right-20 -bottom-28 h-80 w-80 rounded-full bg-[#c026ff]/18 blur-[120px]" />
						<div className="pointer-events-none absolute top-0 right-12 left-12 h-px bg-linear-to-r from-transparent via-[#d8b4fe]/70 to-transparent" />

						<div className="relative grid items-center gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-12">
							{/* Left: Pitch, Primary CTA & Telemetry Stats */}
							<div className="flex min-w-0 flex-col gap-5 sm:gap-6 lg:col-span-7">
								{/* Glowing Pill Tag */}
								<div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-[#a855f7]/45 bg-[#7b2dff]/15 px-3.5 py-1.5 backdrop-blur-md sm:px-4">
									<Sparkles className="h-3.5 w-3.5 shrink-0 text-[#e9d5ff]" aria-hidden="true" />
									<span className="truncate font-mono text-[10px] font-bold tracking-[0.14em] text-[#e9d5ff] uppercase sm:text-[11px] sm:tracking-[0.18em]">
										{t("aiValuation.formTitle")}
									</span>
								</div>

								<h2 className="font-display text-2xl leading-[1.1] font-black tracking-[-0.025em] break-words hyphens-auto sm:text-4xl md:text-5xl">
									<span className="metallic-text">{t("aiValuation.title")}</span>
								</h2>

								<p className="max-w-2xl text-sm leading-relaxed text-[#c3bdd2] sm:text-lg">
									{t("aiValuation.description")}
								</p>

								{/* Main Action Button (exact existing route & label) */}
								<div className="pt-1">
									<Link
										href="/assessment"
										aria-label={t("aiValuation.ctaButton")}
										className="group font-display inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-6 py-4 text-sm font-bold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_14px_38px_-6px_rgba(123,45,255,0.58)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_18px_48px_-6px_rgba(192,38,255,0.68)] hover:brightness-110 active:scale-[0.98] sm:w-auto sm:gap-3 sm:px-10 sm:py-4.5 sm:text-base"
									>
										<Sparkles
											className="h-4 w-4 shrink-0 text-white transition-transform duration-300 group-hover:rotate-12 sm:h-5 sm:w-5"
											aria-hidden="true"
										/>
										<span>{t("aiValuation.ctaButton")}</span>
										<ArrowRight
											className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1 sm:h-5 sm:w-5"
											aria-hidden="true"
										/>
									</Link>
								</div>

								{/* Integrated Telemetry Stats Bar */}
								<div className="mt-2 grid grid-cols-3 gap-2.5 border-t border-white/10 pt-5 sm:gap-5 sm:pt-6">
									{STAT_KEYS.map((key) => {
										const rawStat = t.raw(`aiValuation.stats.${key}`);
										const stat = ValuationStatSchema.parse(rawStat);
										return (
											<div key={key} className="flex min-w-0 flex-col">
												<p className="violet-text font-display text-xl font-black tracking-tight min-[400px]:text-2xl sm:text-3xl md:text-4xl">
													{stat.value}
												</p>
												<p className="mt-1 font-mono text-[9.5px] leading-snug break-words hyphens-auto text-[#b8b2c7] min-[390px]:text-[11px] sm:text-xs">
													{stat.label}
												</p>
											</div>
										);
									})}
								</div>
							</div>

							{/* Right: Visual AI Scanner Telemetry Preview Card (read-only showcase) */}
							<div className="min-w-0 lg:col-span-5">
								<div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#09090e]/90 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-6">
									{/* Scanner Header */}
									<div className="mb-4 flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
										<div className="flex min-w-0 items-center gap-2 text-[#d8b4fe]">
											<ScanLine className="h-4 w-4 shrink-0" aria-hidden="true" />
											<span className="truncate font-mono text-[10px] font-bold tracking-[0.14em] uppercase sm:text-[11px] sm:tracking-[0.16em]">
												{t("aiValuation.formTitle")}
											</span>
										</div>
										<span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
									</div>

									{/* Visual Scan Viewport */}
									<div className="relative mb-4 aspect-16/9 overflow-hidden rounded-xl border border-[#7b2dff]/35 bg-black sm:mb-5">
										<Image
											src={paintGlossMacro}
											alt={t("aiValuation.mockValues.model")}
											placeholder="blur"
											fill
											sizes="(max-width: 1024px) 100vw, 38vw"
											className="object-cover opacity-90"
										/>
										{/* Animated CSS laser scanline */}
										<div className="scanline-beam pointer-events-none absolute inset-x-0 top-0 h-1/2" />
										{/* Viewfinder corner reticles */}
										<span className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 border-t-2 border-l-2 border-[#d8b4fe]/80" />
										<span className="pointer-events-none absolute top-2.5 right-2.5 h-4 w-4 border-t-2 border-r-2 border-[#d8b4fe]/80" />
										<span className="pointer-events-none absolute bottom-2.5 left-2.5 h-4 w-4 border-b-2 border-l-2 border-[#d8b4fe]/80" />
										<span className="pointer-events-none absolute right-2.5 bottom-2.5 h-4 w-4 border-r-2 border-b-2 border-[#d8b4fe]/80" />
									</div>

									{/* Localized Telemetry Readout Rows */}
									<dl className="space-y-2.5 sm:space-y-3">
										<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5 sm:px-4 sm:py-3">
											<dt className="font-mono text-[10px] tracking-wider text-[#9b93ad] uppercase sm:text-[11px]">
												{t("aiValuation.labels.model")}
											</dt>
											<dd className="font-display text-right text-xs font-bold text-white sm:text-sm">
												{t("aiValuation.mockValues.model")}
											</dd>
										</div>
										<div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5 sm:px-4 sm:py-3">
											<dt className="font-mono text-[10px] tracking-wider text-[#9b93ad] uppercase sm:text-[11px]">
												{t("aiValuation.labels.year")}
											</dt>
											<dd className="font-mono text-xs font-semibold text-[#e5e2e1] sm:text-sm">
												{t("aiValuation.mockValues.year")}
											</dd>
										</div>
										<div className="flex flex-col gap-1 rounded-xl border border-[#7b2dff]/30 bg-[#7b2dff]/10 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
											<dt className="font-mono text-[10px] tracking-wider text-[#d8b4fe] uppercase sm:text-[11px]">
												{t("aiValuation.labels.condition")}
											</dt>
											<dd className="text-xs font-semibold text-white sm:text-right sm:text-sm">
												{t("aiValuation.mockValues.condition")}
											</dd>
										</div>
									</dl>
								</div>
							</div>
						</div>
					</div>
				</RevealSection>
			</div>
		</section>
	);
};
