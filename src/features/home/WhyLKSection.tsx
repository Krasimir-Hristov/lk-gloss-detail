import { Truck, Award, BrainCircuit } from "lucide-react";
import { useTranslations } from "next-intl";

const USP_ICONS = [
	{ key: "mobile", icon: Truck },
	{ key: "professional", icon: Award },
	{ key: "aiPowered", icon: BrainCircuit },
] as const;

export const WhyLKSection = () => {
	const t = useTranslations("HomePage");

	return (
		<section className="px-4 py-12 sm:py-20 md:px-16 md:py-28">
			<div className="mx-auto max-w-7xl">
				{/* Section header */}
				<div className="mb-10 text-center sm:mb-16">
					<div className="mx-auto mb-4 h-1 w-16 rounded-full bg-linear-to-r from-[#7b2dff] to-[#d8b4fe]" />
					<h2 className="text-2xl font-bold text-[#e5e2e1] sm:text-3xl md:text-4xl">
						{t("whyLK.title")}
					</h2>
				</div>

				{/* USP cards */}
				<div className="grid gap-4 sm:gap-6 md:grid-cols-3">
					{USP_ICONS.map(({ key, icon: Icon }) => {
						const title = t(`whyLK.${key}`);
						const desc = t(`whyLK.${key}Desc`);
						return (
							<div
								key={key}
								className="group flex flex-col items-center rounded-2xl border border-[#353534] bg-[#201f1f] p-6 text-center transition-all hover:border-[#7b2dff]/40 hover:shadow-lg hover:shadow-[#7b2dff]/5 sm:p-8"
							>
								<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7b2dff]/15 transition-colors group-hover:bg-[#7b2dff]/25">
									<Icon className="h-8 w-8 text-[#d1bcff]" />
								</div>
								<h3 className="mb-3 text-xl font-bold text-[#e5e2e1]">{title}</h3>
								<p className="text-sm leading-relaxed text-[#ccc3d9]">{desc}</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};
