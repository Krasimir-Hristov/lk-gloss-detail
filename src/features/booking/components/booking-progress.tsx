"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type BookingProgressProps = {
	currentStep: 1 | 2 | 3 | 4;
};

export const BookingProgress = ({ currentStep }: BookingProgressProps) => {
	const t = useTranslations("Booking.progress");

	const steps = [t("step1"), t("step2"), t("step3"), t("step4")];

	return (
		<div className="mb-8 flex items-center justify-between">
			{steps.map((label, idx) => {
				const stepNumber = idx + 1;
				const isActive = stepNumber === currentStep;
				const isCompleted = stepNumber < currentStep;

				return (
					<div key={stepNumber} className="relative flex flex-1 flex-col items-center gap-2">
						<div
							className={cn(
								"flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold transition-colors",
								isActive && "border-[#7b2dff] bg-[#7b2dff] text-white",
								isCompleted && "border-[#7b2dff] bg-[#7b2dff]/20 text-[#7b2dff]",
								!isActive && !isCompleted && "border-white/20 text-white/50",
							)}
						>
							{stepNumber}
						</div>
						<span
							className={cn(
								"text-center text-xs font-medium",
								isActive ? "text-white" : "text-white/50",
							)}
						>
							{label}
						</span>
						{idx < steps.length - 1 ? (
							<div
								className={cn(
									"absolute top-5 right-0 hidden h-0.5 w-[calc(100%-3rem)] -translate-y-1/2 md:block",
									isCompleted ? "bg-[#7b2dff]" : "bg-white/10",
								)}
							/>
						) : null}
					</div>
				);
			})}
		</div>
	);
};
