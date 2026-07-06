"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useCallback } from "react";

import { PhotoUploadStep } from "@/features/assessment/components/photo-upload-step";
import { ProgressIndicator } from "@/features/assessment/components/progress-indicator";
import { ServiceSwipeDeck } from "@/features/assessment/components/service-swipe-deck";
import { PHOTO_STEPS } from "@/features/assessment/schemas/assessment.schema";
import { useAssessmentStore } from "@/features/assessment/stores/assessment-store";

import type { PhotoAngle, WizardStep } from "@/features/assessment/schemas/assessment.schema";

export const AssessmentWizard = () => {
	const t = useTranslations("Assessment");
	const locale = useLocale();
	const {
		currentStep,
		photos,
		nextStep,
		prevStep,
		setPhoto,
		setPhotoValidation,
		setResult,
		setIsAnalyzing,
		setError,
		goToStep,
	} = useAssessmentStore();

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
			// Store the photo in Zustand (base64 in browser RAM only)
			setPhoto(currentStep as PhotoAngle, previewUrl);

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
		[setPhoto, setPhotoValidation, nextStep, currentStep, t],
	);

	const handlePhotoInvalidAction = useCallback((reason: string, userMessage?: string) => {
		console.log("[AssessmentWizard] Photo invalid:", { reason, userMessage });
	}, []);

	// ── Trigger analysis after services are swiped ──────────────────────────

	const handleServicesComplete = useCallback(async () => {
		const state = useAssessmentStore.getState();
		const acceptedIds = state.services.filter((s) => s.accepted).map((s) => s.serviceId);

		if (acceptedIds.length === 0) {
			console.log("[AssessmentWizard] No services accepted — skipping analysis");
			goToStep("results");
			return;
		}

		// Extract car info from validated photos (most common values)
		const validPhotos = state.photos.filter((p) => p.validationStatus === "valid");
		const carSizes = validPhotos.map((p) => p.carSize).filter(Boolean);
		const dirtLevels = validPhotos.map((p) => p.dirtLevel).filter(Boolean);
		const carDescriptions = validPhotos.map((p) => p.carDescription).filter(Boolean);

		// Pick the most common car size, or default to "medium"
		const carSize =
			carSizes.length > 0
				? carSizes
						.sort(
							(a, b) =>
								carSizes.filter((v) => v === a).length - carSizes.filter((v) => v === b).length,
						)
						.pop()!
				: "medium";
		const dirtLevel =
			dirtLevels.length > 0
				? dirtLevels
						.sort(
							(a, b) =>
								dirtLevels.filter((v) => v === a).length - dirtLevels.filter((v) => v === b).length,
						)
						.pop()!
				: "moderate";
		const brand = carDescriptions.length > 0 ? carDescriptions[0] : null;

		setIsAnalyzing(true);
		goToStep("analyzing");

		try {
			const res = await fetch("/api/assessment/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					acceptedServiceIds: acceptedIds,
					carSize,
					dirtLevel,
					brand,
					locale,
				}),
			});

			if (!res.ok) {
				const err = (await res.json()) as { error?: string };
				throw new Error(err.error ?? "Analysis failed");
			}

			const result = await res.json();

			setResult({
				id: crypto.randomUUID(),
				carSize: result.carSize,
				dirtLevel: result.dirtLevel,
				brand: result.brand,
				priceMin: result.priceMin,
				priceMax: result.priceMax,
				durationHours: result.durationHours,
				summaryText: result.summaryText,
				createdAt: new Date().toISOString(),
			});

			goToStep("results");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Analysis failed";
			console.error("[AssessmentWizard] Analysis error:", message);
			setError(message);
		}
	}, [locale, setResult, setIsAnalyzing, setError, goToStep]);

	const isPhotoStep = PHOTO_STEPS.includes(currentStep);

	const previousCarDescriptions = photos
		.filter((p) => p.validationStatus === "valid" && p.carDescription)
		.map((p) => p.carDescription!);

	return (
		<div className="bg-surface flex min-h-screen flex-col items-center justify-center px-4 py-12">
			<div className="w-full max-w-2xl">
				{isPhotoStep ? (
					<div className="mb-8">
						<ProgressIndicator currentStep={currentStep} completedSteps={completedSteps} />
					</div>
				) : null}

				<AnimatePresence mode="wait">
					{isPhotoStep ? (
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
					) : null}

					{currentStep === "services" ? (
						<motion.div
							key="services"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.3 }}
							className="w-full"
						>
							<ServiceSwipeDeck onComplete={handleServicesComplete} />
						</motion.div>
					) : null}

					{currentStep === "analyzing" ? (
						<motion.div
							key="analyzing"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							className="flex flex-col items-center justify-center py-20"
						>
							<Loader2 className="text-primary mb-6 h-16 w-16 animate-spin" />
							<h2 className="mb-2 text-2xl font-bold text-white">{t("analyzing.title")}</h2>
							<p className="text-on-surface-variant text-sm">{t("analyzing.description")}</p>
						</motion.div>
					) : null}

					{currentStep === "results" ? (
						<motion.div
							key="results"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex flex-col items-center py-12"
						>
							<h2 className="mb-4 text-2xl font-bold text-white">{t("results.title")}</h2>
							<p className="text-on-surface-variant text-sm">{t("results.comingSoon")}</p>
						</motion.div>
					) : null}
				</AnimatePresence>

				{/* Back button for photo steps (not on first step) */}
				{isPhotoStep && currentStep !== "front" ? (
					<div className="mt-8 text-center">
						<button
							onClick={prevStep}
							className="text-on-surface-variant inline-flex items-center gap-2 transition-colors hover:text-white"
						>
							<ArrowLeft className="h-4 w-4" />
							{t("navigation.back")}
						</button>
					</div>
				) : null}
			</div>
		</div>
	);
};
