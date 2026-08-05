import { Building2, Handshake, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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
		<section className="relative overflow-hidden px-4 py-12 sm:py-20 md:px-16 md:py-28">
			{/* Background gradient */}
			<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#131313] via-[#0a0a1a]/60 to-[#131313]" />
			<div className="pointer-events-none absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7b2dff]/8 blur-3xl" />

			<div className="relative mx-auto max-w-7xl">
				{/* Header */}
				<div className="mb-10 text-center sm:mb-16">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7b2dff]/15">
						<Building2 className="h-8 w-8 text-[#d1bcff]" />
					</div>
					<h2 className="text-2xl font-bold text-[#e5e2e1] sm:text-3xl md:text-4xl">
						{t("b2b.title")}
					</h2>
					<p className="mt-3 text-base text-[#ccc3d9] sm:text-lg">{t("b2b.subtitle")}</p>
				</div>

				{/* Content grid */}
				<div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
					{/* Left: Description */}
					<div className="flex flex-col gap-6">
						<p className="text-base leading-relaxed text-[#ccc3d9] sm:text-lg">
							{t("b2b.description")}
						</p>

						<Link
							href={`/${locale}/contact`}
							className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7b2dff] px-6 py-4 text-center text-base font-semibold text-white shadow-lg shadow-[#7b2dff]/25 transition-all hover:bg-[#7b2dff]/90 hover:shadow-[#7b2dff]/40 sm:w-auto sm:self-start sm:px-8"
						>
							{t("b2b.ctaButton")}
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Link>
					</div>

					{/* Right: Feature cards */}
					<div className="flex flex-col gap-4">
						{B2B_FEATURE_ICONS.map(({ key, icon: Icon }) => {
							const title = t(`b2b.features.${key}.title`);
							const desc = t(`b2b.features.${key}.desc`);
							return (
								<div
									key={key}
									className="flex items-start gap-4 rounded-xl border border-[#353534] bg-[#201f1f]/80 p-6 backdrop-blur-sm transition-all hover:border-[#7b2dff]/30"
								>
									<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7b2dff]/15">
										<Icon className="h-6 w-6 text-[#d1bcff]" />
									</div>
									<div>
										<h4 className="mb-1 text-base font-bold text-[#e5e2e1]">{title}</h4>
										<p className="text-sm text-[#ccc3d9]">{desc}</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
};
