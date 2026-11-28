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
import { de, el, enUS, sq, tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarOff } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import React, { useState } from "react";

import { blockDate, unblockDate } from "@/features/admin/actions/blockedDates";
import { SelectedDayPanel } from "@/features/admin/components/appointments/SelectedDayPanel";
import { resolveAppLocale, type AppLocale } from "@/i18n/locales";
import { getBerlinTodayIso } from "@/lib/date/berlinDate";

import type { AdminAppointment, BlockedDateItem } from "@/features/admin/types/appointmentsTypes";

const localesMap: Record<AppLocale, typeof de> = {
	de,
	el,
	en: enUS,
	sq,
	tr,
};

interface AppointmentsCalendarViewProps {
	appointments: AdminAppointment[];
	blockedDates: BlockedDateItem[];
	onViewDetails: (appointment: AdminAppointment) => void;
	onBlockedDatesUpdated: () => Promise<void> | void;
}

export const AppointmentsCalendarView: React.FC<AppointmentsCalendarViewProps> = ({
	appointments,
	blockedDates,
	onViewDetails,
	onBlockedDatesUpdated,
}) => {
	const t = useTranslations("Admin.appointments");
	const locale = useLocale();
	const activeLocale = localesMap[resolveAppLocale(locale)] ?? de;

	const [currentMonth, setCurrentMonth] = useState<Date>(() => {
		const todayIso = getBerlinTodayIso();
		return new Date(`${todayIso}T00:00:00`);
	});
	const [selectedDate, setSelectedDate] = useState<Date>(() => {
		const todayIso = getBerlinTodayIso();
		return new Date(`${todayIso}T00:00:00`);
	});
	const [isTogglingBlock, setIsTogglingBlock] = useState(false);
	const [blockError, setBlockError] = useState<string | null>(null);

	const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
	const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
	const goToToday = () => {
		const todayIso = getBerlinTodayIso();
		const today = new Date(`${todayIso}T00:00:00`);
		setCurrentMonth(today);
		setSelectedDate(today);
		setBlockError(null);
	};

	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(monthStart);
	const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
	const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

	const days: Date[] = [];
	let day = startDate;
	while (day <= endDate) {
		days.push(day);
		day = addDays(day, 1);
	}

	const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
	const selectedDayAppointments = appointments.filter((a) => a.booking_date === selectedDateStr);
	const selectedDayBlocked = blockedDates.find((b) => b.blocked_date === selectedDateStr);

	const weekdayNames = [0, 1, 2, 3, 4, 5, 6].map((idx) => {
		const d = addDays(startDate, idx);
		return format(d, "EEE", { locale: activeLocale });
	});

	const handleToggleBlockDay = async () => {
		if (isTogglingBlock) return;
		setIsTogglingBlock(true);
		setBlockError(null);
		try {
			const res = selectedDayBlocked
				? await unblockDate(selectedDayBlocked.id)
				: await blockDate({ blocked_date: selectedDateStr });

			if (res.success) {
				await onBlockedDatesUpdated();
			} else {
				setBlockError(res.error);
			}
		} catch (err) {
			console.error("[AppointmentsCalendarView] Error toggling block day:", err);
			setBlockError(t("errors.blockToggleFailed"));
		} finally {
			setIsTogglingBlock(false);
		}
	};

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
			{/* Calendar Grid */}
			<div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl lg:col-span-2">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="Montserrat text-xl font-bold text-white">
						{format(currentMonth, "MMMM yyyy", { locale: activeLocale })}
					</h2>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={prevMonth}
							aria-label={t("previousMonth")}
							className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-neutral-400 transition-colors hover:border-purple-500/50 hover:text-white"
						>
							<ChevronLeft className="size-4" />
						</button>
						<button
							type="button"
							onClick={goToToday}
							aria-label={t("today")}
							className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors hover:border-purple-500/50 hover:text-white"
						>
							{t("today")}
						</button>
						<button
							type="button"
							onClick={nextMonth}
							aria-label={t("nextMonth")}
							className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-neutral-400 transition-colors hover:border-purple-500/50 hover:text-white"
						>
							<ChevronRight className="size-4" />
						</button>
					</div>
				</div>

				<div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
					{weekdayNames.map((name, i) => (
						<div key={i}>{name}</div>
					))}
				</div>

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
								aria-label={dateStr}
								onClick={() => {
									setSelectedDate(d);
									setBlockError(null);
								}}
								className={`group relative flex min-h-20 cursor-pointer flex-col justify-between rounded-lg border p-2 text-left transition-all ${
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

			<SelectedDayPanel
				selectedDate={selectedDate}
				activeLocale={activeLocale}
				selectedDayBlocked={selectedDayBlocked}
				selectedDayAppointments={selectedDayAppointments}
				isTogglingBlock={isTogglingBlock}
				blockError={blockError}
				onToggleBlockDay={handleToggleBlockDay}
				onViewDetails={onViewDetails}
			/>
		</div>
	);
};
