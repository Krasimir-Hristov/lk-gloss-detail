"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/features/booking/stores/booking-store";

type Service = {
	id: string;
	name: string;
};

export const StepSummary = () => {
	const t = useTranslations("Booking.step4");
	const router = useRouter();
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
		reset,
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
			const res = await fetch("/api/booking/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					firstName,
					lastName,
					email,
					phone,
					carDescription,
					selectedServiceIds,
					bookingDate,
				}),
			});

			if (res.status === 409) {
				setSubmitError("dateTaken");
				setIsSubmitting(false);
				return;
			}

			if (!res.ok) {
				setSubmitError("generic");
				setIsSubmitting(false);
				return;
			}

			reset();
			router.push(
				`/booking/success?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`,
			);
		} catch {
			setSubmitError("generic");
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
				<ul className="list-inside list-disc text-sm text-white/80">
					{selectedServices.map((service) => (
						<li key={service.id}>{service.name}</li>
					))}
				</ul>
			</div>

			<div className="rounded-xl border border-white/10 bg-[#201f1f] p-5">
				<h3 className="mb-4 text-lg font-semibold text-white">{t("date")}</h3>
				<p className="text-sm text-white/80">
					{bookingDate ? format(parseISO(bookingDate), "dd.MM.yyyy") : "-"}
				</p>
			</div>

			{useBookingStore.getState().submitError ? (
				<p className="text-center text-sm text-red-400">
					{t(useBookingStore.getState().submitError as string)}
				</p>
			) : null}

			<div className="flex gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => useBookingStore.getState().prevStep()}
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
					{isSubmitting ? t("submitting") : t("submit")}
				</Button>
			</div>
		</div>
	);
};
