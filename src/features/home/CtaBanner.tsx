import { ArrowRight, CalendarCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { lkLogo } from "@/assets";
import { RevealSection } from "@/features/home/components/RevealSection";

type CtaBannerProps = {
	locale: string;
};

export const CtaBanner = ({ locale }: CtaBannerProps) => {
	const t = useTranslations("HomePage");
	const tNav = useTranslations("Navigation");

	return (
		<section className="relative overflow-hidden bg-[#07070a] px-4 py-14 sm:py-20 md:px-12 md:py-24">
			<div className="mx-auto max-w-7xl">
				<RevealSection>
					<div className="relative overflow-hidden rounded-3xl border border-[#a855f7]/35 bg-linear-to-br from-[#190a36] via-[#0d0c14] to-[#160829] px-6 py-12 text-center shadow-[0_0_90px_-20px_rgba(123,45,255,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] sm:px-10 sm:py-16 md:px-16 md:py-20">
						{/* Ambient Aurora Glows & Subtle Grid */}
						<div className="atelier-grid pointer-events-none absolute inset-0 opacity-40" />
						<div className="pointer-events-none absolute top-0 right-12 left-12 h-px bg-linear-to-r from-transparent via-[#d8b4fe]/80 to-transparent" />
						<div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-[#7b2dff]/28 blur-[110px]" />
						<div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 translate-x-1/4 translate-y-1/4 rounded-full bg-[#c026ff]/20 blur-[90px]" />

						<div className="relative mx-auto flex max-w-3xl flex-col items-center">
							{/* Authentic Brand Crest */}
							<div className="mb-6 h-14 w-14 overflow-hidden rounded-2xl border border-[#a855f7]/50 bg-black p-0.5 shadow-[0_0_30px_rgba(123,45,255,0.45)]">
								<Image
									src={lkLogo}
									alt="LK Gloss & Detail"
									width={56}
									height={56}
									className="h-full w-full scale-105 object-cover"
								/>
							</div>

							<h2 className="font-display text-2xl leading-[1.1] font-black tracking-[-0.025em] sm:text-4xl md:text-5xl">
								<span className="metallic-text">{t("cta.title")}</span>
							</h2>
							<p className="mt-4 max-w-xl text-base leading-relaxed text-[#c6c0d6] sm:text-lg">
								{t("cta.subtitle")}
							</p>

							{/* Single focused primary Book Appointment CTA */}
							<div className="mt-9 flex w-full justify-center sm:w-auto">
								<Link
									href={`/${locale}/booking`}
									aria-label={tNav("bookNow")}
									className="group font-display inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-8 py-4 text-center text-sm font-bold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_14px_38px_-6px_rgba(123,45,255,0.6)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_18px_48px_-6px_rgba(192,38,255,0.68)] hover:brightness-110 active:scale-[0.98] sm:w-auto sm:px-10"
								>
									<CalendarCheck className="h-4 w-4 text-[#f3e8ff]" aria-hidden="true" />
									<span>{tNav("bookNow")}</span>
									<ArrowRight
										className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
										aria-hidden="true"
									/>
								</Link>
							</div>
						</div>
					</div>
				</RevealSection>
			</div>
		</section>
	);
};
