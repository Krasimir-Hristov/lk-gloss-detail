"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

export interface BookingConflict {
	id: string;
	booking_date: string;
	first_name: string;
	last_name: string;
	status: string;
}

interface BlockDateConflictBannerProps {
	conflicts: BookingConflict[];
	isSubmitting: boolean;
	onCancel: () => void;
	onConfirmOverride: () => void;
}

export const BlockDateConflictBanner: React.FC<BlockDateConflictBannerProps> = ({
	conflicts,
	isSubmitting,
	onCancel,
	onConfirmOverride,
}) => {
	const t = useTranslations("Admin.appointments.modals.block");
	const tAppointments = useTranslations("Admin.appointments");

	if (conflicts.length === 0) return null;

	return (
		<div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-950/25 p-3 text-xs text-amber-200">
			<div className="flex items-start gap-2 font-bold text-amber-300">
				<AlertTriangle className="mt-0.5 size-4 shrink-0" />
				<div>
					<p>{t("conflictTitle", { count: conflicts.length })}</p>
					<p className="mt-0.5 font-normal text-amber-200/80">{t("conflictDesc")}</p>
				</div>
			</div>
			<ul className="max-h-24 space-y-1 overflow-y-auto text-[11px] text-amber-100/90">
				{conflicts.map((c) => {
					const statusLabel = tAppointments.has(`status.${c.status}`)
						? tAppointments(`status.${c.status}`)
						: c.status;
					return (
						<li key={c.id}>
							• {c.booking_date} — {c.first_name} {c.last_name} ({statusLabel})
						</li>
					);
				})}
			</ul>
			<div className="flex items-center gap-2 pt-1">
				<button
					type="button"
					disabled={isSubmitting}
					onClick={onConfirmOverride}
					aria-label={t("confirmConflict")}
					className="cursor-pointer rounded bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50"
				>
					{t("confirmConflict")}
				</button>
				<button
					type="button"
					onClick={onCancel}
					aria-label={t("cancelConflict")}
					className="cursor-pointer rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
				>
					{t("cancelConflict")}
				</button>
			</div>
		</div>
	);
};
