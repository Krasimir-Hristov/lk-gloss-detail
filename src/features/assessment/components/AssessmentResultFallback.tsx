"use client";

import { AlertCircle, ArrowRight, MessageCircle, Phone, RotateCcw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { CONTACT_INFO } from "@/constants/contact";
import { Link } from "@/i18n/routing";

type AssessmentErrorCardProps = {
	onRetry: () => void;
};

export const AssessmentErrorCard: React.FC<AssessmentErrorCardProps> = ({ onRetry }) => {
	const t = useTranslations("Assessment");
	const tErrors = useTranslations("Errors");

	return (
		<div
			role="alert"
			aria-live="assertive"
			className="obsidian-card relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl p-7 text-center sm:p-10"
		>
			<div className="pointer-events-none absolute top-0 right-10 left-10 h-px bg-linear-to-r from-transparent via-amber-400/60 to-transparent" />

			<div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/35 bg-amber-500/15 text-amber-300 shadow-[0_0_28px_rgba(245,158,11,0.25)]">
				<AlertCircle className="h-8 w-8" aria-hidden="true" />
			</div>

			<h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
				{tErrors("aiUnavailable.title")}
			</h2>
			<p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#b8b2c7] sm:text-base">
				{tErrors("aiUnavailable.description")}
			</p>

			<div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
				<button
					type="button"
					onClick={onRetry}
					aria-label={t("results.retry")}
					className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_32px_-6px_rgba(123,45,255,0.55)] transition-all hover:brightness-110 active:scale-[0.98]"
				>
					<RotateCcw className="h-4 w-4" aria-hidden="true" />
					<span>{t("results.retry")}</span>
				</button>

				<a
					href={`tel:${CONTACT_INFO.phoneRaw}`}
					aria-label={`${tErrors("bookingUnavailable.callUs")}: ${CONTACT_INFO.phone}`}
					className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white transition-all hover:border-[#a855f7]/60 hover:bg-[#7b2dff]/15"
				>
					<Phone className="h-4 w-4 text-[#d8b4fe]" aria-hidden="true" />
					<span>{CONTACT_INFO.phone}</span>
				</a>

				<a
					href={CONTACT_INFO.whatsappUrl}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={`WhatsApp: ${CONTACT_INFO.phone}`}
					className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-5 py-3.5 text-sm font-semibold text-emerald-200 transition-all hover:border-emerald-400/55 hover:bg-emerald-500/20 hover:text-white"
				>
					<MessageCircle className="h-4 w-4 text-emerald-400" aria-hidden="true" />
					<span>WhatsApp</span>
				</a>
			</div>
		</div>
	);
};

type NoServicesSelectedCardProps = {
	onBackToServices: () => void;
};

export const NoServicesSelectedCard: React.FC<NoServicesSelectedCardProps> = ({
	onBackToServices,
}) => {
	const t = useTranslations("Assessment.report");

	return (
		<div className="obsidian-card relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl p-7 text-center sm:p-10">
			<div className="pointer-events-none absolute top-0 right-10 left-10 h-px bg-linear-to-r from-transparent via-[#c026ff]/65 to-transparent" />

			<div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#a855f7]/40 bg-[#7b2dff]/15 text-[#d8b4fe] shadow-[0_0_28px_rgba(123,45,255,0.28)]">
				<Sparkles className="h-7 w-7" aria-hidden="true" />
			</div>

			<h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
				{t("noServicesTitle")}
			</h2>
			<p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#b8b2c7] sm:text-base">
				{t("noServicesDesc")}
			</p>

			<div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
				<button
					type="button"
					onClick={onBackToServices}
					aria-label={t("backToServices")}
					className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-[#a855f7]/60 hover:bg-[#7b2dff]/15"
				>
					<RotateCcw className="h-4 w-4 text-[#d8b4fe]" aria-hidden="true" />
					<span>{t("backToServices")}</span>
				</button>

				<Link
					href="/booking"
					aria-label={t("bookAppointment")}
					className="group inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_32px_-6px_rgba(123,45,255,0.55)] transition-all hover:brightness-110 active:scale-[0.98]"
				>
					<span>{t("bookAppointment")}</span>
					<ArrowRight
						className="h-4 w-4 transition-transform group-hover:translate-x-1"
						aria-hidden="true"
					/>
				</Link>
			</div>
		</div>
	);
};
