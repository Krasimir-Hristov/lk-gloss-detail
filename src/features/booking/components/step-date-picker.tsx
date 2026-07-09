"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useBookingStore } from "@/features/booking/stores/booking-store";

export const StepDatePicker = () => {
	const t = useTranslations("Booking.step3");
	const { bookingDate, setDate, nextStep, prevStep } = useBookingStore();

	const {
		data: unavailableDates = [],
		isLoading,
		error: fetchError,
	} = useQuery<string[]>({
		queryKey: ["unavailable-dates"],
		queryFn: async () => {
			const res = await fetch("/api/booking/unavailable-dates");
			if (!res.ok) throw new Error("Failed to fetch unavailable dates");
			return res.json();
		},
	});

	const selectedDate = bookingDate ? parseISO(bookingDate) : undefined;

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
		return <p className="text-white/70">{t("loading")}</p>;
	}

	if (fetchError) {
		return <p className="text-red-400">{t("loadingError")}</p>;
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="flex justify-center">
				<Calendar
					mode="single"
					selected={selectedDate}
					onSelect={handleSelect}
					disabled={[{ before: new Date() }, (date) => isDateUnavailable(date)]}
					className="rounded-xl border border-white/10 bg-[#201f1f] p-4"
				/>
			</div>

			{selectedDate ? (
				<p className="text-center text-white">
					{t("selected")}:{" "}
					<span className="font-semibold text-[#7b2dff]">{format(selectedDate, "dd.MM.yyyy")}</span>
				</p>
			) : null}

			<div className="flex gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={prevStep}
					className="flex-1 border-white/20 bg-transparent py-6 text-white hover:bg-white/10"
				>
					{t("back")}
				</Button>
				<Button
					type="button"
					onClick={nextStep}
					disabled={!bookingDate}
					className="flex-1 bg-linear-to-r from-[#7b2dff] to-[#b303f2] py-6 text-lg font-bold text-white hover:shadow-[0_0_30px_rgba(123,45,255,0.5)] disabled:opacity-50"
				>
					{t("next")}
				</Button>
			</div>
		</div>
	);
};
