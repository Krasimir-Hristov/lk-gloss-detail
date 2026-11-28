"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, RotateCcw, ScanLine, X, XCircle } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React from "react";

import { cn } from "@/lib/utils";

import type { PhotoAngle } from "@/features/assessment/schemas/assessmentSchema";

type PhotoPreviewPanelProps = {
	angle: PhotoAngle;
	preview: string;
	status: "idle" | "uploading" | "valid" | "invalid";
	validationReason: string;
	onReset: () => void;
	onCancel?: () => void;
	onContinue?: () => void;
};

export const PhotoPreviewPanel: React.FC<PhotoPreviewPanelProps> = ({
	angle,
	preview,
	status,
	validationReason,
	onReset,
	onCancel,
	onContinue,
}) => {
	const t = useTranslations("Assessment");

	const isUploading = status === "uploading";
	const isValid = status === "valid";
	const isInvalid = status === "invalid";

	return (
		<motion.div
			key="preview"
			initial={{ opacity: 0, scale: 0.96 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.96 }}
			transition={{ duration: 0.25 }}
			className="flex flex-col gap-5"
		>
			{/* Optical Scanner Preview Frame */}
			<div
				className={cn(
					"relative aspect-16/10 w-full overflow-hidden rounded-2xl border-2 bg-black transition-all duration-300",
					isValid && "border-emerald-400/75 shadow-[0_0_32px_rgba(16,185,129,0.28)]",
					isInvalid && "border-rose-500/70 shadow-[0_0_28px_rgba(244,63,94,0.22)]",
					isUploading && "border-[#a855f7]/80 shadow-[0_0_32px_rgba(123,45,255,0.35)]",
				)}
			>
				<Image src={preview} alt={t(`steps.${angle}`)} fill unoptimized className="object-cover" />

				{/* Corner Viewfinder Reticles */}
				<span className="pointer-events-none absolute top-3 left-3 z-20 h-4 w-4 border-t-2 border-l-2 border-white/75" />
				<span className="pointer-events-none absolute top-3 right-3 z-20 h-4 w-4 border-t-2 border-r-2 border-white/75" />
				<span className="pointer-events-none absolute bottom-3 left-3 z-20 h-4 w-4 border-b-2 border-l-2 border-white/75" />
				<span className="pointer-events-none absolute right-3 bottom-3 z-20 h-4 w-4 border-r-2 border-b-2 border-white/75" />

				{isUploading ? (
					<div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
						<div className="scanline-beam pointer-events-none absolute inset-x-0 top-0 h-1/2" />
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c026ff]/60 bg-black/70 shadow-[0_0_28px_rgba(192,38,255,0.45)]">
							<Loader2 className="h-7 w-7 animate-spin text-[#d8b4fe]" aria-hidden="true" />
						</div>
						<div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#a855f7]/45 bg-black/75 px-4 py-1.5 backdrop-blur-md">
							<ScanLine className="h-3.5 w-3.5 text-[#d8b4fe]" aria-hidden="true" />
							<span className="font-mono text-xs font-semibold text-white">
								{t("upload.scanning")}
							</span>
						</div>
						{onCancel ? (
							<button
								type="button"
								onClick={onCancel}
								aria-label={t("upload.cancel")}
								className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 bg-black/70 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:border-white/40 hover:bg-white/15"
							>
								<X className="h-3.5 w-3.5" aria-hidden="true" />
								<span>{t("upload.cancel")}</span>
							</button>
						) : null}
					</div>
				) : null}

				{isValid ? (
					<div className="absolute right-3 bottom-3 left-3 z-20 flex items-center justify-between gap-2.5 rounded-xl border border-emerald-400/50 bg-black/75 px-3.5 py-2 backdrop-blur-xl sm:right-4 sm:bottom-4 sm:left-4 sm:gap-3 sm:px-4 sm:py-2.5">
						<div className="flex min-w-0 items-center gap-2 text-emerald-300 sm:gap-2.5">
							<CheckCircle2 className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
							<span className="truncate text-xs font-bold sm:text-sm">{t("validation.valid")}</span>
						</div>
						<span className="shrink-0 font-mono text-[11px] font-bold tracking-widest text-emerald-200 uppercase">
							OK
						</span>
					</div>
				) : null}

				{isInvalid ? (
					<div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 rounded-full border border-rose-400/55 bg-rose-600/90 px-3 py-1 text-xs font-bold text-white shadow-lg">
						<XCircle className="h-4 w-4" aria-hidden="true" />
						<span>{t("validation.invalid")}</span>
					</div>
				) : null}
			</div>

			{isValid ? (
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<button
						type="button"
						onClick={onReset}
						aria-label={t("validation.uploadDifferent")}
						className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/4 px-5 py-3 text-sm font-semibold text-[#e5e2e1] transition-all hover:border-[#a855f7]/60 hover:bg-[#7b2dff]/15 hover:text-white"
					>
						<RotateCcw className="h-4 w-4" aria-hidden="true" />
						<span>{t("validation.uploadDifferent")}</span>
					</button>
					{onContinue ? (
						<button
							type="button"
							onClick={onContinue}
							aria-label={t("validation.continue")}
							className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_28px_-6px_rgba(123,45,255,0.5)] transition-all hover:brightness-110 active:scale-[0.98]"
						>
							<span>{t("validation.continue")}</span>
							<ArrowRight className="h-4 w-4" aria-hidden="true" />
						</button>
					) : null}
				</div>
			) : null}

			{isInvalid ? (
				<div
					role="alert"
					aria-live="assertive"
					className="flex flex-col items-center gap-4 rounded-2xl border border-rose-500/35 bg-rose-500/8 p-5 text-center"
				>
					<p className="text-sm leading-relaxed text-rose-200">{validationReason}</p>
					<button
						type="button"
						onClick={onReset}
						aria-label={t("validation.tryAgain")}
						className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] to-[#c026ff] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_28px_-6px_rgba(123,45,255,0.5)] transition-all hover:brightness-110 active:scale-[0.98]"
					>
						<RotateCcw className="h-4 w-4" aria-hidden="true" />
						<span>{t("validation.tryAgain")}</span>
					</button>
				</div>
			) : null}
		</motion.div>
	);
};
