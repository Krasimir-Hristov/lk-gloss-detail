import { ShieldCheck, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { heroCarDetailing } from "@/assets";

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
					<h1 className="text-3xl leading-tight font-extrabold tracking-tight text-[#e5e2e1] sm:text-4xl md:text-5xl lg:text-6xl">
						{t("hero.title")}
					</h1>
					<p className="max-w-lg text-base leading-relaxed text-[#ccc3d9] sm:text-lg md:text-xl">
						{t("hero.subtitle")}
					</p>
					<div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4">
						<Link
							href={`/${locale}/assessment`}
							className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7b2dff] px-6 py-4 text-center text-base font-semibold text-white shadow-lg shadow-[#7b2dff]/25 transition-all hover:bg-[#7b2dff]/90 hover:shadow-[#7b2dff]/40 sm:w-auto sm:px-8"
						>
							{t("hero.ctaPrimary")}
							<ArrowRight className="h-4 w-4" />
						</Link>
						<Link
							href={`/${locale}/services`}
							className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#353534] bg-transparent px-6 py-4 text-center text-base font-semibold text-[#e5e2e1] transition-all hover:border-[#7b2dff]/50 hover:bg-[#201f1f] sm:w-auto sm:px-8"
						>
							{t("hero.ctaSecondary")}
						</Link>
					</div>
				</div>

				{/* Right: Image with floating badge */}
				<div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
					<div className="relative overflow-hidden rounded-2xl border border-[#353534]">
						<Image
							src={heroCarDetailing}
							alt={t("hero.imageAlt")}
							priority
							sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 800px"
							className="h-auto w-full object-cover"
						/>
						{/* Gradient overlay */}
						<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#131313]/60 via-transparent to-transparent" />
					</div>
					{/* Floating badge */}
					<div className="absolute -bottom-4 left-1/2 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-[#353534] bg-[#201f1f] px-4 py-3 shadow-xl sm:px-5 md:-left-8 md:translate-x-0">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7b2dff]/20">
							<ShieldCheck className="h-5 w-5 text-[#d1bcff]" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-bold text-[#e5e2e1]">{t("hero.badgeTitle")}</p>
							<p className="truncate text-xs text-[#ccc3d9]">{t("hero.badgeSubtitle")}</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
