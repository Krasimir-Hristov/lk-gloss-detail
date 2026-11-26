"use client";

import { format } from "date-fns";
import { AlertCircle, CalendarCheck, CalendarOff, Eye, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { sanitizeTel } from "@/features/admin/components/messages/contactLinks";

import type { AdminAppointment, BlockedDateItem } from "@/features/admin/types/appointmentsTypes";
import type { Locale } from "date-fns";

interface SelectedDayPanelProps {
	selectedDate: Date;
	activeLocale: Locale;
	selectedDayBlocked?: BlockedDateItem;
	selectedDayAppointments: AdminAppointment[];
	isTogglingBlock: boolean;
	blockError: string | null;
	onToggleBlockDay: () => void;
	onViewDetails: (appointment: AdminAppointment) => void;
}

export const SelectedDayPanel: React.FC<SelectedDayPanelProps> = ({
	selectedDate,
	activeLocale,
	selectedDayBlocked,
	selectedDayAppointments,
	isTogglingBlock,
	blockError,
	onToggleBlockDay,
	onViewDetails,
}) => {
	const t = useTranslations("Admin.appointments");

	return (
		<div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
			<div className="mb-4 border-b border-neutral-800 pb-3">
				<span className="text-xs font-semibold tracking-wider text-purple-400 uppercase">
					{t("table.date")}
				</span>
				<h3 className="Montserrat text-xl font-bold text-white">
					{format(selectedDate, "EEEE, MMMM d, yyyy", { locale: activeLocale })}
				</h3>

				<button
					type="button"
					disabled={isTogglingBlock}
					onClick={onToggleBlockDay}
					aria-label={selectedDayBlocked ? t("unblockDay") : t("blockDay")}
					className={`mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
						selectedDayBlocked
							? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50"
							: "border-rose-500/30 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40"
					}`}
				>
					{selectedDayBlocked ? (
						<>
							<CalendarCheck className="size-3.5" />
							{t("unblockDay")}
						</>
					) : (
						<>
							<CalendarOff className="size-3.5" />
							{t("blockDay")}
						</>
					)}
				</button>
			</div>

			{blockError ? (
				<div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs text-rose-400">
					<AlertCircle className="size-4 shrink-0" />
					<span>{blockError}</span>
				</div>
			) : null}

			{selectedDayBlocked ? (
				<div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-400">
					<p className="font-bold">{t("modals.block.title")}</p>
					<p className="mt-1 text-neutral-300">{selectedDayBlocked.reason || "—"}</p>
				</div>
			) : null}

			<div className="flex-1 space-y-3 overflow-y-auto pr-1">
				{selectedDayAppointments.length === 0 ? (
					<div className="py-8 text-center text-xs text-neutral-500">{t("noAppointments")}</div>
				) : (
					selectedDayAppointments.map((appt) => {
						const totalPrice = appt.services.reduce(
							(acc, s) => acc + (s.price_medium || s.price_small),
							0,
						);
						const telTarget = sanitizeTel(appt.phone);

						return (
							<div
								key={appt.id}
								className="group rounded-lg border border-neutral-800 bg-neutral-950 p-4 transition-all hover:border-purple-500/50"
							>
								<div className="flex items-center justify-between">
									<h4 className="font-bold text-white">
										{appt.first_name} {appt.last_name}
									</h4>
									<span className="text-xs font-semibold text-emerald-400 uppercase">
										~€{totalPrice}
									</span>
								</div>
								<p className="mt-1 text-xs text-neutral-400">{appt.email}</p>

								<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/60 pt-2 text-xs">
									<span className="font-semibold text-purple-400 capitalize">
										{t(`status.${appt.status}`)}
									</span>
									<div className="flex items-center gap-3">
										{telTarget ? (
											<a
												href={`tel:${telTarget}`}
												aria-label={`${t("call")} ${appt.first_name}`}
												className="flex items-center gap-1 font-medium text-emerald-400 hover:underline"
											>
												<Phone className="size-3.5" /> {t("call")}
											</a>
										) : null}
										<button
											type="button"
											onClick={() => onViewDetails(appt)}
											aria-label={t("modals.details.title")}
											className="flex cursor-pointer items-center gap-1 font-medium text-neutral-300 hover:text-purple-400"
										>
											<Eye className="size-3.5" /> {t("modals.details.title")}
										</button>
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};
