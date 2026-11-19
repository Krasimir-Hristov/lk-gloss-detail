"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarCheck } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import React from "react";
import { de, el, enUS } from "react-day-picker/locale";

import { getUnavailableDates } from "@/actions/booking";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/Calendar";
import { BookingErrorCard } from "@/features/booking/components/BookingErrorCard";
import { useBookingStore } from "@/features/booking/stores/bookingStore";

const DAY_PICKER_LOCALES = {
	de,
	en: enUS,
	el,
} as const;

const CalendarSkeleton: React.FC = () => {
	return (
		<div
			aria-busy="true"
			className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#0b0b11]/90 p-5"
		>
			<div className="flex items-center justify-between">
				<div className="h-8 w-8 animate-pulse rounded-lg bg-white/[0.06]" />
				<div className="h-5 w-32 animate-pulse rounded bg-white/[0.08]" />
				<div className="h-8 w-8 animate-pulse rounded-lg bg-white/[0.06]" />
			</div>
			<div className="grid grid-cols-7 gap-2">
				{Array.from({ length: 35 }).map((_, idx) => (
					<div key={idx} className="aspect-square animate-pulse rounded-lg bg-white/[0.05]" />
				))}
			</div>
		</div>
	);
};

export const StepDatePicker: React.FC = () => {
	const t = useTranslations("Booking.step3");
	const locale = useLocale();
	const formatter = useFormatter();
	const { bookingDate, setDate, nextStep, prevStep } = useBookingStore();

	const {
		data: unavailableDates = [],
		isLoading,
		error: fetchError,
		refetch,
	} = useQuery<string[]>({
		queryKey: ["unavailable-dates"],
		queryFn: getUnavailableDates,
	});

	const selectedDate = bookingDate ? parseISO(bookingDate) : undefined;
	const dayPickerLocale =
		DAY_PICKER_LOCALES[locale as keyof typeof DAY_PICKER_LOCALES] ?? DAY_PICKER_LOCALES.de;

	const handleSelect = (date: Date | undefined) => {
		if (date) {
			setDate({ bookingDate: format(date, "yyyy-MM-dd") });
		}
	};

	const isDateUnavailable = (date: Date) => {
		const iso = format(date, "yyyy-MM-dd");
		return unavailableDates.includes(iso);
	};

	if (isLoading) {
		return (
			<div className="flex flex-col gap-5">
				<p className="sr-only">{t("loading")}</p>
				<CalendarSkeleton />
			</div>
		);
	}

	if (fetchError) {
		return (
			<div className="flex flex-col gap-5">
				<BookingErrorCard onRetry={() => refetch()} />
				<div className="flex gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={prevStep}
						aria-label={t("back")}
						className="h-12 flex-1 cursor-pointer gap-2 rounded-xl border-white/12 bg-white/[0.03] text-sm font-semibold text-[#e5e2e1] hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
					>
						<ArrowLeft className="h-4 w-4" aria-hidden="true" />
						<span>{t("back")}</span>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			{/* Sculpted Obsidian Calendar Frame */}
			<div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b11]/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-6">
				<div className="pointer-events-none absolute top-0 right-12 left-12 h-px bg-linear-to-r from-transparent via-[#7b2dff]/55 to-transparent" />

				<div className="flex justify-center">
					<Calendar
						mode="single"
						locale={dayPickerLocale}
						selected={selectedDate}
						onSelect={handleSelect}
						disabled={[{ before: new Date() }, (date) => isDateUnavailable(date)]}
						className="w-full max-w-[380px] bg-transparent p-0 [--cell-radius:0.75rem] [--cell-size:2.55rem] sm:[--cell-size:3rem] [&_button:disabled]:line-through [&_button:disabled]:decoration-white/25 [&_button:disabled]:opacity-30 [&_button[data-selected-single=true]]:rounded-xl [&_button[data-selected-single=true]]:bg-linear-to-br [&_button[data-selected-single=true]]:from-[#7b2dff] [&_button[data-selected-single=true]]:to-[#c026ff] [&_button[data-selected-single=true]]:font-bold [&_button[data-selected-single=true]]:text-white [&_button[data-selected-single=true]]:shadow-[0_0_22px_rgba(192,38,255,0.62)]"
						classNames={{
							root: "mx-auto w-full max-w-[380px]",
							months: "relative mx-auto flex w-full max-w-[380px] flex-col gap-4",
							month: "flex w-full flex-col gap-4",
							nav: "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between",
							month_caption:
								"flex h-9 w-full items-center justify-center px-11 font-display text-base font-bold text-white capitalize",
							button_previous:
								"flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#d1bcff] transition-all hover:border-[#a855f7]/60 hover:bg-[#7b2dff]/20 hover:text-white",
							button_next:
								"flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#d1bcff] transition-all hover:border-[#a855f7]/60 hover:bg-[#7b2dff]/20 hover:text-white",
							weekday:
								"flex-1 pb-1 text-center font-mono text-[11px] font-semibold tracking-wider text-[#8c859e] uppercase select-none",
							week: "mt-1.5 flex w-full gap-1",
							day: "group/day relative flex flex-1 items-center justify-center p-0 text-center select-none",
							today:
								"rounded-xl bg-[#7b2dff]/15 ring-1 ring-[#a855f7]/55 text-white data-[selected=true]:ring-0",
							outside: "text-[#585268] opacity-50",
						}}
					/>
				</div>

				{/* Calendar Availability Legend */}
				<div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/[0.07] pt-4 font-mono text-[11px] text-[#9b93ad]">
					<span className="inline-flex items-center gap-2">
						<span className="h-2.5 w-2.5 rounded-full border border-white/30 bg-white/10" />
						<span>{t("available")}</span>
					</span>
					<span className="inline-flex items-center gap-2">
						<span className="h-2.5 w-2.5 rounded-full bg-linear-to-r from-[#7b2dff] to-[#c026ff] shadow-[0_0_8px_#c026ff]" />
						<span className="text-[#e5d4ff]">{t("selectedLegend")}</span>
					</span>
					<span className="inline-flex items-center gap-2">
						<span className="h-2.5 w-2.5 rounded-full bg-white/15 opacity-40" />
						<span>{t("unavailable")}</span>
					</span>
				</div>
			</div>

			{/* Selected Date Confirmation Pill */}
			{selectedDate ? (
				<motion.div
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex items-center gap-3.5 rounded-2xl border border-[#a855f7]/45 bg-[#7b2dff]/12 px-4 py-3.5 shadow-[0_12px_32px_-12px_rgba(123,45,255,0.4)]"
				>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#7b2dff] to-[#c026ff] text-white shadow-[0_0_18px_rgba(192,38,255,0.45)]">
						<CalendarCheck className="h-5 w-5" aria-hidden="true" />
					</div>
					<div className="min-w-0">
						<p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#d8b4fe] uppercase">
							{t("selected")}
						</p>
						<p className="font-display truncate text-sm font-bold text-white sm:text-base">
							{formatter.dateTime(selectedDate, { dateStyle: "full" })}
						</p>
					</div>
				</motion.div>
			) : null}

			{/* Navigation Actions */}
			<div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
				<Button
					type="button"
					variant="outline"
					onClick={prevStep}
					aria-label={t("back")}
					className="font-display h-13 flex-1 cursor-pointer gap-2 rounded-xl border-white/12 bg-white/[0.03] text-sm font-bold text-[#e5e2e1] transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
				>
					<ArrowLeft className="h-4 w-4" aria-hidden="true" />
					<span>{t("back")}</span>
				</Button>
				<Button
					type="button"
					onClick={nextStep}
					disabled={!bookingDate}
					aria-label={t("next")}
					className="group font-display h-13 flex-1 cursor-pointer gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] text-base font-bold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_14px_38px_-8px_rgba(123,45,255,0.6)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_18px_46px_-6px_rgba(192,38,255,0.68)] hover:brightness-110 active:scale-[0.99] disabled:opacity-45 disabled:hover:scale-100"
				>
					<span>{t("next")}</span>
					<ArrowRight
						className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
						aria-hidden="true"
					/>
				</Button>
			</div>
		</div>
	);
};
