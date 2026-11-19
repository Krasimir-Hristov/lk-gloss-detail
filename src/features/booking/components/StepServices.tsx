"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Clock, Info, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { getLocalizedText } from "@/features/admin/types/servicesTypes";
import { BookingErrorCard } from "@/features/booking/components/BookingErrorCard";
import { useBookingStore } from "@/features/booking/stores/bookingStore";
import { fetchBookingServices, type BookingService } from "@/features/booking/types/bookingService";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

const ServicesSkeleton: React.FC = () => {
	return (
		<div className="flex flex-col gap-3.5" aria-busy="true">
			{[0, 1, 2].map((item) => (
				<div
					key={item}
					className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
				>
					<div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-white/[0.06]" />
					<div className="flex-1 space-y-2.5">
						<div className="h-4 w-44 animate-pulse rounded bg-white/[0.08]" />
						<div className="h-3 w-full max-w-xs animate-pulse rounded bg-white/[0.05]" />
						<div className="flex gap-2">
							<div className="h-5 w-16 animate-pulse rounded-full bg-white/[0.06]" />
							<div className="h-5 w-12 animate-pulse rounded-full bg-white/[0.05]" />
						</div>
					</div>
					<div className="h-6 w-6 shrink-0 animate-pulse rounded-lg bg-white/[0.07]" />
				</div>
			))}
		</div>
	);
};

export const StepServices: React.FC = () => {
	const t = useTranslations("Booking.step2");
	const locale = useLocale();
	const { selectedServiceIds, setServices, setPreselectedServices, nextStep, prevStep } =
		useBookingStore();

	const {
		data: services,
		isLoading,
		error,
		refetch,
	} = useQuery<BookingService[]>({
		queryKey: ["services"],
		queryFn: fetchBookingServices,
	});

	const toggleService = (serviceId: string) => {
		const updated = selectedServiceIds.includes(serviceId)
			? selectedServiceIds.filter((id) => id !== serviceId)
			: [...selectedServiceIds, serviceId];

		if (updated.length === 0) {
			setPreselectedServices([]);
		} else {
			setServices({ selectedServiceIds: updated });
		}
	};

	const handleNext = () => {
		if (selectedServiceIds.length > 0) nextStep();
	};

	if (isLoading) {
		return (
			<div className="flex flex-col gap-5">
				<p className="sr-only">{t("loading")}</p>
				<ServicesSkeleton />
			</div>
		);
	}

	if (error || (!isLoading && (!services || services.length === 0))) {
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
			{/* Selection Counter Pill */}
			<div className="flex items-center justify-between gap-3">
				<span
					className={cn(
						"inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold tracking-wider uppercase transition-colors",
						selectedServiceIds.length > 0
							? "border-[#a855f7]/45 bg-[#7b2dff]/18 text-[#e9d5ff]"
							: "border-white/[0.08] bg-white/[0.03] text-[#9b93ad]",
					)}
				>
					<Sparkles className="h-3.5 w-3.5 text-[#c026ff]" aria-hidden="true" />
					<span>{t("selectedCount", { count: selectedServiceIds.length })}</span>
				</span>
			</div>

			{/* Atelier Service Selection Cards */}
			<div className="grid gap-3.5">
				{services?.map((service) => {
					const isSelected = selectedServiceIds.includes(service.id);
					const IconComponent = getIcon(service.icon);
					const serviceName = getLocalizedText(service.name, locale);
					const serviceDesc = service.short_description
						? getLocalizedText(service.short_description, locale)
						: "";

					return (
						<button
							key={service.id}
							type="button"
							role="checkbox"
							aria-checked={isSelected}
							aria-label={serviceName}
							onClick={() => toggleService(service.id)}
							className={cn(
								"group relative flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#7b2dff]",
								isSelected
									? "border-[#a855f7]/75 bg-linear-to-r from-[#7b2dff]/[0.16] via-[#7b2dff]/[0.08] to-[#c026ff]/[0.08] shadow-[0_14px_38px_-14px_rgba(123,45,255,0.48)]"
									: "border-white/[0.08] bg-[#0c0c13]/85 hover:border-[#7b2dff]/45 hover:bg-[#12111d]",
							)}
						>
							{/* Top Specular Edge when selected */}
							<span
								aria-hidden="true"
								className={cn(
									"pointer-events-none absolute top-0 right-8 left-8 h-px bg-linear-to-r from-transparent via-[#d8b4fe]/80 to-transparent transition-opacity duration-300",
									isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60",
								)}
							/>

							{/* Service Thumbnail or Frosted Icon Medallion */}
							{service.image_url ? (
								<div
									className={cn(
										"relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-colors sm:h-[4.5rem] sm:w-[4.5rem]",
										isSelected ? "border-[#c026ff]/65" : "border-white/10",
									)}
								>
									<ImageWithFallback
										src={service.image_url}
										alt={serviceName}
										fill
										sizes="72px"
										className="object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
									<div className="absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-md border border-[#7b2dff]/50 bg-black/75 text-[#d8b4fe] backdrop-blur-sm">
										<IconComponent className="h-3.5 w-3.5" aria-hidden="true" />
									</div>
								</div>
							) : (
								<div
									className={cn(
										"flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
										isSelected
											? "border-[#c026ff]/70 bg-linear-to-br from-[#7b2dff] to-[#c026ff] text-white shadow-[0_0_20px_rgba(123,45,255,0.45)]"
											: "border-[#7b2dff]/30 bg-[#7b2dff]/10 text-[#d1bcff] group-hover:border-[#a855f7]/60",
									)}
								>
									<IconComponent className="h-6 w-6" aria-hidden="true" />
								</div>
							)}

							{/* Service Details & Telemetry */}
							<div className="min-w-0 flex-1 space-y-1.5">
								<span className="font-display block text-sm font-bold tracking-tight text-white transition-colors group-hover:text-[#f3e8ff] sm:text-base">
									{serviceName}
								</span>

								{serviceDesc ? (
									<p className="line-clamp-2 text-xs leading-relaxed text-[#b8b2c7] sm:text-sm">
										{serviceDesc}
									</p>
								) : null}

								{typeof service.price_small === "number" ||
								typeof service.duration_hours === "number" ? (
									<div className="flex flex-wrap items-center gap-2 pt-1">
										{typeof service.price_small === "number" ? (
											<span className="inline-flex items-center rounded-full border border-[#7b2dff]/35 bg-[#7b2dff]/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#e9d5ff]">
												{t("fromPrice", { price: service.price_small })}
											</span>
										) : null}
										{typeof service.duration_hours === "number" ? (
											<span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#b8b2c7]">
												<Clock className="h-3 w-3 text-[#a855f7]" aria-hidden="true" />
												<span>{service.duration_hours}h</span>
											</span>
										) : null}
									</div>
								) : null}
							</div>

							{/* Right Visual Check Indicator */}
							<span
								aria-hidden="true"
								className={cn(
									"flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
									isSelected
										? "border-[#d8b4fe]/70 bg-linear-to-br from-[#7b2dff] to-[#c026ff] text-white shadow-[0_0_16px_rgba(192,38,255,0.6)]"
										: "border-white/20 bg-white/[0.03] text-transparent group-hover:border-[#a855f7]/60",
								)}
							>
								<Check className="h-3.5 w-3.5 stroke-[3]" />
							</span>
						</button>
					);
				})}
			</div>

			{selectedServiceIds.length === 0 ? (
				<div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3.5 py-2.5 text-xs font-medium text-amber-200">
					<Info className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
					<span>{t("selectMin")}</span>
				</div>
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
					onClick={handleNext}
					disabled={selectedServiceIds.length === 0}
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
