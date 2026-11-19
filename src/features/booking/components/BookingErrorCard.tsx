"use client";

import { AlertTriangle, RefreshCw, Phone, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { Button } from "@/components/ui/Button";
import { CONTACT_INFO } from "@/constants/contact";

interface BookingErrorCardProps {
	onRetry?: () => void;
	title?: string;
	description?: string;
}

export const BookingErrorCard: React.FC<BookingErrorCardProps> = ({
	onRetry,
	title,
	description,
}) => {
	const t = useTranslations("Errors.bookingUnavailable");

	return (
		<div
			role="alert"
			aria-live="assertive"
			className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-amber-500/30 bg-[#0d0d14]/90 p-6 text-center shadow-[0_20px_50px_-20px_rgba(0,0,0,0.85)] sm:p-8"
		>
			<div className="pointer-events-none absolute top-0 right-10 left-10 h-px bg-linear-to-r from-transparent via-amber-400/60 to-transparent" />

			<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-500/12 text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.2)]">
				<AlertTriangle className="h-7 w-7" aria-hidden="true" />
			</div>

			<h3 className="font-display mb-2 text-lg font-bold text-white sm:text-xl">
				{title || t("title")}
			</h3>

			<p className="mb-6 max-w-md text-sm leading-relaxed text-[#b8b2c7]">
				{description || t("description")}
			</p>

			<div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
				{onRetry ? (
					<Button
						type="button"
						onClick={onRetry}
						aria-label={t("retry")}
						className="font-display inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-6 text-sm font-bold text-white shadow-[0_10px_28px_-8px_rgba(123,45,255,0.6)] transition-all hover:brightness-110"
					>
						<RefreshCw className="h-4 w-4" aria-hidden="true" />
						<span>{t("retry")}</span>
					</Button>
				) : null}

				<a
					href={`tel:${CONTACT_INFO.phoneRaw}`}
					aria-label={`${t("callUs")}: ${CONTACT_INFO.phone}`}
					className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-[#f1eff7] transition-all hover:border-[#a855f7]/60 hover:bg-[#7b2dff]/15 hover:text-white"
				>
					<Phone className="h-4 w-4 text-[#d1bcff]" aria-hidden="true" />
					<span>{t("callUs")}</span>
				</a>

				<a
					href={`mailto:${CONTACT_INFO.email}`}
					aria-label={`${t("emailUs")}: ${CONTACT_INFO.email}`}
					className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-[#f1eff7] transition-all hover:border-[#a855f7]/60 hover:bg-[#7b2dff]/15 hover:text-white"
				>
					<Mail className="h-4 w-4 text-[#d1bcff]" aria-hidden="true" />
					<span>{t("emailUs")}</span>
				</a>
			</div>
		</div>
	);
};
