"use client";

import { AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import { PhotoDropzoneBay } from "@/features/assessment/components/PhotoDropzoneBay";
import { PhotoPreviewPanel } from "@/features/assessment/components/PhotoPreviewPanel";
import { useValidatePhoto } from "@/features/assessment/hooks/useAssessment";
import { compressImage } from "@/features/assessment/utils/imageCompressor";

import type { PhotoAngle } from "@/features/assessment/schemas/assessmentSchema";

type PhotoUploadStepProps = {
	angle: PhotoAngle;
	previousCarDescriptions: string[];
	onPhotoValidatedAction: (
		photoId: string,
		previewUrl: string,
		carSize?: "small" | "medium" | "large" | "suv",
		dirtLevel?: "light" | "moderate" | "heavy",
		carDescription?: string,
	) => void;
	onPhotoInvalidAction: (reason: string, userMessage?: string) => void;
};

export const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({
	angle,
	previousCarDescriptions,
	onPhotoValidatedAction,
	onPhotoInvalidAction,
}) => {
	const t = useTranslations("Assessment");
	const tErrors = useTranslations("Errors");
	const locale = useLocale();
	const [preview, setPreview] = useState<string | null>(null);
	const [status, setStatus] = useState<"idle" | "uploading" | "valid" | "invalid">("idle");
	const [validationReason, setValidationReason] = useState<string>("");
	const [isMobile, setIsMobile] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const uploadGenerationRef = useRef<number>(0);

	useEffect(() => {
		const checkMobile = () => {
			const userAgent = navigator.userAgent || navigator.vendor;
			const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
				userAgent.toLowerCase(),
			);
			const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent.toLowerCase());
			setIsMobile(isMobileDevice || isTablet || window.innerWidth < 1024);
		};
		checkMobile();
	}, []);

	const validatePhoto = useValidatePhoto();

	const getLocalizedError = useCallback(
		(errorCode: string) => {
			const knownCodes = [
				"FILE_INVALID",
				"FILE_READ_FAILED",
				"IMAGE_DECODE_FAILED",
				"CANVAS_CONTEXT_FAILED",
				"FILE_TOO_LARGE",
				"VALIDATION_FAILED",
			];
			if (knownCodes.includes(errorCode)) {
				return t(`upload.errors.${errorCode}`);
			}
			return errorCode || t("upload.errors.VALIDATION_FAILED");
		},
		[t],
	);

	const handleFileSelect = useCallback(
		async (file: File) => {
			const generation = ++uploadGenerationRef.current;
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

			try {
				// Compress and normalize image (JPEG format, max 1920px, max 3MB payload)
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
					);
				} else {
					setStatus("invalid");
					setValidationReason(result.userMessage || result.reason || "");
					onPhotoInvalidAction(result.reason || "", result.userMessage ?? undefined);
				}
			} catch (err: unknown) {
				if (generation !== uploadGenerationRef.current) return;
				const rawError = err instanceof Error ? err.message : "VALIDATION_FAILED";
				const isServerError =
					rawError.includes("500") ||
					rawError.includes("API error") ||
					rawError.includes("Internal Server Error") ||
					rawError.includes("Failed to fetch") ||
					rawError.includes("NetworkError");
				const userFacingError = isServerError
					? tErrors("technicalDifficulties")
					: getLocalizedError(rawError);
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
			const file = e.dataTransfer.files[0];
			if (file) handleFileSelect(file);
		},
		[handleFileSelect],
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
			if (file) handleFileSelect(file);
		},
		[handleFileSelect],
	);

	const reset = () => {
		uploadGenerationRef.current++;
		setPreview(null);
		setStatus("idle");
		setValidationReason("");
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const isInvalid = status === "invalid";

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
						isInvalid={isInvalid}
						validationReason={validationReason}
						fileInputRef={fileInputRef}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onInputChange={handleInputChange}
						onReset={reset}
					/>
				) : (
					<PhotoPreviewPanel
						angle={angle}
						preview={preview}
						status={status}
						validationReason={validationReason}
						onReset={reset}
					/>
				)}
			</AnimatePresence>
		</div>
	);
};
