"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";

import { createBooking } from "@/actions/booking";
import { Button } from "@/components/ui/Button";
import { CONTACT_INFO } from "@/constants/contact";
import { SummarySections } from "@/features/booking/components/SummarySections";
import { useBookingStore } from "@/features/booking/stores/bookingStore";
import { fetchBookingServices, type BookingService } from "@/features/booking/types/bookingService";

export const StepSummary: React.FC = () => {
	const t = useTranslations("Booking.step4");
	const tStep3 = useTranslations("Booking.step3");
	const tErrors = useTranslations("Errors");
	const router = useRouter();
	const queryClient = useQueryClient();
	const {
		firstName,
		lastName,
		email,
		phone,
		carDescription,
		selectedServiceIds,
		bookingDate,
		isSubmitting,
		setIsSubmitting,
		setSubmitError,
		submitError,
		setStep,
		reset,
		prevStep,
	} = useBookingStore();

	const { data: services = [] } = useQuery<BookingService[]>({
		queryKey: ["services"],
		queryFn: fetchBookingServices,
	});

	const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setSubmitError(null);

		try {
			const result = await createBooking({
				firstName,
				lastName,
				email,
				phone,
				carDescription,
				selectedServiceIds,
				bookingDate,
			});

			if (!result.success) {
				const isDateConflict = result.error === "DATE_TAKEN" || result.error === "DATE_BLOCKED";
				if (isDateConflict) {
					await queryClient.invalidateQueries({ queryKey: ["unavailable-dates"] });
				}
				setSubmitError(isDateConflict ? "dateTaken" : "generic");
				return;
			}

			// Invalidate TanStack query cache for unavailable-dates so the calendar refreshes immediately
			await queryClient.invalidateQueries({ queryKey: ["unavailable-dates"] });
			router.refresh();

			reset();
			router.push(`/booking/success?id=${result.appointmentId}`);
		} catch {
			setSubmitError("generic");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<SummarySections
				firstName={firstName}
				lastName={lastName}
				email={email}
				phone={phone}
				carDescription={carDescription}
				selectedServices={selectedServices}
				bookingDate={bookingDate}
				isSubmitting={isSubmitting}
				onEditStep={setStep}
			/>

			{/* Error Feedback Alerts */}
			{submitError ? (
				submitError === "dateTaken" ? (
					<div
						role="alert"
						aria-live="assertive"
						className="flex flex-col items-center gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-center"
					>
						<div className="flex items-center gap-2 text-amber-300">
							<AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
							<p className="text-sm font-medium">{t("dateTaken")}</p>
						</div>
						<button
							type="button"
							onClick={() => {
								setSubmitError(null);
								setStep(3);
							}}
							aria-label={tStep3("chooseAnotherDate")}
							className="cursor-pointer rounded-lg border border-amber-400/40 bg-amber-500/20 px-4 py-1.5 font-mono text-xs font-bold text-amber-200 transition-colors hover:bg-amber-500/30 hover:text-white"
						>
							{tStep3("chooseAnotherDate")}
						</button>
					</div>
				) : (
					<div
						role="alert"
						aria-live="assertive"
						className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/35 bg-rose-500/10 p-4 text-center"
					>
						<p className="text-sm font-medium text-rose-300">
							{tErrors("bookingUnavailable.submitError")}
						</p>
						<a
							href={`tel:${CONTACT_INFO.phoneRaw}`}
							aria-label={`${tErrors("bookingUnavailable.callUs")}: ${CONTACT_INFO.phone}`}
							className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-[#e9d5ff] transition-colors hover:border-[#a855f7]/60 hover:text-white"
						>
							<Phone className="h-3.5 w-3.5 text-[#c026ff]" aria-hidden="true" />
							<span>
								{tErrors("bookingUnavailable.callUs")}: {CONTACT_INFO.phone}
							</span>
						</a>
					</div>
				)
			) : null}

			{/* Final Action Buttons */}
			<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
				<Button
					type="button"
					variant="outline"
					onClick={prevStep}
					disabled={isSubmitting}
					aria-label={t("back")}
					className="font-display h-13 w-full cursor-pointer gap-2 rounded-xl border-white/12 bg-white/3 text-sm font-bold text-[#e5e2e1] transition-all hover:border-white/25 hover:bg-white/8 hover:text-white disabled:opacity-45 sm:flex-1"
				>
					<ArrowLeft className="h-4 w-4" aria-hidden="true" />
					<span>{t("back")}</span>
				</Button>
				<Button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
					aria-label={isSubmitting ? t("submitting") : t("confirm")}
					className="group font-display h-13 w-full cursor-pointer gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-4 text-sm font-bold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_14px_38px_-8px_rgba(123,45,255,0.65)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_18px_48px_-6px_rgba(192,38,255,0.72)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 sm:flex-1 sm:gap-2.5 sm:px-6 sm:text-base"
				>
					{isSubmitting ? (
						<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
					) : (
						<CheckCircle2 className="h-4 w-4 text-[#f3e8ff]" aria-hidden="true" />
					)}
					<span>{isSubmitting ? t("submitting") : t("confirm")}</span>
				</Button>
			</div>
		</div>
	);
};
