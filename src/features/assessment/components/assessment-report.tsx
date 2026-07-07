"use client";

import { motion } from "framer-motion";
import { Euro, Clock, ShieldCheck, Sparkles, MessageSquareQuote, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations, useFormatter } from "next-intl";

import type { AssessmentResult } from "@/features/assessment/schemas/assessment.schema";

type AssessmentReportProps = {
	result: AssessmentResult;
};

export const AssessmentReport = ({ result }: AssessmentReportProps) => {
	const t = useTranslations("Assessment");
	const format = useFormatter();

	const {
		priceMin,
		priceMax,
		durationHours,
		carSize,
		brand,
		summaryText,
		diagnostics,
		expertVerdict,
	} = result;

	const carSizeLabel: Record<AssessmentResult["carSize"], string> = {
		small: t("result.carSizes.small"),
		medium: t("result.carSizes.medium"),
		large: t("result.carSizes.large"),
		suv: t("result.carSizes.suv"),
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="flex w-full flex-col gap-8"
		>
			{/* ── Header ──────────────────────────────────────────── */}
			<div className="text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#7b2dff] to-[#b303f2] shadow-[0_0_30px_rgba(123,45,255,0.3)]">
					<Sparkles className="h-8 w-8 text-white" />
				</div>
				<h1 className="font-['Montserrat'] text-[40px] leading-tight font-bold text-white">
					{t("report.title")}
				</h1>
				<p className="text-on-surface-variant mt-2 text-sm">
					{brand ?? t("report.vehicle")} – {carSizeLabel[carSize]}
				</p>
			</div>

			{/* ── AI Diagnostics Section ──────────────────────────── */}
			<section className="flex flex-col gap-3">
				<div className="mb-1 flex items-center gap-2">
					<ShieldCheck className="h-4 w-4 text-[#7b2dff]" />
					<h2 className="text-[10px] font-bold tracking-widest text-[#d1bcff] uppercase">
						{t("report.aiDiagnostics")}
					</h2>
				</div>

				{diagnostics.length > 0 ? (
					diagnostics.map((item, idx) => (
						<div
							key={idx}
							className="rounded-2xl border border-[#7b2dff]/15 bg-[#201f1f] p-5 transition-colors hover:border-[#7b2dff]/30"
						>
							<h3 className="font-['Montserrat'] text-base font-semibold text-white">
								{item.title}
							</h3>
							<p className="text-on-surface-variant mt-1 text-sm leading-relaxed">
								{item.description}
							</p>
						</div>
					))
				) : (
					<div className="rounded-2xl border border-[#7b2dff]/15 bg-[#201f1f] p-5">
						<p className="text-on-surface-variant text-sm">{summaryText}</p>
					</div>
				)}
			</section>

			{/* ── Expert Verdict ──────────────────────────────────── */}
			{expertVerdict ? (
				<section className="relative rounded-2xl border border-[#b303f2]/20 bg-linear-to-br from-[#201f1f] to-[#201f1f]/80 p-6">
					<div className="absolute -top-3 left-6 flex h-6 w-6 items-center justify-center rounded-full bg-[#b303f2]">
						<MessageSquareQuote className="h-3.5 w-3.5 text-white" />
					</div>
					<div className="mb-3 flex items-center gap-2">
						<h2 className="text-[10px] font-bold tracking-widest text-[#d1bcff] uppercase">
							{t("report.expertVerdict")}
						</h2>
					</div>
					<p className="text-on-surface-variant text-sm leading-relaxed italic">
						&ldquo;{expertVerdict}&rdquo;
					</p>
				</section>
			) : null}

			{/* ── Investment & Timeline ────────────────────────────── */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{/* Investment */}
				<div className="rounded-2xl border border-[#7b2dff]/20 bg-linear-to-br from-[#7b2dff]/10 to-transparent p-6">
					<div className="mb-3 flex items-center gap-2">
						<Euro className="h-4 w-4 text-[#7b2dff]" />
						<h3 className="text-[10px] font-bold tracking-widest text-[#d1bcff] uppercase">
							{t("report.investment")}
						</h3>
					</div>
					<p className="font-['Montserrat'] text-3xl font-extrabold text-white">
						{format.number(priceMin, {
							style: "currency",
							currency: "EUR",
							maximumFractionDigits: 0,
						})}
						{" – "}
						{format.number(priceMax, {
							style: "currency",
							currency: "EUR",
							maximumFractionDigits: 0,
						})}
					</p>
				</div>

				{/* Timeline */}
				<div className="rounded-2xl border border-[#7b2dff]/20 bg-[#201f1f] p-6">
					<div className="mb-3 flex items-center gap-2">
						<Clock className="h-4 w-4 text-[#7b2dff]" />
						<h3 className="text-[10px] font-bold tracking-widest text-[#d1bcff] uppercase">
							{t("report.timeline")}
						</h3>
					</div>
					<p className="font-['Montserrat'] text-3xl font-extrabold text-white">
						{t("report.durationValue", { hours: durationHours })}
					</p>
				</div>
			</div>

			{/* ── Book Appointment CTA ────────────────────────────── */}
			<Link
				href="/booking"
				className="group flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] to-[#b303f2] px-8 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(123,45,255,0.5)]"
			>
				{t("report.bookAppointment")}
				<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
			</Link>
		</motion.div>
	);
};
