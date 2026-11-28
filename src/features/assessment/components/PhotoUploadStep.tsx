"use client";

import { AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { v4 as uuidv4 } from "uuid";

import { PhotoDropzoneBay } from "@/features/assessment/components/PhotoDropzoneBay";
import { PhotoPreviewPanel } from "@/features/assessment/components/PhotoPreviewPanel";
import { useValidatePhoto } from "@/features/assessment/hooks/useAssessment";
import { useAssessmentStore } from "@/features/assessment/stores/assessmentStore";
import { compressImage } from "@/features/assessment/utils/imageCompressor";
import { resolveAppLocale } from "@/i18n/locales";

import type { PhotoAngle } from "@/features/assessment/schemas/assessmentSchema";

const subscribeMobile = (callback: () => void) => {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
	const mq = window.matchMedia("(pointer: coarse)");
	mq.addEventListener("change", callback);
	return () => mq.removeEventListener("change", callback);
};

const getMobileSnapshot = () => {
	const ua = (navigator.userAgent || navigator.vendor || "").toLowerCase();
	const isUaMobile =
		/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua) ||
		/ipad|android(?!.*mobile)/i.test(ua);
	const hasCoarse =
		typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
	return isUaMobile || hasCoarse;
};

const KNOWN_ERROR_CODES = new Set([
	"FILE_INVALID",
	"FILE_READ_FAILED",
	"IMAGE_DECODE_FAILED",
	"CANVAS_CONTEXT_FAILED",
	"FILE_TOO_LARGE",
	"VALIDATION_FAILED",
	"RATE_LIMITED",
	"HEIC_UNSUPPORTED",
]);

const getMobileServerSnapshot = () => false;

type PhotoUploadStepProps = {
	angle: PhotoAngle;
	previousCarDescriptions: string[];
	onPhotoValidatedAction: (
		photoId: string,
		previewUrl: string,
		carSize?: "small" | "medium" | "large" | "suv",
		dirtLevel?: "light" | "moderate" | "heavy",
		carDescription?: string,
		visualFindings?: string[],
	) => void;
	onPhotoInvalidAction: (reason: string, userMessage?: string) => void;
	onContinueAction?: () => void;
	onResetAction?: () => void;
	onUploadingChange?: (isUploading: boolean) => void;
};

