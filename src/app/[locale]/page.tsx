import { Sparkles, Truck, MapPin, Clock, ThumbsUp, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { z } from "zod";

import { LocalBusinessJsonLd, WebPageJsonLd } from "@/components/shared/JsonLd";
import { getBaseUrl } from "@/constants/site";
import {
	B2BSection,
	ContactSection,
	CtaBanner,
	HeroSection,
	HowItWorksSection,
	ServicesSection,
	WhyLKSection,
} from "@/features/home";
import { getPublicServices } from "@/features/services/actions/get-public-services";
import { Link } from "@/i18n/routing";

import type { PublicService } from "@/features/services/actions/get-public-services";

export const revalidate = 3600;

// ── Zod schemas for i18n payload validation ──────────────────────────────

const MobileFeatureSchema = z.object({
	title: z.string(),
	desc: z.string(),
});

const ValuationStatSchema = z.object({
	value: z.string(),
	label: z.string(),
});

// ── Icon mapping for mobile features (structure only, text comes from i18n) ──

const MOBILE_FEATURE_ICONS = [
	{ key: "onSite", icon: MapPin },
	{ key: "valueIncrease", icon: ThumbsUp },
	{ key: "noAppointment", icon: Clock },
	{ key: "noStress", icon: Truck },
] as const;

const STAT_KEYS = ["valueIncrease", "fastAnalysis", "happyCustomers"] as const;

// ─── Page Component ──────────────────────────────────────────────────────────

type Props = {
	params: Promise<{ locale: string }>;
};

const HomePage = async ({ params }: Props) => {
	const { locale } = await params;
	setRequestLocale(locale);

	const services = await getPublicServices();

	return <HomePageContent locale={locale} services={services} />;
};

export default HomePage;

const HomePageContent = ({ locale, services }: { locale: string; services: PublicService[] }) => {
	const t = useTranslations("HomePage");
	const tMeta = useTranslations("Metadata");

	return (
		<div className="flex flex-1 flex-col bg-[#131313]">
			<HeroSection locale={locale} />

			{/* ── Services Section ── */}
			<ServicesSection services={services} />

			{/* ── Mobile Service Section ── */}
			<section className="relative overflow-hidden px-4 py-20 md:px-16 md:py-28">
				{/* Purple glow background */}
				<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#131313] via-[#1a0a3e]/40 to-[#131313]" />
				<div className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7b2dff]/10 blur-3xl" />

				<div className="relative mx-auto max-w-7xl">
					<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
						{/* Left: Text */}
						<div className="flex flex-col gap-6">
							<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7b2dff]/15">
								<Truck className="h-8 w-8 text-[#d1bcff]" />
							</div>
							<h2 className="text-3xl font-bold text-[#e5e2e1] md:text-4xl">
								{t("mobileService.title")}
							</h2>
							<p className="max-w-md text-lg leading-relaxed text-[#ccc3d9]">
								{t("mobileService.description")}
							</p>
						</div>

						{/* Right: Feature cards 2x2 */}
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
							{MOBILE_FEATURE_ICONS.map(({ key, icon: Icon }) => {
								const rawFeature = t.raw(`mobileService.features.${key}`);
								const feature = MobileFeatureSchema.parse(rawFeature);
								return (
									<div
										key={key}
										className="rounded-xl border border-[#353534] bg-[#201f1f]/80 p-4 backdrop-blur-sm transition-all hover:border-[#7b2dff]/30 sm:p-5"
									>
										<Icon className="mb-3 h-6 w-6 text-[#d1bcff]" />
										<h4 className="mb-1 text-sm font-bold text-[#e5e2e1]">{feature.title}</h4>
										<p className="text-xs text-[#ccc3d9]">{feature.desc}</p>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			{/* ── AI Assessment Banner CTA Section ── */}
			<section className="px-4 py-12 sm:py-20 md:px-16 md:py-28">
				<div className="mx-auto max-w-7xl">
					<div className="relative overflow-hidden rounded-3xl border border-[#7b2dff]/40 bg-linear-to-br from-[#1c0b3b] via-[#131313] to-[#160630] px-6 py-12 text-center shadow-[0_0_60px_rgba(123,45,255,0.2)] sm:px-12 sm:py-16 md:px-20 md:py-20">
						{/* Ambient glows */}
						<div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#7b2dff]/25 blur-3xl" />
						<div className="pointer-events-none absolute right-1/4 -bottom-24 h-80 w-80 rounded-full bg-[#c026ff]/15 blur-3xl" />

						<div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
							{/* Glowing Pill Tag */}
							<div className="inline-flex items-center gap-2 rounded-full border border-[#7b2dff]/40 bg-[#7b2dff]/15 px-4 py-1.5 backdrop-blur-md">
								<Sparkles className="h-4 w-4 text-[#d1bcff]" />
								<span className="text-xs font-bold tracking-wider text-[#d1bcff] uppercase">
									{t("aiValuation.formTitle")}
								</span>
							</div>

							{/* Title */}
							<h2 className="text-3xl font-extrabold text-[#e5e2e1] sm:text-4xl md:text-5xl">
								{t("aiValuation.title")}
							</h2>

							{/* Subtitle */}
							<p className="max-w-2xl text-base leading-relaxed text-[#ccc3d9] sm:text-lg md:text-xl">
								{t("aiValuation.description")}
							</p>

							{/* Main Action Button */}
							<div className="mt-4 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
								<Link
									href="/assessment"
									className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-[#7b2dff] to-[#c026ff] px-8 py-4.5 text-lg font-bold text-white shadow-[0_0_25px_rgba(123,45,255,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(192,38,255,0.6)] active:scale-95 sm:w-auto sm:px-10"
								>
									<Sparkles className="h-5 w-5 text-white transition-transform group-hover:rotate-12" />
									<span>{t("aiValuation.ctaButton")}</span>
									<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
								</Link>
							</div>

							{/* Integrated Stats Bar */}
							<div className="mt-8 grid w-full grid-cols-1 gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
								{STAT_KEYS.map((key) => {
									const rawStat = t.raw(`aiValuation.stats.${key}`);
									const stat = ValuationStatSchema.parse(rawStat);
									return (
										<div
											key={key}
											className="flex flex-col items-center rounded-xl border border-white/5 bg-[#201f1f]/60 p-4 backdrop-blur-sm"
										>
											<p className="text-2xl font-extrabold text-[#d1bcff] sm:text-3xl">
												{stat.value}
											</p>
											<p className="mt-1 text-xs text-[#ccc3d9]">{stat.label}</p>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── Why LK Section ── */}
			<WhyLKSection />

			{/* ── How It Works Section ── */}
			<HowItWorksSection />

			{/* ── B2B & Fleet Section ── */}
			<B2BSection locale={locale} />

			{/* ── CTA Banner ── */}
			<CtaBanner locale={locale} />

			{/* ── Contact Section ── */}
			<ContactSection />

			{/* ── Structured Data ── */}
			<LocalBusinessJsonLd locale={locale} />
			<WebPageJsonLd
				name={tMeta("title")}
				description={tMeta("description")}
				url={`${getBaseUrl()}/${locale}`}
				locale={locale}
			/>
		</div>
	);
};
