"use client";

import { Image as ImageIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useRef, useState } from "react";

import { uploadServiceImage } from "@/features/admin/actions/services";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

interface ServiceImageUploaderProps {
	imageUrl: string | null | undefined;
	isUploading: boolean;
	onUploadingChange: (uploading: boolean) => void;
	onImageChange: (url: string | null) => void;
}

export const ServiceImageUploader: React.FC<ServiceImageUploaderProps> = ({
	imageUrl,
	isUploading,
	onUploadingChange,
	onImageChange,
}) => {
	const t = useTranslations("Admin.services");
	const [uploadError, setUploadError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploadError(null);

		if (!ALLOWED_MIME_TYPES.has(file.type)) {
			setUploadError(t("form.imageInvalidType"));
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		if (file.size > MAX_IMAGE_SIZE_BYTES) {
			setUploadError(t("form.imageTooLarge"));
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		onUploadingChange(true);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const result = await uploadServiceImage(formData);
			if (result.success) {
				onImageChange(result.data);
			} else {
				setUploadError(result.error);
			}
		} catch {
			setUploadError(t("form.uploadFailed"));
		} finally {
			onUploadingChange(false);
		}
	};

	const removeImage = () => {
		onImageChange(null);
		setUploadError(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="space-y-4">
			<h4 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
				{t("form.sections.image")}
			</h4>

			<div className="flex flex-col items-start gap-4 sm:flex-row">
				<div className="relative flex aspect-video w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-800/50 transition-colors hover:border-purple-500/50">
					{imageUrl ? (
						<>
							<Image src={imageUrl} alt="Service preview" fill className="object-cover" />
							<div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity hover:opacity-100">
								<button
									type="button"
									onClick={removeImage}
									aria-label={t("form.removeImage")}
									className="cursor-pointer rounded-full bg-red-500/90 p-2 text-white hover:bg-red-500"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
						</>
					) : (
						<>
							<div className="flex flex-col items-center justify-center p-6 text-center text-neutral-500">
								{isUploading ? (
									<Loader2 className="mb-2 h-8 w-8 animate-spin text-purple-500" />
								) : (
									<ImageIcon className="mb-2 h-8 w-8" />
								)}
								<span className="text-sm">
									{isUploading ? t("form.uploading") : t("form.uploadPrompt")}
								</span>
							</div>
							<input
								type="file"
								ref={fileInputRef}
								aria-label={t("form.uploadPrompt")}
								accept="image/png, image/jpeg, image/webp"
								onChange={handleImageUpload}
								disabled={isUploading}
								className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
							/>
						</>
					)}
				</div>

				<div className="flex flex-col gap-1.5 text-xs text-neutral-400">
					<p>{t("form.imageFormatHint")}</p>
					<p>{t("form.imageRatioHint")}</p>
					<p>{t("form.imageMaxSizeHint")}</p>
					{uploadError ? <p className="font-medium text-red-400">{uploadError}</p> : null}
				</div>
			</div>
		</div>
	);
};
