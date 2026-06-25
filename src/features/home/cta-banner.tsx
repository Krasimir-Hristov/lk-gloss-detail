import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type CtaBannerProps = {
	locale: string;
};

export const CtaBanner = ({ locale }: CtaBannerProps) => {
	const t = useTranslations("HomePage");

	return (
		<section className="px-4 py-20 md:px-16 md:py-28">
			<div className="mx-auto max-w-7xl">
				<div className="relative overflow-hidden rounded-2xl border border-[#7b2dff]/30 bg-linear-to-r from-[#1a0a3e] via-[#201f1f] to-[#1a0a3e] px-8 py-16 text-center md:px-16">
					{/* Glow effects */}
					<div className="pointer-events-none absolute top-0 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7b2dff]/20 blur-3xl" />
					<div className="pointer-events-none absolute right-0 bottom-0 h-48 w-48 translate-x-1/4 translate-y-1/4 rounded-full bg-[#d8b4fe]/10 blur-3xl" />

					<div className="relative">
						<h2 className="text-3xl font-bold text-[#e5e2e1] md:text-4xl">{t("cta.title")}</h2>
						<p className="mt-4 text-lg text-[#ccc3d9]">{t("cta.subtitle")}</p>

						<div className="mt-8 flex flex-wrap justify-center gap-4">
							<Link
								href={`/${locale}/booking`}
								className="group inline-flex items-center gap-2 rounded-lg bg-[#7b2dff] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#7b2dff]/25 transition-all hover:bg-[#7b2dff]/90 hover:shadow-[#7b2dff]/40"
							>
								{t("hero.ctaPrimary")}
								<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Link>
							<Link
								href={`/${locale}/assessment`}
								className="inline-flex items-center gap-2 rounded-lg border border-[#353534] bg-transparent px-8 py-4 text-base font-semibold text-[#e5e2e1] transition-all hover:border-[#7b2dff]/50 hover:bg-[#201f1f]"
							>
								{t("hero.ctaSecondary")}
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
