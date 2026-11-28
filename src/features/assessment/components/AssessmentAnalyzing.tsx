"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Cpu, ScanLine, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

const STAGE_KEYS = ["stage1", "stage2", "stage3"] as const;

export const AssessmentAnalyzing: React.FC = () => {
	const t = useTranslations("Assessment.analyzing");
	const [activeStage, setActiveStage] = useState(0);

	useEffect(() => {
		const timer1 = setTimeout(() => setActiveStage(1), 1600);
		const timer2 = setTimeout(() => setActiveStage(2), 3400);
		return () => {
			clearTimeout(timer1);
			clearTimeout(timer2);
		};
	}, []);

	return (
		<motion.div
			key="analyzing"
			initial={{ opacity: 0, scale: 0.97 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.97 }}
			transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
			className="mx-auto w-full max-w-2xl"
		>
			<div className="obsidian-card relative overflow-hidden rounded-3xl px-5 py-9 text-center sm:px-12 sm:py-16">
				{/* Specular top strip & laser scanline */}
				<div className="pointer-events-none absolute top-0 right-12 left-12 h-px bg-linear-to-r from-transparent via-[#c026ff]/80 to-transparent" />
				<div className="scanline-beam pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-50" />
				<div className="pointer-events-none absolute -top-28 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#7b2dff]/25 blur-[110px]" />

				<div className="relative flex flex-col items-center">
					{/* Status badge */}
					<div className="mb-7 inline-flex max-w-full items-center gap-2 rounded-full border border-[#a855f7]/40 bg-[#7b2dff]/15 px-3.5 py-1.5 backdrop-blur-md sm:mb-8 sm:px-4">
						<span className="relative flex h-2 w-2 shrink-0">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c026ff] opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-[#e9d5ff]" />
						</span>
						<span className="truncate font-mono text-[10px] font-semibold tracking-[0.14em] text-[#e9d5ff] uppercase sm:text-[11px] sm:tracking-[0.16em]">
							{t("badge")}
						</span>
					</div>

					{/* Concentric Neural Scanner Emblem */}
					<div className="relative mb-7 flex h-24 w-24 items-center justify-center sm:mb-8 sm:h-28 sm:w-28">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
							className="absolute inset-0 rounded-full border border-dashed border-[#a855f7]/45"
						/>
						<motion.div
							animate={{ rotate: -360 }}
							transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
							className="absolute inset-2.5 rounded-full border-2 border-transparent border-t-[#c026ff] border-r-[#7b2dff]"
						/>
						<div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d8b4fe]/45 bg-linear-to-br from-[#7b2dff] to-[#c026ff] shadow-[0_0_36px_rgba(192,38,255,0.55)] sm:h-16 sm:w-16">
							<Sparkles
								className="h-7 w-7 animate-pulse text-white sm:h-8 sm:w-8"
								aria-hidden="true"
							/>
						</div>
					</div>

					<h2 className="font-display text-xl font-black tracking-tight wrap-break-word min-[390px]:text-2xl sm:text-3xl">
						<span className="metallic-text">{t("title")}</span>
					</h2>
					<p className="mt-3 max-w-md text-sm leading-relaxed text-[#b8b2c7] sm:text-base">
						{t("description")}
					</p>

					{/* Progressive Neural Pipeline Readout */}
					<ul className="mt-8 w-full max-w-md space-y-2.5 text-left">
						{STAGE_KEYS.map((stageKey, index) => {
							const isDone = index < activeStage;
							const isCurrent = index === activeStage;
							const StageIcon = index === 0 ? ScanLine : index === 1 ? Cpu : Sparkles;

							return (
								<li
									key={stageKey}
									className={
										isCurrent
											? "flex items-center gap-3 rounded-2xl border border-[#a855f7]/45 bg-[#7b2dff]/14 px-4 py-3 text-white transition-all duration-300"
											: isDone
												? "flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.07] px-4 py-3 text-emerald-200 transition-all duration-300"
												: "flex items-center gap-3 rounded-2xl border border-white/6 bg-white/2 px-4 py-3 text-[#7a738c] transition-all duration-300"
									}
								>
									{isDone ? (
										<CheckCircle2
											className="h-4 w-4 shrink-0 text-emerald-400"
											aria-hidden="true"
										/>
									) : (
										<StageIcon
											className={
												isCurrent
													? "h-4 w-4 shrink-0 animate-pulse text-[#d8b4fe]"
													: "h-4 w-4 shrink-0 text-[#6f6882]"
											}
											aria-hidden="true"
										/>
									)}
									<span className="text-xs font-medium sm:text-sm">{t(stageKey)}</span>
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</motion.div>
	);
};
