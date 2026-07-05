"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Upload, Camera, Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { v4 as uuidv4 } from "uuid";

import type { PhotoAngle } from "@/features/assessment/schemas/assessment.schema";
import { useValidatePhoto } from "@/features/assessment/hooks/use-assessment";

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

export const PhotoUploadStep = ({
	angle,
	previousCarDescriptions,
	onPhotoValidatedAction,
	onPhotoInvalidAction,
}: PhotoUploadStepProps) => {
	const t = useTranslations("Assessment");
	const locale = useLocale();
	const [preview, setPreview] = useState<string | null>(null);
	const [status, setStatus] = useState<"idle" | "uploading" | "valid" | "invalid">("idle");
	const [validationReason, setValidationReason] = useState<string>("");
	const [isMobile, setIsMobile] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

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

	const handleFileSelect = useCallback(
		async (file: File) => {
			if (!file.type.startsWith("image/")) {
				setStatus("invalid");
				setValidationReason(t("upload.error"));
				onPhotoInvalidAction("Not an image file", t("upload.error"));
				return;
			}

			// Generate photo ID upfront so it matches the store
			const photoId = uuidv4();

			// Single FileReader for both preview and API
			const reader = new FileReader();
			reader.onload = async (e) => {
				const base64 = e.target?.result as string;
				setPreview(base64);
				setStatus("uploading");

				try {
					const result = await validatePhoto.mutateAsync({
						imageBase64: base64,
						expectedAngle: angle,
						previousCarDescriptions,
						locale,
					});

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
					const errorMessage = err instanceof Error ? err.message : "Validation failed";
					setStatus("invalid");
					setValidationReason(errorMessage);
					onPhotoInvalidAction(errorMessage);
				}
			};
			reader.readAsDataURL(file);
		},
		[angle, onPhotoValidatedAction, onPhotoInvalidAction, validatePhoto, previousCarDescriptions, locale, t],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const file = e.dataTransfer.files[0];
			if (file) handleFileSelect(file);
		},
		[handleFileSelect],
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleFileSelect(file);
		},
		[handleFileSelect],
	);

	const reset = () => {
		setPreview(null);
		setStatus("idle");
		setValidationReason("");
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	return (
		<div className="flex flex-col items-center gap-6">
			<h2 className="text-2xl font-bold text-white">{t(`steps.${angle}`)}</h2>

			<AnimatePresence mode="wait">
				{!preview ? (
					<motion.div
						key="upload"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="w-full max-w-md"
					>
						<div
							onDrop={handleDrop}
							onDragOver={(e) => e.preventDefault()}
							className="bg-surface-container hover:bg-surface-container-high flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-500/50 p-12 transition-colors hover:border-purple-500"
						>
							<Upload className="mb-4 h-12 w-12 text-purple-400" />
							<p className="mb-2 text-lg font-medium text-white">{t("upload.dragDrop")}</p>
							<p className="text-on-surface-variant mb-6 text-sm">{t("upload.orClick")}</p>

							<div className="flex gap-3">
								<button
									onClick={() => fileInputRef.current?.click()}
									className="bg-primary text-on-primary hover:bg-primary/90 rounded-lg px-6 py-3 font-medium transition-colors"
								>
									{t("upload.chooseFile")}
								</button>
								{isMobile && (
									<label className="bg-secondary text-on-secondary hover:bg-secondary/90 cursor-pointer rounded-lg px-6 py-3 font-medium transition-colors">
										<Camera className="mr-2 inline h-5 w-5" />
										{t("upload.takePhoto")}
										<input
											type="file"
											accept="image/*"
											capture="environment"
											onChange={handleInputChange}
											className="hidden"
										/>
									</label>
								)}
							</div>

							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleInputChange}
								className="hidden"
							/>
						</div>
					</motion.div>
				) : (
					<motion.div
						key="preview"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						className="flex flex-col items-center gap-6"
					>
						<div className="border-surface-container-high relative h-64 w-full max-w-sm overflow-hidden rounded-2xl border-4">
							<img src={preview} alt="Preview" className="h-full w-full object-cover" />
							{status === "uploading" && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/60">
									<Loader2 className="text-primary h-12 w-12 animate-spin" />
								</div>
							)}
							{status === "valid" && (
								<div className="absolute top-4 right-4 rounded-full bg-green-500 p-2 text-white">
									<CheckCircle className="h-6 w-6" />
								</div>
							)}
							{status === "invalid" && (
								<div className="absolute top-4 right-4 rounded-full bg-red-500 p-2 text-white">
									<XCircle className="h-6 w-6" />
								</div>
							)}
						</div>

						{status === "invalid" && (
							<div className="text-center">
								<p className="mb-4 text-red-400">{validationReason}</p>
								<button
									onClick={reset}
									className="bg-surface-container-high hover:bg-surface-container-highest rounded-lg px-6 py-2 font-medium text-white transition-colors"
								>
									{t("validation.tryAgain")}
								</button>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
