"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { PHOTO_STEPS } from "@/features/assessment/schemas/assessment.schema";

import type { WizardStep } from "@/features/assessment/schemas/assessment.schema";

type ProgressIndicatorProps = {
	currentStep: WizardStep;
	completedSteps: WizardStep[];
};

export const ProgressIndicator = ({ currentStep, completedSteps }: ProgressIndicatorProps) => {
	const hasMoreSteps = (index: number) => index < PHOTO_STEPS.length - 1;

	return (
		<div className="flex items-center justify-center">
			{PHOTO_STEPS.map((step, index) => {
				const isCompleted = completedSteps.includes(step);
				const isCurrent = currentStep === step;

				return (
					<div key={step} className="flex items-center">
						<motion.div
							initial={false}
							animate={{
								scale: isCurrent ? 1.1 : 1,
								backgroundColor: isCompleted
									? "rgb(34, 197, 94)"
									: isCurrent
										? "rgb(123, 45, 255)"
										: "rgb(42, 42, 42)",
							}}
							className="z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
						>
							{isCompleted ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
						</motion.div>
						{hasMoreSteps(index) ? (
							<div className="relative w-12">
								<div className="bg-surface-container-high absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2" />
								<motion.div
									initial={false}
									animate={{
										width: completedSteps.length > index ? "100%" : "0%",
										backgroundColor:
											completedSteps.length > index ? "rgb(34, 197, 94)" : "rgb(42, 42, 42)",
									}}
									className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 transition-all duration-500"
								/>
							</div>
						) : null}
					</div>
				);
			})}
		</div>
	);
};
