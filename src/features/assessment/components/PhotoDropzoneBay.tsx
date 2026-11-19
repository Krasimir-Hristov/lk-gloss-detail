"use client";

import { motion } from "framer-motion";
import { Camera, RotateCcw, Upload, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { AngleSilhouetteGuide } from "@/features/assessment/components/AngleSilhouetteGuide";
import { cn } from "@/lib/utils";

import type { PhotoAngle } from "@/features/assessment/schemas/assessmentSchema";

type PhotoDropzoneBayProps = {
	angle: PhotoAngle;
	isDragging: boolean;
	isMobile: boolean;
	isInvalid: boolean;
	validationReason: string;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	onDrop: (e: React.DragEvent) => void;
	onDragOver: (e: React.DragEvent) => void;
	onDragLeave: () => void;
	onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onReset: () => void;
};

export const PhotoDropzoneBay: React.FC<PhotoDropzoneBayProps> = ({
	angle,
	isDragging,
	isMobile,
	isInvalid,
	validationReason,
	fileInputRef,
	onDrop,
	onDragOver,
	onDragLeave,
	onInputChange,
	onReset,
}) => {
	const t = useTranslations("Assessment");

	return (
		<motion.div
			key="upload"
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -12 }}
			transition={{ duration: 0.25 }}
		>
			<div
				onDrop={onDrop}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				className={cn(
					"relative overflow-hidden rounded-2xl border border-dashed px-5 py-9 text-center transition-all duration-300 sm:px-8 sm:py-12",
					isDragging
						? "scale-[1.01] border-[#c026ff] bg-[#7b2dff]/15 shadow-[0_0_40px_rgba(192,38,255,0.28)]"
						: "border-[#7b2dff]/45 bg-[#09090e]/85 hover:border-[#a855f7]/75 hover:bg-[#0e0c18]/90",
				)}
			>
				{/* Subtle Atelier Grid & Animated Scanner Beam */}
				<div className="atelier-grid pointer-events-none absolute inset-0 opacity-40" />
				<div className="scanline-beam pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-60" />

				{/* Viewfinder Corner Reticles */}
				<span className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-[#a855f7]/75" />
				<span className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2 border-[#a855f7]/75" />
				<span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-[#a855f7]/75" />
				<span className="pointer-events-none absolute right-3 bottom-3 h-4 w-4 border-r-2 border-b-2 border-[#a855f7]/75" />

				<div className="relative flex flex-col items-center">
					{/* Angle Silhouette Emblem */}
					<div className="mb-5 flex h-20 w-28 items-center justify-center rounded-2xl border border-[#7b2dff]/35 bg-[#7b2dff]/10 text-[#e5e2e1] shadow-[0_0_30px_rgba(123,45,255,0.22)]">
						<AngleSilhouetteGuide angle={angle} className="h-12 w-20" />
					</div>

					<p className="font-display text-lg font-extrabold tracking-tight text-white sm:text-xl">
						{t("upload.dragDrop")}
					</p>
					<p className="mt-1.5 mb-6 text-xs text-[#9b93ad] sm:text-sm">{t("upload.orClick")}</p>

					{/* Primary & Camera CTAs */}
					<div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							aria-label={t("upload.chooseFile")}
							className="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-6 py-3.5 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_32px_-6px_rgba(123,45,255,0.58)] transition-all hover:brightness-110 active:scale-[0.98]"
						>
							<Upload className="h-4 w-4" aria-hidden="true" />
							<span>{t("upload.chooseFile")}</span>
						</button>

						{isMobile ? (
							<label
								aria-label={t("upload.takePhoto")}
								className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-[#a855f7]/60 hover:bg-[#7b2dff]/18"
							>
								<Camera className="h-4 w-4 text-[#d8b4fe]" aria-hidden="true" />
								<span>{t("upload.takePhoto")}</span>
								<input
									type="file"
									accept="image/*"
									capture="environment"
									onChange={onInputChange}
									className="hidden"
								/>
							</label>
						) : null}
					</div>

					<p className="mt-5 font-mono text-[11px] tracking-wide text-[#7a738c]">
						{t("upload.formats")}
					</p>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={onInputChange}
						className="hidden"
					/>
				</div>
			</div>

			{isInvalid && validationReason ? (
				<div
					role="alert"
					aria-live="assertive"
					className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-rose-500/35 bg-rose-500/[0.08] p-4 text-center sm:flex-row sm:justify-between sm:text-left"
				>
					<div className="flex items-center gap-2.5 text-sm text-rose-200">
						<XCircle className="h-5 w-5 shrink-0 text-rose-400" aria-hidden="true" />
						<span>{validationReason}</span>
					</div>
					<button
						type="button"
						onClick={onReset}
						aria-label={t("validation.tryAgain")}
						className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
					>
						<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
						<span>{t("validation.tryAgain")}</span>
					</button>
				</div>
			) : null}
		</motion.div>
	);
};
