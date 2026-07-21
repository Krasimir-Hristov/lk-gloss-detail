"use client";

import {
	format,
	addMonths,
	subMonths,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	isSameMonth,
	isSameDay,
	addDays,
} from "date-fns";
import { de, el, enUS } from "date-fns/locale";
import {
	ChevronLeft,
	ChevronRight,
	Calendar as CalendarIcon,
	CalendarOff,
	Eye,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import React, { useState } from "react";

import type { AdminAppointment, BlockedDateItem } from "@/features/admin/types/appointments.types";

const localesMap = {
	de,
	el,
	en: enUS,
};

interface AppointmentsCalendarViewProps {
	appointments: AdminAppointment[];
	blockedDates: BlockedDateItem[];
	onViewDetails: (appointment: AdminAppointment) => void;
}

export const AppointmentsCalendarView: React.FC<AppointmentsCalendarViewProps> = ({
	appointments,
	blockedDates,
	onViewDetails,
}) => {
	const t = useTranslations("Admin.appointments");
	const locale = useLocale();
	const activeLocale = localesMap[locale as keyof typeof localesMap] || enUS;

	const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());

	const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
	const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(monthStart);
	const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
	const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

	const days: Date[] = [];
	let day = startDate;
	while (day <= endDate) {
		days.push(day);
		day = addDays(day, 1);
	}

	const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

	// Get appointments for selected day
	const selectedDayAppointments = appointments.filter((a) => a.booking_date === selectedDateStr);

	// Get blocked info for selected day
	const selectedDayBlocked = blockedDates.find((b) => b.blocked_date === selectedDateStr);

	// Generate weekday names dynamically using active locale
	const weekdayNames = [0, 1, 2, 3, 4, 5, 6].map((idx) => {
		const d = addDays(startDate, idx);
		return format(d, "EEE", { locale: activeLocale });
	});

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
			{/* Calendar Grid */}
			<div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl lg:col-span-2">
				{/* Calendar Header Navigation */}
				<div className="mb-6 flex items-center justify-between">
					<h2 className="Montserrat text-xl font-bold text-white">
						{format(currentMonth, "MMMM yyyy", { locale: activeLocale })}
					</h2>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={prevMonth}
							className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-neutral-400 transition-colors hover:border-purple-500/50 hover:text-white"
							title="Previous Month"
						>
							<ChevronLeft className="size-4" />
						</button>
						<button
							type="button"
							onClick={() => setCurrentMonth(new Date())}
							className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors hover:border-purple-500/50 hover:text-white"
						>
							{t("today")}
						</button>
						<button
							type="button"
							onClick={nextMonth}
							className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-neutral-400 transition-colors hover:border-purple-500/50 hover:text-white"
							title="Next Month"
						>
							<ChevronRight className="size-4" />
						</button>
					</div>
				</div>

				{/* Weekday Names */}
				<div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
					{weekdayNames.map((name, i) => (
						<div key={i}>{name}</div>
					))}
				</div>

				{/* Days Grid */}
				<div className="grid grid-cols-7 gap-1.5">
					{days.map((d) => {
						const dateStr = format(d, "yyyy-MM-dd");
						const dayAppointments = appointments.filter((a) => a.booking_date === dateStr);
						const isBlocked = blockedDates.some((b) => b.blocked_date === dateStr);

						const isSelected = isSameDay(d, selectedDate);
						const isCurrentMonth = isSameMonth(d, currentMonth);

						return (
							<button
								type="button"
								key={dateStr}
								onClick={() => setSelectedDate(d)}
								className={`group min-h- relative flex flex-col justify-between rounded-lg border p-2 text-left transition-all ${
									isSelected
										? "border-purple-500 bg-purple-950/40 ring-2 ring-purple-500/40"
										: isBlocked
											? "border-rose-900/40 bg-rose-950/20"
											: isCurrentMonth
												? "border-neutral-800/80 bg-neutral-950 hover:border-neutral-700"
												: "border-transparent bg-neutral-950/30 opacity-40"
								}`}
							>
								<div className="flex items-center justify-between">
									<span
										className={`text-xs font-bold ${
											isSelected ? "text-purple-300" : "text-neutral-300"
										}`}
									>
										{format(d, "d")}
									</span>
									{isBlocked ? (
										<span title={t("modals.block.title")}>
											<CalendarOff className="size-3.5 text-rose-400" />
										</span>
									) : null}
								</div>

								{/* Appointment Badges */}
								{dayAppointments.length > 0 ? (
									<div className="mt-1 flex items-center gap-1">
										<span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
											<CalendarIcon className="size-2.5" />
											{dayAppointments.length}
										</span>
									</div>
								) : null}
							</button>
						);
					})}
				</div>
			</div>

			{/* Selected Day Details Panel */}
			<div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
				<div className="mb-4 border-b border-neutral-800 pb-3">
					<span className="text-xs font-semibold tracking-wider text-purple-400 uppercase">
						{t("table.date")}
					</span>
					<h3 className="Montserrat text-xl font-bold text-white">
						{format(selectedDate, "EEEE, MMMM d, yyyy", { locale: activeLocale })}
					</h3>
				</div>

				{/* Blocked Date Warning */}
				{selectedDayBlocked ? (
					<div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-400">
						<p className="font-bold">⛔ {t("modals.block.title")}</p>
						<p className="mt-1 text-neutral-300">{selectedDayBlocked.reason || "—"}</p>
					</div>
				) : null}

				{/* Appointments for Selected Date */}
				<div className="flex-1 space-y-3 overflow-y-auto pr-1">
					{selectedDayAppointments.length === 0 ? (
						<div className="py-8 text-center text-xs text-neutral-500">{t("noAppointments")}</div>
					) : (
						selectedDayAppointments.map((appt) => {
							const totalPrice = appt.services.reduce(
								(acc, s) => acc + (s.price_medium || s.price_small),
								0,
							);

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

									<div className="mt-3 flex items-center justify-between border-t border-neutral-800/60 pt-2 text-xs">
										<span className="font-semibold text-purple-400 capitalize">
											{t(`status.${appt.status}`)}
										</span>
										<button
											type="button"
											onClick={() => onViewDetails(appt)}
											className="flex cursor-pointer items-center gap-1 font-medium text-neutral-300 hover:text-purple-400"
										>
											<Eye className="size-3.5" /> {t("modals.details.title")}
										</button>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
};
