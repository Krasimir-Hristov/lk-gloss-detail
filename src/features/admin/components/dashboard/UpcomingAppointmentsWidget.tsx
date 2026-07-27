import { CalendarRange, User, Clock } from "lucide-react";
import React from "react";

import {
	getAppointmentServiceNames,
	statusColors,
} from "@/features/admin/utils/appointmentHelpers";

import type { AdminAppointment } from "@/features/admin/types/appointments.types";

interface UpcomingAppointmentsWidgetProps {
	appointments: AdminAppointment[];
	locale: string;
	t: (key: string) => string;
}

const localeMap: Record<string, string> = {
	de: "de-DE",
	en: "en-US",
	el: "el-GR",
};

export const UpcomingAppointmentsWidget: React.FC<UpcomingAppointmentsWidgetProps> = ({
	appointments,
	locale,
	t,
}) => {
	// Group appointments by booking_date
	const grouped = appointments.reduce<Record<string, AdminAppointment[]>>((acc, apt) => {
		const date = apt.booking_date;
		if (!acc[date]) acc[date] = [];
		acc[date].push(apt);
		return acc;
	}, {});

	const sortedDates = Object.keys(grouped).sort();
	const dateLocale = localeMap[locale] ?? "de-DE";

	return (
		<section
			className="rounded-xl border border-neutral-800 bg-neutral-900 p-6"
			aria-label={t("upcomingAppointments.title")}
		>
			<div className="mb-5 flex items-center gap-3">
				<div className="rounded-lg bg-emerald-500/10 p-2">
					<CalendarRange className="h-5 w-5 text-emerald-400" />
				</div>
				<div>
					<h2 className="Montserrat text-lg font-bold text-white">
						{t("upcomingAppointments.title")}
					</h2>
					<p className="text-xs text-neutral-500">{t("upcomingAppointments.subtitle")}</p>
				</div>
			</div>

			{appointments.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-700 py-10 text-center">
					<CalendarRange className="mb-3 h-10 w-10 text-neutral-600" />
					<p className="text-sm text-neutral-500">{t("upcomingAppointments.empty")}</p>
				</div>
			) : (
				<div className="space-y-5">
					{sortedDates.map((date) => {
						const dateObj = new Date(date + "T00:00:00");
						const dayLabel = dateObj.toLocaleDateString(dateLocale, {
							weekday: "short",
							day: "2-digit",
							month: "short",
						});

						return (
							<div key={date}>
								<div className="mb-2 flex items-center gap-2">
									<div className="h-px flex-1 bg-neutral-800" />
									<span className="text-xs font-semibold text-neutral-400 uppercase">
										{dayLabel}
									</span>
									<div className="h-px flex-1 bg-neutral-800" />
								</div>
								<div className="space-y-2">
									{grouped[date].map((apt) => {
										const serviceName = getAppointmentServiceNames(apt.services, locale);

										return (
											<div
												key={apt.id}
												className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 transition-colors hover:border-neutral-700"
											>
												<div className="flex items-center gap-3">
													<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
														<User className="h-3.5 w-3.5 text-emerald-400" />
													</div>
													<div>
														<p className="text-sm font-medium text-white">
															{apt.first_name} {apt.last_name}
														</p>
														<span className="flex items-center gap-1 text-xs text-neutral-500">
															<Clock className="h-3 w-3" />
															{serviceName}
														</span>
													</div>
												</div>
												<span
													className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[apt.status] ?? statusColors.pending}`}
												>
													{t(`status.${apt.status}`)}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
};
