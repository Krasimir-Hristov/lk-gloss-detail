"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";

import { createBooking } from "@/actions/booking";
import { Button } from "@/components/ui/button";
import { getLocalizedText } from "@/features/admin/types/services.types";
import { useBookingStore } from "@/features/booking/stores/booking-store";

type Service = {
	id: string;
	name: Record<string, string> | string;
};

export const StepSummary = () => {
	const t = useTranslations("Booking.step4");
	const locale = useLocale();
	const format = useFormatter();
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
		reset,
		prevStep,
	} = useBookingStore();

	const { data: services = [] } = useQuery<Service[]>({
		queryKey: ["services"],
		queryFn: async () => {
			const res = await fetch("/api/services");
			if (!res.ok) throw new Error("Failed to fetch services");
			return res.json();
		},
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
				setSubmitError(result.error === "DATE_TAKEN" ? "dateTaken" : "generic");
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
		<div className="flex flex-col gap-5">
			<div className="rounded-xl border border-white/10 bg-[#201f1f] p-5">
				<h3 className="mb-4 text-lg font-semibold text-white">{t("yourData")}</h3>
				<div className="grid gap-2 text-sm">
					<p className="text-white/80">
						{t("name")}:{" "}
						<span className="text-white">
							{firstName} {lastName}
						</span>
					</p>
					<p className="text-white/80">
						{t("email")}: <span className="text-white">{email}</span>
					</p>
					<p className="text-white/80">
						{t("phone")}: <span className="text-white">{phone}</span>
					</p>
					{carDescription ? (
						<p className="text-white/80">
							{t("carDescription")}: <span className="text-white">{carDescription}</span>
						</p>
					) : null}
				</div>
			</div>

			<div className="rounded-xl border border-white/10 bg-[#201f1f] p-5">
				<h3 className="mb-4 text-lg font-semibold text-white">{t("selectedServices")}</h3>
				<ul className="flex flex-col gap-2">
					{selectedServices.map((service) => (
						<li key={service.id} className="text-sm text-white/80">
							• {getLocalizedText(service.name, locale)}
						</li>
					))}
				</ul>
			</div>

			<div className="rounded-xl border border-white/10 bg-[#201f1f] p-5">
				<h3 className="mb-4 text-lg font-semibold text-white">{t("dateAndTime")}</h3>
				<p className="text-sm text-white">
					{bookingDate ? format.dateTime(new Date(bookingDate), { dateStyle: "long" }) : ""}
				</p>
			</div>

			{submitError ? (
				<p className="text-center text-sm font-medium text-red-500">{t(submitError)}</p>
			) : null}

			<div className="flex justify-between gap-5">
				<Button variant="outline" onClick={prevStep} disabled={isSubmitting}>
					{t("back")}
				</Button>
				<Button onClick={handleSubmit} disabled={isSubmitting}>
					{isSubmitting ? t("submitting") : t("confirm")}
				</Button>
			</div>
		</div>
	);
};
