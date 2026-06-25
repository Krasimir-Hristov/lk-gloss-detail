import {
	Sparkles,
	ShieldCheck,
	Star,
	Truck,
	MapPin,
	Clock,
	ThumbsUp,
	ArrowRight,
	CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { z } from "zod";

import { HeroSection } from "@/features/home";

// ── Zod schemas for i18n payload validation ──────────────────────────────

const ServiceSchema = z.object({
	title: z.string(),
	features: z.array(z.string()),
});

const MobileFeatureSchema = z.object({
	title: z.string(),
	desc: z.string(),
});

const ValuationStatSchema = z.object({
	value: z.string(),
	label: z.string(),
});

// ── Icon mapping for services (structure only, text comes from i18n) ────────

const SERVICE_ICONS = [
	{ key: "interior", icon: Sparkles },
	{ key: "paintCorrection", icon: ShieldCheck },
	{ key: "ceramic", icon: Star },
] as const;

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

	return <HomePageContent locale={locale} />;
};

export default HomePage;

const HomePageContent = ({ locale }: { locale: string }) => {
	const t = useTranslations("HomePage");

	return (
		<div className="flex flex-1 flex-col bg-[#131313]">
			<HeroSection locale={locale} />

			{/* ── Services Section ── */}
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
					<div className="grid gap-6 md:grid-cols-3">
						{SERVICE_ICONS.map(({ key, icon: Icon }) => {
							const rawService = t.raw(`services.${key}`);
							const service = ServiceSchema.parse(rawService);
							return (
								<div
									key={key}
									className="group rounded-xl border border-[#353534] bg-[#201f1f] p-8 transition-all hover:border-[#7b2dff]/40 hover:shadow-lg hover:shadow-[#7b2dff]/5"
								>
									<div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#7b2dff]/15">
										<Icon className="h-7 w-7 text-[#d1bcff]" />
									</div>
									<h3 className="mb-4 text-xl font-bold text-[#e5e2e1]">{service.title}</h3>
									<ul className="mb-8 space-y-3">
										{service.features.map((feature) => (
											<li key={feature} className="flex items-start gap-3 text-sm text-[#ccc3d9]">
												<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7b2dff]" />
												{feature}
											</li>
										))}
									</ul>
									<Link
										href={`/${locale}/services`}
										className="inline-flex items-center gap-1 text-sm font-semibold text-[#d1bcff] transition-colors hover:text-[#7b2dff]"
									>
										{t("servicesPreview.more")} <ArrowRight className="h-3.5 w-3.5" />
									</Link>
								</div>
							);
						})}
					</div>
				</div>
			</section>

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
						<div className="grid grid-cols-2 gap-4">
							{MOBILE_FEATURE_ICONS.map(({ key, icon: Icon }) => {
								const rawFeature = t.raw(`mobileService.features.${key}`);
								const feature = MobileFeatureSchema.parse(rawFeature);
								return (
									<div
										key={key}
										className="rounded-xl border border-[#353534] bg-[#201f1f]/80 p-5 backdrop-blur-sm transition-all hover:border-[#7b2dff]/30"
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

			{/* ── AI Valuation Section ── */}
			<section className="px-4 py-20 md:px-16 md:py-28">
				<div className="mx-auto max-w-7xl">
					<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
						{/* Left: Mock form UI */}
						<div className="rounded-2xl border border-[#353534] bg-[#201f1f] p-8">
							<div className="mb-6 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7b2dff]/20">
									<Sparkles className="h-5 w-5 text-[#d1bcff]" />
								</div>
								<h3 className="text-lg font-bold text-[#e5e2e1]">{t("aiValuation.formTitle")}</h3>
							</div>

							{/* Mock input fields */}
							<div className="space-y-4">
								<div>
									<label className="mb-2 block text-xs font-semibold tracking-wider text-[#ccc3d9] uppercase">
										{t("aiValuation.labels.model")}
									</label>
									<div className="rounded-lg border border-[#353534] bg-[#131313] px-4 py-3 text-sm text-[#e5e2e1]">
										{t("aiValuation.mockValues.model")}
									</div>
								</div>
								<div>
									<label className="mb-2 block text-xs font-semibold tracking-wider text-[#ccc3d9] uppercase">
										{t("aiValuation.labels.year")}
									</label>
									<div className="rounded-lg border border-[#353534] bg-[#131313] px-4 py-3 text-sm text-[#e5e2e1]">
										{t("aiValuation.mockValues.year")}
									</div>
								</div>
								<div>
									<label className="mb-2 block text-xs font-semibold tracking-wider text-[#ccc3d9] uppercase">
										{t("aiValuation.labels.condition")}
									</label>
									<div className="rounded-lg border border-[#353534] bg-[#131313] px-4 py-3 text-sm text-[#e5e2e1]">
										{t("aiValuation.mockValues.condition")}
									</div>
								</div>
								<button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#7b2dff] px-6 py-4 text-base font-semibold text-white transition-all hover:bg-[#7b2dff]/90">
									<Sparkles className="h-4 w-4" />
									{t("aiValuation.ctaButton")}
								</button>
							</div>
						</div>

						{/* Right: Text + Stats */}
						<div className="flex flex-col gap-8">
							<h2 className="text-3xl font-bold text-[#e5e2e1] md:text-4xl">
								{t("aiValuation.title")}
							</h2>
							<p className="max-w-md text-lg leading-relaxed text-[#ccc3d9]">
								{t("aiValuation.description")}
							</p>

							{/* Stats grid */}
							<div className="grid grid-cols-3 gap-4 pt-4">
								{STAT_KEYS.map((key) => {
									const rawStat = t.raw(`aiValuation.stats.${key}`);
									const stat = ValuationStatSchema.parse(rawStat);
									return (
										<div
											key={key}
											className="rounded-xl border border-[#353534] bg-[#201f1f] p-5 text-center"
										>
											<p className="text-2xl font-extrabold text-[#d1bcff] md:text-3xl">
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
		</div>
	);
};
