import { Camera, Cpu, CalendarCheck } from "lucide-react";
import { useTranslations } from "next-intl";

const STEPS = [
	{ key: "step1", icon: Camera },
	{ key: "step2", icon: Cpu },
	{ key: "step3", icon: CalendarCheck },
] as const;

export const HowItWorksSection = () => {
	const t = useTranslations("HomePage");

	return (
		<section className="relative overflow-hidden px-4 py-20 md:px-16 md:py-28">
			{/* Background glow */}
			<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#131313] via-[#1a0a3e]/30 to-[#131313]" />

			<div className="relative mx-auto max-w-7xl">
				{/* Section header */}
				<div className="mb-16 text-center">
					<div className="mx-auto mb-4 h-1 w-16 rounded-full bg-linear-to-r from-[#7b2dff] to-[#d8b4fe]" />
					<h2 className="text-3xl font-bold text-[#e5e2e1] md:text-4xl">{t("howItWorks.title")}</h2>
				</div>

				{/* Steps */}
				<div className="grid gap-8 md:grid-cols-3">
					{STEPS.map(({ key, icon: Icon }, index) => {
						const title = t(`howItWorks.${key}`);
						const desc = t(`howItWorks.${key}Desc`);
						return (
							<div key={key} className="relative flex flex-col items-center text-center">
								{/* Step number */}
								<div className="relative mb-6">
									<div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#7b2dff]/40 bg-[#201f1f]">
										<Icon className="h-9 w-9 text-[#d1bcff]" />
									</div>
									<div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#7b2dff] text-sm font-bold text-white">
										{index + 1}
									</div>
								</div>

								<h3 className="mb-2 text-xl font-bold text-[#e5e2e1]">{title}</h3>
								<p className="max-w-xs text-sm leading-relaxed text-[#ccc3d9]">{desc}</p>

								{/* Connector line (hidden on last item and mobile) */}
								{index < STEPS.length - 1 ? (
									<div className="absolute top-10 left-[calc(50%+3rem)] hidden h-0.5 w-[calc(100%-6rem)] bg-linear-to-r from-[#7b2dff]/40 to-[#7b2dff]/10 md:block" />
								) : null}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};
