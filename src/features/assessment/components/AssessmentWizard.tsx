"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useCallback } from "react";

import { AssessmentReport } from "@/features/assessment/components/AssessmentReport";
import { PhotoUploadStep } from "@/features/assessment/components/PhotoUploadStep";
import { ProgressIndicator } from "@/features/assessment/components/ProgressIndicator";
import { ServiceSwipeDeck } from "@/features/assessment/components/ServiceSwipeDeck";
import {
	PHOTO_STEPS,
	AssessmentResultSchema,
} from "@/features/assessment/schemas/assessment.schema";
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
		clearPhotos,
		goToStep,
	} = useAssessmentStore();

	const result = useAssessmentStore((s) => s.result);
	const error = useAssessmentStore((s) => s.error);

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
			// Store the photo with the SAME id from the upload step
			setPhoto(currentStep as PhotoAngle, previewUrl, photoId);

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
			clearPhotos();
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
				let errorMsg = "Analysis failed";
				try {
					const err = await res.json();
					errorMsg = (err as { error?: string }).error ?? errorMsg;
				} catch {
					// Response body is not JSON — use text or default
					errorMsg = (await res.text().catch(() => "")) || errorMsg;
				}
				throw new Error(errorMsg);
			}

			const rawBody = await res.json();
			const parsed = AssessmentResultSchema.safeParse(rawBody);

			if (!parsed.success) {
				console.error("[AssessmentWizard] Response validation failed:", parsed.error.flatten());
				throw new Error("Invalid response from server");
			}

			setResult(parsed.data);

			// Clear base64 images from browser memory
			clearPhotos();

			goToStep("results");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Analysis failed";
			console.error("[AssessmentWizard] Analysis error:", message);
			setError(message);
			goToStep("results");
		}
	}, [locale, setResult, setIsAnalyzing, setError, clearPhotos, goToStep]);

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
							<ServiceSwipeDeck onCompleteAction={handleServicesComplete} />
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
							{error ? (
								// Error state
								<div className="flex flex-col items-center gap-4 text-center">
									<div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
										<AlertCircle className="h-8 w-8 text-red-400" />
									</div>
									<h2 className="text-2xl font-bold text-white">{t("results.errorTitle")}</h2>
									<p className="text-on-surface-variant max-w-md text-sm">{error}</p>
									<button
										onClick={() => {
											setError(null);
											setIsAnalyzing(false);
											goToStep("services");
										}}
										className="mt-4 rounded-lg bg-[#7b2dff] px-6 py-3 font-medium text-white transition-colors hover:bg-[#7b2dff]/80"
									>
										{t("results.retry")}
									</button>
								</div>
							) : result ? (
								// Success state — use the AssessmentReport component
								<div className="w-full max-w-2xl">
									<AssessmentReport result={result} />
								</div>
							) : (
								// Fallback (shouldn't happen)
								<p className="text-on-surface-variant text-sm">{t("results.comingSoon")}</p>
							)}
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
