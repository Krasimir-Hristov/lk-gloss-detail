"use client";

import { Camera, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import type { WizardStep } from "@/features/assessment/schemas/assessmentSchema";

export const AssessmentHeroHeader: React.FC = () => {
	const t = useTranslations("Assessment");

	return (
		<header className="mb-8 flex flex-col items-start gap-4 sm:mb-10 lg:mb-12">
			<div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#7b2dff]/35 bg-[#7b2dff]/10 px-3.5 py-1.5 backdrop-blur-md sm:gap-2.5 sm:px-4">
				<span className="relative flex h-2 w-2 shrink-0">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c026ff] opacity-75" />
					<span className="relative inline-flex h-2 w-2 rounded-full bg-[#d8b4fe]" />
				</span>
				<span className="truncate font-mono text-[10px] font-semibold tracking-[0.13em] text-[#e5d4ff] uppercase min-[390px]:text-[11px] sm:tracking-[0.16em]">
					{t("badge")}
				</span>
			</div>

			<div className="min-w-0 space-y-2.5">
				<h1 className="font-display text-[1.75rem] leading-[1.08] font-black tracking-[-0.03em] break-words min-[390px]:text-3xl sm:text-5xl lg:text-[3.25rem]">
					<span className="metallic-text">{t("title")}</span>
				</h1>
				<p className="max-w-2xl text-sm leading-relaxed text-[#b8b2c7] sm:text-lg">
					{t("subtitle")}
				</p>
			</div>

			{/* Trust Micro-Badges */}
			<div className="flex flex-wrap items-center gap-2 pt-1">
				<span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] font-medium text-[#ccc3d9] sm:px-3 sm:text-[11px]">
					<ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
					<span>{t("trust.gdpr")}</span>
				</span>
				<span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] font-medium text-[#ccc3d9] sm:px-3 sm:text-[11px]">
					<Lock className="h-3.5 w-3.5 shrink-0 text-[#d8b4fe]" aria-hidden="true" />
					<span>{t("trust.noAccount")}</span>
				</span>
				<span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] font-medium text-[#ccc3d9] sm:px-3 sm:text-[11px]">
					<Zap className="h-3.5 w-3.5 shrink-0 text-[#c026ff]" aria-hidden="true" />
					<span>{t("trust.instant")}</span>
				</span>
			</div>
		</header>
	);
};

type AssessmentStageHeaderProps = {
	isPhotoStep: boolean;
	currentStep: WizardStep;
	photoStepNumber: number;
};

export const AssessmentStageHeader: React.FC<AssessmentStageHeaderProps> = ({
	isPhotoStep,
	currentStep,
	photoStepNumber,
}) => {
	const t = useTranslations("Assessment");

	return (
		<div className="relative mb-5 flex items-center justify-between gap-3 border-b border-white/[0.07] pb-4 sm:mb-6 sm:gap-4 sm:pb-5">
			<div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#a855f7]/45 bg-[#7b2dff]/15 text-[#e9d5ff] shadow-[0_0_20px_rgba(123,45,255,0.28)] sm:h-11 sm:w-11">
					{isPhotoStep ? (
						<Camera className="h-5 w-5" aria-hidden="true" />
					) : (
						<Sparkles className="h-5 w-5" aria-hidden="true" />
					)}
				</div>
				<div className="min-w-0">
					<p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#b996ff] uppercase sm:text-[11px] sm:tracking-[0.18em]">
						{isPhotoStep
							? t("stepCounter", { current: photoStepNumber, total: 4 })
							: t("services.headingTag")}
					</p>
					<h2 className="font-display mt-0.5 text-lg font-extrabold tracking-tight break-words text-white sm:text-2xl">
						{isPhotoStep ? t(`steps.${currentStep}`) : t("services.headingTitle")}
					</h2>
				</div>
			</div>

			{isPhotoStep ? (
				<span className="hidden shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs font-bold tracking-widest text-[#9b93ad] sm:inline-flex">
					0{photoStepNumber} / 04
				</span>
			) : null}
		</div>
	);
};
