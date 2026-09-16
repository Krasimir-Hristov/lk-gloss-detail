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
			className="flex flex-col items-center rounded-2xl border border-amber-500/30 bg-[#201f1f] p-6 text-center shadow-lg sm:p-8"
		>
			<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
				<AlertTriangle className="h-7 w-7" aria-hidden="true" />
			</div>

			<h3 className="mb-2 text-lg font-bold text-white sm:text-xl">{title || t("title")}</h3>

			<p className="mb-6 max-w-md text-sm text-[#ccc3d9]">{description || t("description")}</p>

			<div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
				{onRetry ? (
					<Button
						type="button"
						onClick={onRetry}
						aria-label={t("retry")}
						className="inline-flex items-center justify-center gap-2 bg-linear-to-r from-[#7b2dff] to-[#b303f2] px-6 py-5 text-base font-bold text-white hover:shadow-[0_0_20px_rgba(123,45,255,0.4)]"
					>
						<RefreshCw className="h-4 w-4" aria-hidden="true" />
						<span>{t("retry")}</span>
					</Button>
				) : null}

				<a
					href={`tel:${CONTACT_INFO.phoneRaw}`}
					aria-label={`${t("callUs")}: ${CONTACT_INFO.phone}`}
					className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
				>
					<Phone className="h-4 w-4 text-[#d1bcff]" aria-hidden="true" />
					<span>{t("callUs")}</span>
				</a>

				<a
					href={`mailto:${CONTACT_INFO.email}`}
					aria-label={`${t("emailUs")}: ${CONTACT_INFO.email}`}
					className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
				>
					<Mail className="h-4 w-4 text-[#d1bcff]" aria-hidden="true" />
					<span>{t("emailUs")}</span>
				</a>
			</div>
		</div>
	);
};