export const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({
	angle,
	previousCarDescriptions,
	onPhotoValidatedAction,
	onPhotoInvalidAction,
	onContinueAction,
	onResetAction,
	onUploadingChange,
}) => {
	const t = useTranslations("Assessment");
	const tErrors = useTranslations("Errors");
	const rawLocale = useLocale();
	const locale = resolveAppLocale(rawLocale);
	const existingPhoto = useAssessmentStore((s) => s.photos.find((p) => p.angle === angle));

	const [preview, setPreview] = useState<string | null>(() =>
		existingPhoto?.validationStatus === "valid" ? existingPhoto.previewUrl : null,
	);
	const [status, setStatus] = useState<"idle" | "uploading" | "valid" | "invalid">(() =>
		existingPhoto?.validationStatus === "valid" ? "valid" : "idle",
	);
	const [validationReason, setValidationReason] = useState<string>(() =>
		existingPhoto?.validationStatus === "valid" ? (existingPhoto.validationReason ?? "") : "",
	);
	const isMobile = useSyncExternalStore(
		subscribeMobile,
		getMobileSnapshot,
		getMobileServerSnapshot,
	);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const uploadGenerationRef = useRef<number>(0);

	const invalidateUploads = useCallback(() => {
		uploadGenerationRef.current += 1;
	}, []);

	useEffect(() => {
		return () => {
			invalidateUploads();
			onUploadingChange?.(false);
		};
	}, [invalidateUploads, onUploadingChange]);

	useEffect(() => {
		onUploadingChange?.(status === "uploading");
	}, [status, onUploadingChange]);

	const validatePhoto = useValidatePhoto();

	const getLocalizedError = useCallback(
		(errorCode: string) =>
			KNOWN_ERROR_CODES.has(errorCode)
				? t(`upload.errors.${errorCode}`)
				: errorCode || t("upload.errors.VALIDATION_FAILED"),
		[t],
	);

	const handleFileSelect = useCallback(
		async (file: File) => {
			const generation = ++uploadGenerationRef.current;
			const isHeic =
				/\.(heic|heif)$/i.test(file.name) ||
				file.type === "image/heic" ||
				file.type === "image/heif";
			const isImage =
				file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif|bmp)$/i.test(file.name);
			if (!isImage) {
				if (generation !== uploadGenerationRef.current) return;
				const invalidMsg = getLocalizedError("FILE_INVALID");
				setStatus("invalid");
				setValidationReason(invalidMsg);
				onPhotoInvalidAction("Not an image file", invalidMsg);
				return;
			}

			// Generate photo ID upfront so it matches the store
			const photoId = uuidv4();
			if (generation !== uploadGenerationRef.current) return;
			setStatus("uploading");
			setValidationReason("");

			try {
				// Compress and normalize image (JPEG format, max 1280px, max 3MB payload)
				const base64 = await compressImage(file);
				if (generation !== uploadGenerationRef.current) return;
				setPreview(base64);

				const result = await validatePhoto.mutateAsync({
					imageBase64: base64,
					expectedAngle: angle,
					previousCarDescriptions,
					locale,
				});

				if (generation !== uploadGenerationRef.current) return;

				if (result.valid) {
					setStatus("valid");
					setValidationReason(result.userMessage || result.reason || "");
					onPhotoValidatedAction(
						photoId,
						base64,
						result.carSize ?? undefined,
						result.dirtLevel ?? undefined,
						result.carDescription ?? undefined,
						result.visualFindings,
					);
				} else {
					setStatus("invalid");
					setValidationReason(result.userMessage || result.reason || "");
					onPhotoInvalidAction(result.reason || "", result.userMessage ?? undefined);
				}
			} catch (err: unknown) {
				if (generation !== uploadGenerationRef.current) return;
				const rawError = err instanceof Error ? err.message : "VALIDATION_FAILED";
				const normalizedCode =
					rawError === "IMAGE_DECODE_FAILED" && isHeic ? "HEIC_UNSUPPORTED" : rawError;
				const isRateLimited = normalizedCode === "RATE_LIMITED" || normalizedCode.includes("429");
				const isServerError =
					!isRateLimited &&
					(normalizedCode.includes("500") ||
						normalizedCode.includes("API error") ||
						normalizedCode.includes("Internal Server Error") ||
						normalizedCode.includes("Failed to fetch") ||
						normalizedCode.includes("NetworkError"));
				const userFacingError = isRateLimited
					? getLocalizedError("RATE_LIMITED")
					: isServerError
						? tErrors("technicalDifficulties")
						: getLocalizedError(normalizedCode);
				setStatus("invalid");
				setValidationReason(userFacingError);
				onPhotoInvalidAction(rawError, userFacingError);
			}
		},
		[
			angle,
			onPhotoValidatedAction,
			onPhotoInvalidAction,
			validatePhoto,
			previousCarDescriptions,
			locale,
			getLocalizedError,
			tErrors,
		],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			if (status === "uploading") return;
			const file = e.dataTransfer.files[0];
			if (file) handleFileSelect(file);
		},
		[handleFileSelect, status],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setIsDragging(false);
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			e.target.value = "";
			if (file) handleFileSelect(file);
		},
		[handleFileSelect],
	);

	const reset = useCallback(() => {
		onResetAction?.();
		uploadGenerationRef.current++;
		setPreview(null);
		setStatus("idle");
		setValidationReason("");
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, [onResetAction]);

	const handleCancel = useCallback(() => {
		uploadGenerationRef.current++;
		if (fileInputRef.current) fileInputRef.current.value = "";
		if (existingPhoto?.validationStatus === "valid") {
			setPreview(existingPhoto.previewUrl);
			setStatus("valid");
			setValidationReason(existingPhoto.validationReason ?? "");
		} else {
			setPreview(null);
			setStatus("idle");
			setValidationReason("");
		}
	}, [existingPhoto]);

	return (
		<div className="flex flex-col gap-5">
			{/* Angle Capture Instruction Hint */}
			<p className="text-sm leading-relaxed text-[#b8b2c7]">{t(`angleHints.${angle}`)}</p>

			<AnimatePresence mode="wait">
				{preview === null ? (
					<PhotoDropzoneBay
						angle={angle}
						isDragging={isDragging}
						isMobile={isMobile}
						isUploading={status === "uploading"}
						isInvalid={status === "invalid"}
						validationReason={validationReason}
						fileInputRef={fileInputRef}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onInputChange={handleInputChange}
						onReset={reset}
						onCancel={handleCancel}
					/>
				) : (
					<PhotoPreviewPanel
						angle={angle}
						preview={preview}
						status={status}
						validationReason={validationReason}
						onReset={reset}
						onCancel={handleCancel}
						onContinue={onContinueAction}
					/>
				)}
			</AnimatePresence>
		</div>
	);
};
