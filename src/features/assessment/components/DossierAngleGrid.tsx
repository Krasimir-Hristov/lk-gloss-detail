"use client";

import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React from "react";

import { AngleSilhouetteGuide } from "@/features/assessment/components/AngleSilhouetteGuide";
import { PHOTO_STEPS } from "@/features/assessment/schemas/assessmentSchema";
import { cn } from "@/lib/utils";

import type {
	AssessmentPhoto,
	PhotoAngle,
	WizardStep,
} from "@/features/assessment/schemas/assessmentSchema";

type DossierAngleGridProps = {
	currentStep: WizardStep;
	validPhotos: AssessmentPhoto[];
};

export const DossierAngleGrid: React.FC<DossierAngleGridProps> = ({ currentStep, validPhotos }) => {
	const t = useTranslations("Assessment");
	const tDossier = useTranslations("Assessment.dossier");

	return (
		<div>
			<p className="mb-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#9b93ad] uppercase">
				{tDossier("anglesTitle")}
			</p>
			<div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
				{PHOTO_STEPS.map((step, index) => {
					const angle = step as PhotoAngle;
					const captured = validPhotos.find((p) => p.angle === angle);
					const isActive = currentStep === angle;
					const code = String(index + 1).padStart(2, "0");

					return (
						<div
							key={angle}
							className={cn(
								"relative overflow-hidden rounded-2xl border p-2.5 transition-all duration-300",
								captured
									? "border-emerald-400/40 bg-emerald-500/[0.07]"
									: isActive
										? "border-[#a855f7]/55 bg-[#7b2dff]/14 shadow-[0_0_20px_rgba(123,45,255,0.2)]"
										: "border-white/[0.07] bg-white/2.5",
							)}
						>
							<div className="flex items-center gap-2.5">
								{captured ? (
									<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-emerald-400/40 bg-black">
										<Image
											src={captured.previewUrl}
											alt={t(`steps.${angle}`)}
											fill
											unoptimized
											className="object-cover"
										/>
									</div>
								) : (
									<div
										className={cn(
											"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
											isActive
												? "border-[#a855f7]/50 bg-[#7b2dff]/20 text-[#e9d5ff]"
												: "border-white/[0.07] bg-black/40 text-[#6f6882]",
										)}
									>
										<AngleSilhouetteGuide angle={angle} className="h-6 w-8" />
									</div>
								)}

								<div className="min-w-0 flex-1">
									<p className="truncate text-xs font-bold text-white">
										{code}. {t(`steps.${angle}`)}
									</p>
									{captured ? (
										<p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-300">
											<CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
											<span className="truncate">{tDossier("verified")}</span>
										</p>
									) : isActive ? (
										<p className="mt-0.5 truncate font-mono text-[10px] font-semibold text-[#d8b4fe]">
											{tDossier("activeNow")}
										</p>
									) : (
										<p className="mt-0.5 truncate font-mono text-[10px] text-[#7a738c]">
											{tDossier("awaiting")}
										</p>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
