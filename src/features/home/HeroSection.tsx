import { ArrowRight, Award, BrainCircuit, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { heroShowroom, lkLogo } from "@/assets";

type HeroSectionProps = {
	locale: string;
};

const HERO_TRUST_ITEMS = [
	{ key: "mobile", icon: Truck },
	{ key: "professional", icon: Award },
	{ key: "aiPowered", icon: BrainCircuit },
] as const;

export const HeroSection = ({ locale }: HeroSectionProps) => {
	const t = useTranslations("HomePage");

	return (
		<section className="relative overflow-hidden bg-[#07070a] px-4 pt-8 pb-20 sm:pt-12 md:px-12 md:pt-16 md:pb-28">
			{/* Subtle architectural grid & ambient studio lights */}
			<div className="atelier-grid pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black_30%,transparent_80%)] opacity-60" />
			<div className="pointer-events-none absolute -top-32 -left-24 h-112 w-112 rounded-full bg-[#7b2dff]/18 blur-[130px]" />
			<div className="pointer-events-none absolute top-1/3 -right-32 h-128 w-128 rounded-full bg-[#c026ff]/12 blur-[150px]" />

			<div className="relative mx-auto max-w-7xl">
				<div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
					{/* Left: Editorial Display Typography & Actions */}
					<div className="flex min-w-0 flex-col gap-5 sm:gap-6 lg:col-span-6">
						{/* Studio Pill Badge */}
						<div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-[#7b2dff]/35 bg-[#7b2dff]/10 px-3.5 py-1.5 backdrop-blur-md sm:gap-2.5 sm:px-4">
							<span className="relative flex h-2 w-2 shrink-0">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c026ff] opacity-75" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-[#d8b4fe]" />
							</span>
							<span className="truncate font-mono text-[10px] font-semibold tracking-[0.14em] text-[#e5d4ff] uppercase min-[390px]:text-[11px] sm:tracking-[0.16em]">
								{t("hero.badgeTitle")} · {t("hero.badgeSubtitle")}
							</span>
						</div>

						{/* Monumental Headline */}
						<h1 className="font-display text-[1.75rem] leading-[1.08] font-black tracking-[-0.03em] break-words min-[390px]:text-3xl sm:text-5xl lg:text-[3.35rem] xl:text-6xl">
							<span className="metallic-text">{t("hero.title")}</span>
						</h1>

						{/* Subtitle */}
						<p className="max-w-xl text-base leading-relaxed text-[#b8b2c7] sm:text-lg">
							{t("hero.subtitle")}
						</p>

						{/* Dual Primary & Secondary CTAs (exact existing routes & labels) */}
						<div className="flex flex-col gap-3.5 pt-2 sm:flex-row sm:items-center sm:gap-4">
							<Link
								href={`/${locale}/assessment`}
								aria-label={t("hero.ctaPrimary")}
								className="group font-display relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-7 py-4 text-center text-sm font-bold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_14px_38px_-8px_rgba(123,45,255,0.6)] transition-all duration-300 hover:scale-[1.015] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_18px_45px_-6px_rgba(192,38,255,0.65)] hover:brightness-110 active:scale-[0.98] sm:w-auto sm:px-8"
							>
								<Sparkles className="h-4 w-4 text-[#f3e8ff]" aria-hidden="true" />
								<span>{t("hero.ctaPrimary")}</span>
								<ArrowRight
									className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
									aria-hidden="true"
								/>
							</Link>

							<Link
								href={`/${locale}#services`}
								aria-label={t("hero.ctaSecondary")}
								className="font-display inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 py-4 text-center text-sm font-bold tracking-wide text-[#f1eff7] backdrop-blur-md transition-all duration-300 hover:border-[#a855f7]/60 hover:bg-white/[0.08] hover:text-white active:scale-[0.98] sm:w-auto sm:px-8"
							>
								<span>{t("hero.ctaSecondary")}</span>
							</Link>
						</div>

						{/* Quiet Luxury Trust Strip (100% localized) */}
						<div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/[0.08] pt-6 sm:grid-cols-3 sm:gap-4">
							{HERO_TRUST_ITEMS.map(({ key, icon: Icon }) => (
								<div key={key} className="flex items-center gap-2.5">
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#d1bcff]">
										<Icon className="h-4 w-4" aria-hidden="true" />
									</div>
									<span className="text-xs leading-snug font-medium text-[#cfc9de]">
										{t(`whyLK.${key}`)}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Right: Rim-Lit Showroom Photography Showcase */}
					<div className="relative mx-auto w-full max-w-2xl min-w-0 lg:col-span-6 lg:mx-0 lg:max-w-none">
						{/* Ambient rim glow behind visual */}
						<div className="pointer-events-none absolute -inset-3 rounded-[32px] bg-linear-to-tr from-[#7b2dff]/25 via-transparent to-[#c026ff]/20 opacity-80 blur-2xl" />

						{/* Precision Chamfered Obsidian Frame */}
						<div className="relative rounded-[26px] bg-linear-to-b from-[#c026ff]/45 via-white/15 to-white/[0.04] p-px shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)]">
							<div className="group relative overflow-hidden rounded-[25px] bg-[#0b0b10]">
								<div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[4/3]">
									<Image
										src={heroShowroom}
										alt={t("hero.imageAlt")}
										priority
										placeholder="blur"
										fill
										sizes="(max-width: 1024px) 100vw, 52vw"
										className="object-cover object-[62%_center] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
									/>
									{/* Subtle cinematic vignette */}
									<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#07070a]/90 via-[#07070a]/15 to-transparent" />
									<div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#07070a]/45 via-transparent to-transparent" />
								</div>

								{/* Top Brand Watermark Crest */}
								<div className="absolute top-3 left-3 flex items-center gap-2 rounded-full border border-white/12 bg-black/65 px-2.5 py-1 backdrop-blur-xl sm:top-4 sm:left-4 sm:px-3 sm:py-1.5">
									<div className="relative h-5 w-5 overflow-hidden rounded-md border border-[#7b2dff]/50 bg-black">
										<Image
											src={lkLogo}
											alt="LK Gloss & Detail"
											width={20}
											height={20}
											className="h-full w-full scale-105 object-cover"
										/>
									</div>
									<span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#e5e2e1] uppercase sm:tracking-[0.18em]">
										LK Gloss &amp; Detail
									</span>
								</div>

								{/* Floating Smoked-Glass Certification Card */}
								<div className="absolute right-3 bottom-3 left-3 sm:right-auto sm:bottom-4 sm:left-4 sm:max-w-sm">
									<div className="glass-panel flex items-center gap-3 rounded-2xl px-3.5 py-2.5 shadow-[0_20px_45px_rgba(0,0,0,0.75)] sm:gap-3.5 sm:px-4 sm:py-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#7b2dff] to-[#c026ff] text-white shadow-[0_0_20px_rgba(123,45,255,0.5)] sm:h-11 sm:w-11">
											<ShieldCheck className="h-5 w-5" aria-hidden="true" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="font-display truncate text-xs font-bold text-white sm:text-sm">
												{t("hero.badgeTitle")}
											</p>
											<p className="truncate font-mono text-[11px] text-[#d1bcff] sm:text-xs">
												{t("hero.badgeSubtitle")}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
