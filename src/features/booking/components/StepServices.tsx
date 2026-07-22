"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getLocalizedText } from "@/features/admin/types/services.types";
import { useBookingStore } from "@/features/booking/stores/booking-store";

type Service = {
	id: string;
	name: Record<string, string> | string;
	short_description: Record<string, string> | string | null;
	icon: string;
};

export const StepServices = () => {
	const t = useTranslations("Booking.step2");
	const locale = useLocale();
	const { selectedServiceIds, setServices, nextStep, prevStep } = useBookingStore();

	const {
		data: services,
		isLoading,
		error,
	} = useQuery<Service[]>({
		queryKey: ["services"],
		queryFn: async () => {
			const res = await fetch("/api/services");
			if (!res.ok) throw new Error("Failed to fetch services");
			return res.json();
		},
	});

	const toggleService = (serviceId: string) => {
		const updated = selectedServiceIds.includes(serviceId)
			? selectedServiceIds.filter((id) => id !== serviceId)
			: [...selectedServiceIds, serviceId];
		setServices({ selectedServiceIds: updated });
	};

	const handleNext = () => {
		if (selectedServiceIds.length > 0) nextStep();
	};

	if (isLoading) {
		return <p className="text-white/70">{t("loading")}</p>;
	}

	if (error) {
		return <p className="text-red-400">{t("loadingError")}</p>;
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="grid gap-3">
				{services?.map((service) => (
					<div
						key={service.id}
						className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#201f1f] p-4 transition-colors hover:border-[#7b2dff]/30"
						onClick={(e) => {
							// Only toggle from the wrapper click, not from Checkbox events
							if ((e.target as HTMLElement).closest("[data-slot=checkbox]")) return;
							toggleService(service.id);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								toggleService(service.id);
							}
						}}
						role="checkbox"
						aria-checked={selectedServiceIds.includes(service.id)}
						tabIndex={0}
					>
						<Checkbox
							id={`service-${service.id}`}
							checked={selectedServiceIds.includes(service.id)}
							onCheckedChange={() => toggleService(service.id)}
						/>
						<div className="grid gap-1">
							<Label
								htmlFor={`service-${service.id}`}
								className="cursor-pointer text-base font-semibold text-white"
							>
								{getLocalizedText(service.name, locale)}
							</Label>
							{service.short_description ? (
								<p className="text-sm text-white/60">
									{getLocalizedText(service.short_description, locale)}
								</p>
							) : null}
						</div>
					</div>
				))}
			</div>

			{selectedServiceIds.length === 0 ? (
				<p className="text-sm text-red-400">{t("selectMin")}</p>
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
					onClick={handleNext}
					disabled={selectedServiceIds.length === 0}
					className="flex-1 bg-linear-to-r from-[#7b2dff] to-[#b303f2] py-6 text-lg font-bold text-white hover:shadow-[0_0_30px_rgba(123,45,255,0.5)] disabled:opacity-50"
				>
					{t("next")}
				</Button>
			</div>
		</div>
	);
};
