"use client";

import { motion } from "framer-motion";
import {
	ArrowRight,
	Car,
	Clock,
	Euro,
	Gauge,
	MessageCircle,
	MessageSquareQuote,
	RotateCcw,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import React from "react";

import { lkLogo } from "@/assets";
import { CONTACT_INFO } from "@/constants/contact";
import { useAssessmentStore } from "@/features/assessment/stores/assessmentStore";
import { Link } from "@/i18n/routing";

import type { AssessmentResult } from "@/features/assessment/schemas/assessmentSchema";

type AssessmentReportProps = {
	result: AssessmentResult;
};

export const AssessmentReport: React.FC<AssessmentReportProps> = ({ result }) => {
	const t = useTranslations("Assessment");
	const format = useFormatter();
	const services = useAssessmentStore((s) => s.services);
	const reset = useAssessmentStore((s) => s.reset);

	const {
		priceMin,
		priceMax,
		durationHours,
		carSize,
		dirtLevel,
		brand,
		summaryText,
		diagnostics,
		expertVerdict,
	} = result;

	const acceptedServiceIds = services.filter((s) => s.accepted).map((s) => s.serviceId);
	const bookingHref =
		acceptedServiceIds.length > 0
			? `/booking?services=${acceptedServiceIds.join(",")}`
			: "/booking";

	const carSizeLabel: Record<AssessmentResult["carSize"], string> = {
		small: t("result.carSizes.small"),
		medium: t("result.carSizes.medium"),
		large: t("result.carSizes.large"),
		suv: t("result.carSizes.suv"),
	};

	const formattedMin = format.number(priceMin, {
		style: "currency",
		currency: "EUR",
		maximumFractionDigits: 0,
	});
	const formattedMax = format.number(priceMax, {
		style: "currency",
		currency: "EUR",
		maximumFractionDigits: 0,
	});

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
			className="mx-auto flex w-full max-w-4xl flex-col gap-7"
		>
			{/* ── Executive Header Banner ─────────────────────────────── */}
			<header className="obsidian-card relative overflow-hidden rounded-3xl p-5 text-center sm:p-10">
				<div className="pointer-events-none absolute top-0 right-12 left-12 h-px bg-linear-to-r from-transparent via-[#c026ff]/80 to-transparent" />
				<div className="pointer-events-none absolute -top-28 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-[#7b2dff]/24 blur-[110px]" />

				<div className="relative flex flex-col items-center">
					<div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#a855f7]/45 bg-[#7b2dff]/15 px-3.5 py-1.5 backdrop-blur-md sm:px-4">
						<Sparkles className="h-3.5 w-3.5 shrink-0 text-[#e9d5ff]" aria-hidden="true" />
						<span className="truncate font-mono text-[10px] font-bold tracking-[0.14em] text-[#e9d5ff] uppercase sm:text-[11px] sm:tracking-[0.16em]">
							{t("report.badge")}
						</span>
					</div>

					<div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d8b4fe]/45 bg-linear-to-br from-[#7b2dff] to-[#c026ff] shadow-[0_0_36px_rgba(192,38,255,0.48)] sm:h-16 sm:w-16">
						<Sparkles className="h-7 w-7 text-white sm:h-8 sm:w-8" aria-hidden="true" />
					</div>

					<h1 className="font-display text-2xl leading-[1.08] font-black tracking-[-0.03em] wrap-break-word min-[390px]:text-3xl sm:text-5xl">
						<span className="metallic-text">{t("report.title")}</span>
					</h1>
					<p className="mt-3 max-w-xl text-sm leading-relaxed text-[#b8b2c7] sm:text-base">
						{t("report.subtitle")}
					</p>

					{/* Detected Vehicle Telemetry Chips */}
					<div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
						<span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/4 px-4 py-1.5 text-xs font-semibold text-white">
							<Car className="h-3.5 w-3.5 text-[#d8b4fe]" aria-hidden="true" />
							<span>{brand ?? t("report.vehicle")}</span>
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full border border-[#7b2dff]/40 bg-[#7b2dff]/15 px-3.5 py-1.5 font-mono text-xs font-bold text-[#e9d5ff]">
							{carSizeLabel[carSize]}
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3.5 py-1.5 text-xs font-medium text-[#ccc3d9]">
							<Gauge className="h-3.5 w-3.5 text-[#a855f7]" aria-hidden="true" />
							<span>{t(`dossier.dirtLevels.${dirtLevel}`)}</span>
						</span>
					</div>
				</div>
			</header>

			{/* ── Primary Telemetry: Investment & Timeline ────────────── */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				{/* Investment Card */}
				<div className="obsidian-card relative overflow-hidden rounded-3xl border-[#7b2dff]/35 p-6 sm:p-7">
					<div className="pointer-events-none absolute top-0 right-8 left-8 h-px bg-linear-to-r from-transparent via-[#c026ff]/75 to-transparent" />
					<div className="pointer-events-none absolute -right-10 -bottom-12 h-36 w-36 rounded-full bg-[#7b2dff]/20 blur-[70px]" />

					<div className="relative">
						<div className="mb-3 flex items-center gap-2.5">
							<div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#a855f7]/45 bg-[#7b2dff]/20 text-[#e9d5ff]">
								<Euro className="h-4 w-4" aria-hidden="true" />
							</div>
							<h2 className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#d8b4fe] uppercase">
								{t("report.investment")}
							</h2>
						</div>
						<p className="violet-text font-display text-2xl font-black tracking-tight min-[390px]:text-3xl sm:text-4xl">
							{formattedMin} – {formattedMax}
						</p>
						<p className="mt-2 text-xs text-[#9b93ad]">{t("report.priceNote")}</p>
					</div>
				</div>

				{/* Timeline Card */}
				<div className="obsidian-card relative overflow-hidden rounded-3xl p-5 sm:p-7">
					<div className="pointer-events-none absolute top-0 right-8 left-8 h-px bg-linear-to-r from-transparent via-white/25 to-transparent" />

					<div className="relative">
						<div className="mb-3 flex items-center gap-2.5">
							<div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-[#d8b4fe]">
								<Clock className="h-4 w-4" aria-hidden="true" />
							</div>
							<h2 className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#b8b2c7] uppercase">
								{t("report.timeline")}
							</h2>
						</div>
						<p className="font-display text-2xl font-black tracking-tight text-white min-[390px]:text-3xl sm:text-4xl">
							{t("report.durationValue", { hours: durationHours })}
						</p>
						<p className="mt-2 text-xs text-[#9b93ad]">{t("report.durationNote")}</p>
					</div>
				</div>
			</div>

			{/* ── AI Diagnostics Section ──────────────────────────────── */}
			<section className="space-y-4">
				<div className="flex items-center gap-2.5 px-1">
					<ShieldCheck className="h-4 w-4 text-[#a855f7]" aria-hidden="true" />
					<h2 className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#d8b4fe] uppercase">
						{t("report.aiDiagnostics")}
					</h2>
				</div>

				{diagnostics.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{diagnostics.map((item, idx) => {
							const itemCode = String(idx + 1).padStart(2, "0");
							return (
								<article
									key={`${item.title}-${idx}`}
									className="obsidian-card group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:border-[#a855f7]/50 sm:p-6"
								>
									<div className="pointer-events-none absolute top-0 right-6 left-6 h-px bg-linear-to-r from-transparent via-[#7b2dff]/45 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />
									<div className="mb-3 flex items-center justify-between gap-2">
										<span className="rounded-lg border border-[#7b2dff]/35 bg-[#7b2dff]/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#d8b4fe]">
											{itemCode}
										</span>
									</div>
									<h3 className="font-display text-base font-bold tracking-tight text-white sm:text-lg">
										{item.title}
									</h3>
									<p className="mt-2 text-sm leading-relaxed text-[#b8b2c7]">{item.description}</p>
								</article>
							);
						})}
					</div>
				) : (
					<div className="obsidian-card rounded-2xl p-6">
						<p className="text-sm leading-relaxed text-[#ccc3d9]">{summaryText}</p>
					</div>
				)}
			</section>

			{/* ── Expert Verdict Editorial Callout ────────────────────── */}
			{expertVerdict ? (
				<section className="obsidian-card relative overflow-hidden rounded-3xl border-[#c026ff]/30 p-6 sm:p-8">
					<div className="pointer-events-none absolute top-0 bottom-0 left-0 w-1 bg-linear-to-b from-[#7b2dff] via-[#c026ff] to-[#7b2dff]" />
					<div className="pointer-events-none absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-[#c026ff]/15 blur-[90px]" />

					<div className="relative pl-3">
						<div className="mb-4 flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#7b2dff] to-[#c026ff] text-white shadow-[0_0_20px_rgba(192,38,255,0.45)]">
								<MessageSquareQuote className="h-4 w-4" aria-hidden="true" />
							</div>
							<div>
								<h2 className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#e9d5ff] uppercase">
									{t("report.expertVerdict")}
								</h2>
							</div>
						</div>

						<blockquote className="text-base leading-relaxed text-[#f1eff7] italic sm:text-lg">
							&ldquo;{expertVerdict}&rdquo;
						</blockquote>

						<div className="mt-5 flex items-center gap-2.5 border-t border-white/8 pt-4">
							<div className="relative h-6 w-6 overflow-hidden rounded-md border border-[#7b2dff]/50 bg-black">
								<Image
									src={lkLogo}
									alt="LK Gloss & Detail"
									width={24}
									height={24}
									className="h-full w-full scale-105 object-cover"
								/>
							</div>
							<span className="font-mono text-[11px] font-semibold tracking-wider text-[#9b93ad]">
								{t("report.expertAttribution")}
							</span>
						</div>
					</div>
				</section>
			) : null}

			{/* ── Primary Conversion & Actions Bar ───────────────────── */}
			<div className="flex flex-col gap-3 pt-1">
				<Link
					href={bookingHref}
					aria-label={t("report.bookAppointment")}
					className="group font-display flex w-full items-center justify-center gap-2.5 rounded-2xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-5 py-4 text-sm font-extrabold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_16px_42px_-6px_rgba(123,45,255,0.62)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_20px_50px_-6px_rgba(192,38,255,0.72)] hover:brightness-110 active:scale-[0.99] sm:gap-3 sm:px-8 sm:py-4.5 sm:text-lg"
				>
					<span>{t("report.bookAppointment")}</span>
					<ArrowRight
						className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1 sm:h-5 sm:w-5"
						aria-hidden="true"
					/>
				</Link>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<button
						type="button"
						onClick={reset}
						aria-label={t("report.startNew")}
						className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/3 px-4 py-3.5 text-sm font-semibold text-[#d1bcff] transition-all hover:border-[#a855f7]/55 hover:bg-[#7b2dff]/15 hover:text-white sm:px-5"
					>
						<RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
						<span>{t("report.startNew")}</span>
					</button>

					<a
						href={CONTACT_INFO.whatsappUrl}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`WhatsApp: ${CONTACT_INFO.phone}`}
						className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/8 px-4 py-3.5 text-xs font-semibold text-emerald-200 transition-all hover:border-emerald-400/55 hover:bg-emerald-500/20 hover:text-white sm:px-5 sm:text-sm"
					>
						<MessageCircle className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
						<span className="truncate">WhatsApp · {CONTACT_INFO.phone}</span>
					</a>
				</div>
			</div>
		</motion.div>
	);
};
