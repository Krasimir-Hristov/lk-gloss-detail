import { ShieldCheck, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

type HeroSectionProps = {
	locale: string;
};

export const HeroSection = ({ locale }: HeroSectionProps) => {
	const t = useTranslations("HomePage");

	return (
		<section className="relative overflow-hidden px-4 pt-12 pb-20 md:px-16 md:pt-20 md:pb-32">
			<div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
				{/* Left: Text */}
				<div className="flex flex-col gap-6">
					<h1 className="text-4xl leading-tight font-extrabold tracking-tight text-[#e5e2e1] md:text-5xl lg:text-6xl">
						{t("hero.title")}
					</h1>
					<p className="max-w-lg text-lg leading-relaxed text-[#ccc3d9] md:text-xl">
						{t("hero.subtitle")}
					</p>
					<div className="flex flex-wrap gap-4 pt-2">
						<Link
							href={`/${locale}/assessment`}
							className="inline-flex items-center gap-2 rounded-lg bg-[#7b2dff] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#7b2dff]/25 transition-all hover:bg-[#7b2dff]/90 hover:shadow-[#7b2dff]/40"
						>
							{t("hero.ctaPrimary")}
							<ArrowRight className="h-4 w-4" />
						</Link>
						<Link
							href={`/${locale}/services`}
							className="inline-flex items-center gap-2 rounded-lg border border-[#353534] bg-transparent px-8 py-4 text-base font-semibold text-[#e5e2e1] transition-all hover:border-[#7b2dff]/50 hover:bg-[#201f1f]"
						>
							{t("hero.ctaSecondary")}
						</Link>
					</div>
				</div>

				{/* Right: Image with floating badge */}
				<div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
					<div className="relative overflow-hidden rounded-2xl border border-[#353534]">
						<Image
							src="/screenshots/hero-car-detailing.jpg"
							alt={t("hero.imageAlt")}
							width={800}
							height={600}
							priority
							className="h-auto w-full object-cover"
						/>
						{/* Gradient overlay */}
						<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#131313]/60 via-transparent to-transparent" />
					</div>
					{/* Floating badge */}
					<div className="absolute -bottom-4 -left-4 flex items-center gap-3 rounded-xl border border-[#353534] bg-[#201f1f] px-5 py-3 shadow-xl md:-left-8">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7b2dff]/20">
							<ShieldCheck className="h-5 w-5 text-[#d1bcff]" />
						</div>
						<div>
							<p className="text-sm font-bold text-[#e5e2e1]">{t("hero.badgeTitle")}</p>
							<p className="text-xs text-[#ccc3d9]">{t("hero.badgeSubtitle")}</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
