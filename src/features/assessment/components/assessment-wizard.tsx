"use client";

import { useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import { useAssessmentStore } from "@/features/assessment/stores/assessment-store";
import { PhotoUploadStep } from "@/features/assessment/components/photo-upload-step";
import { ProgressIndicator } from "@/features/assessment/components/progress-indicator";
import type { PhotoAngle, WizardStep } from "@/features/assessment/schemas/assessment.schema";
import { PHOTO_STEPS } from "@/features/assessment/schemas/assessment.schema";

export const AssessmentWizard = () => {
	const t = useTranslations("Assessment");
	const { currentStep, photos, nextStep, prevStep, setPhotoValidation } = useAssessmentStore();

	const completedSteps = photos
		.filter((p) => p.validationStatus === "valid")
		.map((p) => p.angle as WizardStep);

	const handlePhotoValidatedAction = useCallback(
		(
			photoId: string,
			previewUrl: string,
			carSize?: "small" | "medium" | "large" | "suv",
			dirtLevel?: "light" | "moderate" | "heavy",
			carDescription?: string,
		) => {
			console.log("[AssessmentWizard] Updating store with validated photo:", {
				photoId,
				carSize,
				dirtLevel,
				carDescription,
			});
			setPhotoValidation(
				photoId,
				"valid",
				t("validation.valid"),
				carSize,
				dirtLevel,
				carDescription,
			);

			setTimeout(() => {
				nextStep();
			}, 1000);
		},
		[setPhotoValidation, nextStep, t],
	);

	const handlePhotoInvalidAction = useCallback((reason: string, userMessage?: string) => {
		console.log("[AssessmentWizard] Photo invalid:", { reason, userMessage });
	}, []);

	const isPhotoStep = PHOTO_STEPS.includes(currentStep);

	const previousCarDescriptions = photos
		.filter((p) => p.validationStatus === "valid" && p.carDescription)
		.map((p) => p.carDescription!);

	return (
		<div className="bg-surface flex min-h-screen flex-col items-center justify-center px-4 py-12">
			<div className="w-full max-w-2xl">
				{isPhotoStep && (
					<div className="mb-8">
						<ProgressIndicator currentStep={currentStep} completedSteps={completedSteps} />
					</div>
				)}

				<AnimatePresence mode="wait">
					{isPhotoStep && (
						<motion.div
							key={currentStep}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
						>
							<PhotoUploadStep
								angle={currentStep as PhotoAngle}
								previousCarDescriptions={previousCarDescriptions}
								onPhotoValidatedAction={handlePhotoValidatedAction}
								onPhotoInvalidAction={handlePhotoInvalidAction}
							/>
						</motion.div>
					)}

					{currentStep === "services" && (
						<motion.div
							key="services"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="bg-surface-container rounded-2xl p-8 text-center"
						>
							<h2 className="mb-4 text-2xl font-bold text-white">{t("swipe.title")}</h2>
							<p className="text-on-surface-variant">
								{/* TODO: Phase 6.2 — Tinder-style service cards */}
								{t("swipe.title")}
							</p>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Back button for photo steps (not on first step) */}
				{isPhotoStep && currentStep !== "front" && (
					<div className="mt-8 text-center">
						<button
							onClick={prevStep}
							className="text-on-surface-variant inline-flex items-center gap-2 transition-colors hover:text-white"
						>
							<ArrowLeft className="h-4 w-4" />
							{t("navigation.back")}
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
