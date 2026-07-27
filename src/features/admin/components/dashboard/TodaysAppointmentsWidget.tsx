import { CalendarCheck, Clock, User, Car } from "lucide-react";
import React from "react";

import {
	getAppointmentServiceNames,
	statusColors,
} from "@/features/admin/utils/appointmentHelpers";

import type { AdminAppointment } from "@/features/admin/types/appointments.types";

interface TodaysAppointmentsWidgetProps {
	appointments: AdminAppointment[];
	locale: string;
	t: (key: string) => string;
}

export const TodaysAppointmentsWidget: React.FC<TodaysAppointmentsWidgetProps> = ({
	appointments,
	locale,
	t,
}) => (
	<section
		className="rounded-xl border border-neutral-800 bg-neutral-900 p-6"
		aria-label={t("todaysAppointments.title")}
	>
		<div className="mb-5 flex items-center gap-3">
			<div className="rounded-lg bg-cyan-500/10 p-2">
				<CalendarCheck className="h-5 w-5 text-cyan-400" />
			</div>
			<div>
				<h2 className="Montserrat text-lg font-bold text-white">{t("todaysAppointments.title")}</h2>
				<p className="text-xs text-neutral-500">{t("todaysAppointments.subtitle")}</p>
			</div>
		</div>

		{appointments.length === 0 ? (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-700 py-10 text-center">
				<CalendarCheck className="mb-3 h-10 w-10 text-neutral-600" />
				<p className="text-sm text-neutral-500">{t("todaysAppointments.empty")}</p>
			</div>
		) : (
			<div className="space-y-3">
				{appointments.map((apt) => {
					const serviceName = getAppointmentServiceNames(apt.services, locale);

					return (
						<div
							key={apt.id}
							className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 transition-colors hover:border-neutral-700"
						>
							<div className="flex items-center gap-4">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
									<User className="h-4 w-4 text-purple-400" />
								</div>
								<div>
									<p className="text-sm font-semibold text-white">
										{apt.first_name} {apt.last_name}
									</p>
									<div className="mt-0.5 flex items-center gap-3 text-xs text-neutral-500">
										<span className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											{serviceName}
										</span>
										{apt.car_description ? (
											<span className="flex items-center gap-1">
												<Car className="h-3 w-3" />
												{apt.car_description}
											</span>
										) : null}
									</div>
								</div>
							</div>
							<span
								className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColors[apt.status] ?? statusColors.pending}`}
							>
								{t(`status.${apt.status}`)}
							</span>
						</div>
					);
				})}
			</div>
		)}
	</section>
);
