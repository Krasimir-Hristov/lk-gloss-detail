"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import React, { useCallback, useEffect, useRef } from "react";

import { AssessmentAnalyzing } from "@/features/assessment/components/AssessmentAnalyzing";
import { AssessmentDossier } from "@/features/assessment/components/AssessmentDossier";
import {
	AssessmentHeroHeader,
	AssessmentStageHeader,
} from "@/features/assessment/components/AssessmentHeroHeader";
import { AssessmentReport } from "@/features/assessment/components/AssessmentReport";
import {
	AssessmentErrorCard,
	NoServicesSelectedCard,
} from "@/features/assessment/components/AssessmentResultFallback";
import { PhotoUploadStep } from "@/features/assessment/components/PhotoUploadStep";
import { ProgressIndicator } from "@/features/assessment/components/ProgressIndicator";
import { ServiceSwipeDeck } from "@/features/assessment/components/ServiceSwipeDeck";
import {
	PHOTO_STEPS,
	AssessmentResultSchema,
} from "@/features/assessment/schemas/assessmentSchema";
import { useAssessmentStore } from "@/features/assessment/stores/assessmentStore";
import { extractVehicleTelemetry } from "@/features/assessment/types/assessmentService";

import type { PhotoAngle, WizardStep } from "@/features/assessment/schemas/assessmentSchema";

export const AssessmentWizard: React.FC = () => {
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

	const stageRef = useRef<HTMLDivElement>(null);
	const isFirstRender = useRef(true);

	// Smoothly scroll stage into view when moving between steps
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		if (stageRef.current) {
			const top = stageRef.current.getBoundingClientRect().top + window.scrollY - 108;
			window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
		}
	}, [currentStep]);

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

	const handlePhotoInvalidAction = useCallback((_reason: string, _userMessage?: string) => {
		// Validation reason is rendered directly in PhotoUploadStep
	}, []);

	// ── Trigger analysis after services are swiped ──────────────────────────
	const handleServicesComplete = useCallback(async () => {
		const state = useAssessmentStore.getState();
		const acceptedIds = state.services.filter((s) => s.accepted).map((s) => s.serviceId);

		if (acceptedIds.length === 0) {
			clearPhotos();
			goToStep("results");
			return;
		}

		const { carSize, dirtLevel, brand } = extractVehicleTelemetry(state.photos);

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
	const isSplitLayout = isPhotoStep || currentStep === "services";
	const photoStepIndex = PHOTO_STEPS.indexOf(currentStep);
	const photoStepNumber = photoStepIndex >= 0 ? photoStepIndex + 1 : 1;

	const previousCarDescriptions = photos
		.filter((p) => p.validationStatus === "valid" && p.carDescription)
		.map((p) => p.carDescription!);

	const handleRetryToServices = () => {
		setError(null);
		setIsAnalyzing(false);
		goToStep("services");
	};

	return (
		<div
			data-testid="assessment-wizard"
			className="relative mx-auto w-full max-w-7xl px-4 md:px-12"
		>
			{/* Editorial AI Vision Lab Header (shown during capture & configurator steps) */}
			{isSplitLayout ? <AssessmentHeroHeader /> : null}

			{/* Stage Viewport */}
			<div ref={stageRef}>
				{isSplitLayout ? (
					<div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-12 xl:gap-9">
						{/* Left 7 Columns: Progress Pipeline + Main Obsidian Stage Card */}
						<div className="lg:col-span-7">
							{isPhotoStep ? (
								<ProgressIndicator currentStep={currentStep} completedSteps={completedSteps} />
							) : null}

							<div className="obsidian-card relative overflow-hidden rounded-3xl p-5 sm:p-7 md:p-8">
								{/* Specular Top Hairline & Ambient Corner Aura */}
								<div className="pointer-events-none absolute top-0 right-10 left-10 h-px bg-linear-to-r from-transparent via-[#c026ff]/75 to-transparent" />
								<div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#7b2dff]/12 blur-[90px]" />

								<AssessmentStageHeader
									isPhotoStep={isPhotoStep}
									currentStep={currentStep}
									photoStepNumber={photoStepNumber}
								/>

								{/* Animated Active Stage */}
								<div className="relative">
									<AnimatePresence mode="wait">
										{isPhotoStep ? (
											<motion.div
												key={currentStep}
												initial={{ opacity: 0, x: 16 }}
												animate={{ opacity: 1, x: 0 }}
												exit={{ opacity: 0, x: -16 }}
												transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
											>
												<PhotoUploadStep
													angle={currentStep as PhotoAngle}
													previousCarDescriptions={previousCarDescriptions}
													onPhotoValidatedAction={handlePhotoValidatedAction}
													onPhotoInvalidAction={handlePhotoInvalidAction}
												/>
											</motion.div>
										) : (
											<motion.div
												key="services"
												initial={{ opacity: 0, y: 12 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -12 }}
												transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
												className="w-full"
											>
												<ServiceSwipeDeck onCompleteAction={handleServicesComplete} />
											</motion.div>
										)}
									</AnimatePresence>
								</div>

								{/* Integrated Back Button for Photo Steps 2–4 */}
								{isPhotoStep && currentStep !== "front" ? (
									<div className="mt-6 border-t border-white/[0.07] pt-5">
										<button
											type="button"
											onClick={prevStep}
											aria-label={t("navigation.back")}
											className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[#ccc3d9] transition-all hover:border-[#a855f7]/50 hover:bg-[#7b2dff]/12 hover:text-white"
										>
											<ArrowLeft className="h-4 w-4" aria-hidden="true" />
											<span>{t("navigation.back")}</span>
										</button>
									</div>
								) : null}
							</div>
						</div>

						{/* Right 5 Columns: Sticky Live Vehicle Scan Dossier */}
						<div className="lg:sticky lg:top-24 lg:col-span-5">
							<AssessmentDossier />
						</div>
					</div>
				) : (
					<AnimatePresence mode="wait">
						{currentStep === "analyzing" ? <AssessmentAnalyzing /> : null}

						{currentStep === "results" ? (
							<motion.div
								key="results"
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -12 }}
								transition={{ duration: 0.35 }}
							>
								{error ? (
									<AssessmentErrorCard onRetry={handleRetryToServices} />
								) : result ? (
									<AssessmentReport result={result} />
								) : (
									<NoServicesSelectedCard onBackToServices={handleRetryToServices} />
								)}
							</motion.div>
						) : null}
					</AnimatePresence>
				)}
			</div>
		</div>
	);
};
