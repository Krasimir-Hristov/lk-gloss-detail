"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { PHOTO_STEPS } from "@/features/assessment/schemas/assessmentSchema";
import { cn } from "@/lib/utils";

import type { WizardStep } from "@/features/assessment/schemas/assessmentSchema";

type ProgressIndicatorProps = {
	currentStep: WizardStep;
	completedSteps: WizardStep[];
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
	currentStep,
	completedSteps,
}) => {
	const t = useTranslations("Assessment");

	const activeIndex = PHOTO_STEPS.indexOf(currentStep);
	const resolvedIndex = activeIndex >= 0 ? activeIndex : PHOTO_STEPS.length - 1;
	const progressPercent = ((resolvedIndex + 1) / PHOTO_STEPS.length) * 100;

	return (
		<nav
			aria-label={t("title")}
			className="obsidian-card relative mb-6 overflow-hidden rounded-2xl px-2 py-3 sm:mb-7 sm:p-5"
		>
			<div className="pointer-events-none absolute top-0 right-10 left-10 h-px bg-linear-to-r from-transparent via-[#7b2dff]/60 to-transparent" />

			<ol className="relative grid grid-cols-4 gap-1 sm:gap-3">
				{PHOTO_STEPS.map((step, index) => {
					const isCompleted = completedSteps.includes(step);
					const isActive = currentStep === step;
					const stepCode = String(index + 1).padStart(2, "0");

					return (
						<li key={step} aria-current={isActive ? "step" : undefined} className="min-w-0">
							<div className="flex flex-col items-center gap-1.5 py-1 text-center sm:gap-2">
								<div
									className={cn(
										"relative flex h-8 w-8 items-center justify-center rounded-xl border font-mono text-[11px] font-bold transition-all duration-300 sm:h-10 sm:w-10 sm:text-sm",
										isCompleted &&
											"border-emerald-400/55 bg-emerald-500/20 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.28)]",
										!isCompleted &&
											isActive &&
											"border-[#d8b4fe]/55 bg-linear-to-br from-[#7b2dff] to-[#c026ff] text-white shadow-[0_0_24px_rgba(192,38,255,0.55)]",
										!isCompleted &&
											!isActive &&
											"border-white/[0.08] bg-white/[0.03] text-[#7a738c]",
									)}
								>
									{isCompleted ? (
										<Check
											className="h-3.5 w-3.5 text-emerald-300 sm:h-4 sm:w-4"
											aria-hidden="true"
										/>
									) : (
										<span>{stepCode}</span>
									)}
								</div>

								<span
									className={cn(
										"font-display line-clamp-2 max-w-full text-[10px] leading-tight font-semibold tracking-tight break-words transition-colors sm:text-xs",
										isActive && "text-white",
										isCompleted && !isActive && "text-emerald-200/90",
										!isActive && !isCompleted && "text-[#7a738c]",
									)}
								>
									{t(`steps.${step}`)}
								</span>
							</div>
						</li>
					);
				})}
			</ol>

			{/* Illuminated bottom progress rail */}
			<div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
				<motion.div
					className="h-full rounded-full bg-linear-to-r from-[#7b2dff] via-[#a855f7] to-[#c026ff] shadow-[0_0_14px_rgba(192,38,255,0.75)]"
					initial={false}
					animate={{ width: `${progressPercent}%` }}
					transition={{ type: "spring", stiffness: 260, damping: 28 }}
				/>
			</div>
		</nav>
	);
};
