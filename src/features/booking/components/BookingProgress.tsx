"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { cn } from "@/lib/utils";

type BookingStep = 1 | 2 | 3 | 4;

type BookingProgressProps = {
	currentStep: BookingStep;
	onStepSelect?: (step: BookingStep) => void;
};

export const BookingProgress: React.FC<BookingProgressProps> = ({ currentStep, onStepSelect }) => {
	const t = useTranslations("Booking.progress");

	const steps = [
		{ num: 1 as const, label: t("step1") },
		{ num: 2 as const, label: t("step2") },
		{ num: 3 as const, label: t("step3") },
		{ num: 4 as const, label: t("step4") },
	];

	const progressPercent = (currentStep / steps.length) * 100;

	return (
		<nav
			aria-label="Booking progress"
			className="obsidian-card relative mb-6 overflow-hidden rounded-2xl px-2 py-3 sm:mb-7 sm:p-5"
		>
			<div className="pointer-events-none absolute top-0 right-10 left-10 h-px bg-linear-to-r from-transparent via-[#7b2dff]/55 to-transparent" />

			<ol className="relative grid grid-cols-4 gap-1 sm:gap-3">
				{steps.map(({ num, label }) => {
					const isActive = num === currentStep;
					const isCompleted = num < currentStep;
					const canJumpBack = isCompleted && Boolean(onStepSelect);
					const stepCode = String(num).padStart(2, "0");

					const content = (
						<div className="flex flex-col items-center gap-1.5 text-center sm:gap-2">
							<div
								className={cn(
									"relative flex h-8 w-8 items-center justify-center rounded-xl border font-mono text-[11px] font-bold transition-all duration-300 sm:h-10 sm:w-10 sm:text-sm",
									isActive &&
										"border-[#d8b4fe]/50 bg-linear-to-br from-[#7b2dff] to-[#c026ff] text-white shadow-[0_0_24px_rgba(192,38,255,0.55)]",
									isCompleted &&
										"border-[#7b2dff]/60 bg-[#7b2dff]/20 text-[#e9d5ff] group-hover:border-[#c026ff]/80 group-hover:bg-[#7b2dff]/35",
									!isActive && !isCompleted && "border-white/[0.08] bg-white/[0.03] text-[#7a738c]",
								)}
							>
								{isCompleted ? (
									<Check className="h-3.5 w-3.5 text-[#d8b4fe] sm:h-4 sm:w-4" aria-hidden="true" />
								) : (
									<span>{stepCode}</span>
								)}
							</div>

							<span
								className={cn(
									"font-display line-clamp-2 max-w-full text-[10px] leading-tight font-semibold tracking-tight break-words transition-colors sm:text-xs",
									isActive && "text-white",
									isCompleted && "text-[#cfc9de] group-hover:text-white",
									!isActive && !isCompleted && "text-[#7a738c]",
								)}
							>
								{label}
							</span>
						</div>
					);

					return (
						<li key={num} aria-current={isActive ? "step" : undefined} className="min-w-0">
							{canJumpBack ? (
								<button
									type="button"
									onClick={() => onStepSelect?.(num)}
									aria-label={`${stepCode} ${label}`}
									className="group w-full cursor-pointer rounded-xl py-1 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[#7b2dff]"
								>
									{content}
								</button>
							) : (
								<div className="py-1">{content}</div>
							)}
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
