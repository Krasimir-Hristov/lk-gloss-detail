"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { createBooking } from "@/actions/booking";
import { Button } from "@/components/ui/Button";
import { CONTACT_INFO } from "@/constants/contact";
import { getLocalizedText } from "@/features/admin/types/servicesTypes";
import { useBookingStore } from "@/features/booking/stores/bookingStore";

type Service = {
	id: string;
	name: Record<string, string> | string;
};

export const StepSummary = () => {
	const t = useTranslations("Booking.step4");
	const tErrors = useTranslations("Errors");
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
				submitError === "dateTaken" ? (
					<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
						<p className="text-sm font-medium text-amber-400">{t("dateTaken")}</p>
					</div>
				) : (
					<div
						role="alert"
						aria-live="assertive"
						className="flex flex-col items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center"
					>
						<p className="text-sm font-medium text-red-400">
							{tErrors("bookingUnavailable.submitError")}
						</p>
						<a
							href={`tel:${CONTACT_INFO.phoneRaw}`}
							className="inline-flex items-center gap-2 text-xs font-semibold text-[#d1bcff] underline underline-offset-4 hover:text-white"
						>
							<Phone className="h-3.5 w-3.5" aria-hidden="true" />
							<span>
								{tErrors("bookingUnavailable.callUs")}: {CONTACT_INFO.phone}
							</span>
						</a>
					</div>
				)
			) : null}

			<div className="flex gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={prevStep}
					disabled={isSubmitting}
					className="flex-1 border-white/20 bg-transparent py-6 text-white hover:bg-white/10"
				>
					{t("back")}
				</Button>
				<Button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
					className="flex-1 bg-linear-to-r from-[#7b2dff] to-[#b303f2] py-6 text-lg font-bold text-white hover:shadow-[0_0_30px_rgba(123,45,255,0.5)] disabled:opacity-50"
				>
					{isSubmitting ? t("submitting") : t("confirm")}
				</Button>
			</div>
		</div>
	);
};
