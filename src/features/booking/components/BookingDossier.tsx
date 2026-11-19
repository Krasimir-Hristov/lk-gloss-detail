"use client";

import { useQuery } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import {
	CalendarCheck,
	CalendarClock,
	Car,
	Clock,
	MapPin,
	MessageCircle,
	Phone,
	Sparkles,
	User,
} from "lucide-react";
import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import React from "react";

import { heroShowroom, lkLogo } from "@/assets";
import { CONTACT_INFO } from "@/constants/contact";
import { getLocalizedText } from "@/features/admin/types/servicesTypes";
import { useBookingStore } from "@/features/booking/stores/bookingStore";
import { fetchBookingServices, type BookingService } from "@/features/booking/types/bookingService";
import { getIcon } from "@/lib/iconMap";

export const BookingDossier: React.FC = () => {
	const t = useTranslations("Booking.dossier");
	const tHome = useTranslations("HomePage.mobileService.features");
	const locale = useLocale();
	const format = useFormatter();

	const { step, firstName, lastName, carDescription, selectedServiceIds, bookingDate } =
		useBookingStore();

	const { data: services = [] } = useQuery<BookingService[]>({
		queryKey: ["services"],
		queryFn: fetchBookingServices,
	});

	const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
	const clientName = [firstName, lastName].filter(Boolean).join(" ").trim();
	const trimmedVehicle = carDescription?.trim() ?? "";

	const estimatedMinPrice = selectedServices.reduce(
		(acc, service) => acc + (typeof service.price_small === "number" ? service.price_small : 0),
		0,
	);
	const estimatedDuration = selectedServices.reduce(
		(acc, service) =>
			acc + (typeof service.duration_hours === "number" ? service.duration_hours : 0),
		0,
	);

	const formattedDate = bookingDate
		? format.dateTime(parseISO(bookingDate), { dateStyle: "long" })
		: "";

	const stepBadge = `${String(step).padStart(2, "0")} / 04`;

	return (
		<aside aria-label={t("title")} className="obsidian-card relative overflow-hidden rounded-3xl">
			{/* Top specular light strip */}
			<div className="pointer-events-none absolute top-0 right-8 left-8 z-20 h-px bg-linear-to-r from-transparent via-[#c026ff]/70 to-transparent" />

			{/* Rim-Lit Studio Header */}
			<div className="relative aspect-16/9 w-full overflow-hidden bg-[#0a0a0f]">
				<Image
					src={heroShowroom}
					alt="LK Gloss & Detail Mobile Detailing Studio"
					placeholder="blur"
					fill
					sizes="(max-width: 1024px) 100vw, 40vw"
					className="object-cover object-[60%_center] opacity-85"
				/>
				<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0e0e14] via-[#0e0e14]/45 to-black/35" />

				{/* Top Watermark & Live Status */}
				<div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-1.5 sm:top-3.5 sm:right-3.5 sm:left-3.5 sm:gap-2">
					<div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-black/65 px-2 py-1 backdrop-blur-xl sm:gap-2 sm:px-2.5">
						<div className="relative h-4 w-4 shrink-0 overflow-hidden rounded border border-[#7b2dff]/55 bg-black">
							<Image
								src={lkLogo}
								alt="LK Gloss & Detail"
								width={16}
								height={16}
								className="h-full w-full scale-105 object-cover"
							/>
						</div>
						<span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#e5e2e1] uppercase min-[390px]:text-[10px] sm:tracking-[0.16em]">
							LK Gloss
						</span>
					</div>

					<div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-[#a855f7]/40 bg-black/65 px-2 py-1 backdrop-blur-xl sm:px-2.5">
						<span className="relative flex h-2 w-2 shrink-0">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c026ff] opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-[#d8b4fe]" />
						</span>
						<span className="truncate font-mono text-[9px] font-semibold tracking-[0.1em] text-[#e9d5ff] uppercase min-[390px]:text-[10px] sm:tracking-[0.14em]">
							{t("statusOpen")}
						</span>
					</div>
				</div>

				{/* Bottom Header Title */}
				<div className="absolute right-4 bottom-3.5 left-4 flex items-end justify-between gap-2.5 sm:right-5 sm:bottom-4 sm:left-5 sm:gap-3">
					<div className="min-w-0">
						<h2 className="font-display truncate text-base font-extrabold tracking-tight text-white sm:text-xl">
							{t("title")}
						</h2>
					</div>
					<span className="shrink-0 rounded-lg border border-white/12 bg-black/60 px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest text-[#d8b4fe] backdrop-blur-md">
						{stepBadge}
					</span>
				</div>
			</div>

			{/* Live Telemetry Readout Rows */}
			<div className="space-y-4 p-4 sm:p-6">
				<dl className="space-y-3">
					{/* Client */}
					<div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
						<dt className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider text-[#9b93ad] uppercase">
							<User className="h-3.5 w-3.5 text-[#a855f7]" aria-hidden="true" />
							<span>{t("client")}</span>
						</dt>
						<dd className="truncate text-right text-sm font-semibold text-white">
							{clientName || <span className="font-normal text-[#6f6882]">{t("pending")}</span>}
						</dd>
					</div>

					{/* Vehicle (shown when provided) */}
					{trimmedVehicle ? (
						<div className="flex items-start justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
							<dt className="flex shrink-0 items-center gap-2 font-mono text-[11px] font-semibold tracking-wider text-[#9b93ad] uppercase">
								<Car className="h-3.5 w-3.5 text-[#a855f7]" aria-hidden="true" />
								<span>{t("vehicle")}</span>
							</dt>
							<dd className="line-clamp-2 text-right text-xs leading-relaxed font-medium text-[#e5e2e1]">
								{trimmedVehicle}
							</dd>
						</div>
					) : null}

					{/* Selected Services */}
					<div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5">
						<dt className="mb-2.5 flex items-center justify-between gap-2">
							<span className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider text-[#9b93ad] uppercase">
								<Sparkles className="h-3.5 w-3.5 text-[#a855f7]" aria-hidden="true" />
								<span>{t("services")}</span>
							</span>
							{selectedServices.length > 0 ? (
								<span className="rounded-full border border-[#7b2dff]/40 bg-[#7b2dff]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#e9d5ff]">
									{selectedServices.length}
								</span>
							) : null}
						</dt>
						<dd>
							{selectedServices.length > 0 ? (
								<ul className="flex flex-wrap gap-1.5">
									{selectedServices.map((service) => {
										const IconComponent = getIcon(service.icon);
										return (
											<li
												key={service.id}
												className="inline-flex items-center gap-1.5 rounded-lg border border-[#7b2dff]/35 bg-[#7b2dff]/14 px-2.5 py-1 text-xs font-medium text-[#f1eff7]"
											>
												<IconComponent
													className="h-3 w-3 shrink-0 text-[#d8b4fe]"
													aria-hidden="true"
												/>
												<span>{getLocalizedText(service.name, locale)}</span>
											</li>
										);
									})}
								</ul>
							) : (
								<p className="text-xs text-[#6f6882]">{t("pending")}</p>
							)}
						</dd>
					</div>

					{/* Estimated Price & Duration Telemetry (real DB fields) */}
					{selectedServices.length > 0 && (estimatedMinPrice > 0 || estimatedDuration > 0) ? (
						<div className="grid grid-cols-2 gap-2.5 sm:gap-3">
							{estimatedMinPrice > 0 ? (
								<div className="min-w-0 rounded-2xl border border-[#7b2dff]/30 bg-linear-to-br from-[#7b2dff]/15 to-transparent px-3 py-2.5 sm:px-4 sm:py-3">
									<p className="truncate font-mono text-[10px] font-semibold tracking-wider text-[#d1bcff] uppercase">
										{t("estimatedStart")}
									</p>
									<p className="font-display mt-1 text-lg font-black tracking-tight text-white sm:text-xl">
										€{estimatedMinPrice}
									</p>
								</div>
							) : null}

							{estimatedDuration > 0 ? (
								<div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 sm:px-4 sm:py-3">
									<p className="truncate font-mono text-[10px] font-semibold tracking-wider text-[#9b93ad] uppercase">
										{t("estimatedDuration")}
									</p>
									<p className="font-display mt-1 flex items-center gap-1.5 text-lg font-black tracking-tight text-white sm:text-xl">
										<Clock className="h-4 w-4 shrink-0 text-[#a855f7]" aria-hidden="true" />
										<span>~{estimatedDuration}h</span>
									</p>
								</div>
							) : null}
						</div>
					) : null}

					{/* Preferred Date */}
					<div
						className={
							formattedDate
								? "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl border border-[#a855f7]/40 bg-[#7b2dff]/12 px-4 py-3"
								: "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3"
						}
					>
						<dt className="flex shrink-0 items-center gap-2 font-mono text-[11px] font-semibold tracking-wider text-[#d1bcff] uppercase">
							<CalendarCheck className="h-3.5 w-3.5 text-[#c026ff]" aria-hidden="true" />
							<span>{t("date")}</span>
						</dt>
						<dd className="text-right text-sm font-bold text-white">
							{formattedDate || <span className="font-normal text-[#6f6882]">{t("pending")}</span>}
						</dd>
					</div>
				</dl>

				{/* Authentic Mobile Studio Assurances */}
				<div className="space-y-2.5 border-t border-white/[0.07] pt-4">
					<div className="flex items-start gap-2.5">
						<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#a855f7]" aria-hidden="true" />
						<p className="text-xs leading-relaxed text-[#b8b2c7]">
							<span className="font-semibold text-white">{tHome("onSite.title")}</span> —{" "}
							{tHome("onSite.desc")}
						</p>
					</div>
					<div className="flex items-start gap-2.5">
						<CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[#a855f7]" aria-hidden="true" />
						<p className="text-xs leading-relaxed text-[#b8b2c7]">
							<span className="font-semibold text-white">{tHome("noAppointment.title")}</span> —{" "}
							{tHome("noAppointment.desc")}
						</p>
					</div>
				</div>

				{/* Direct Concierge Contact Channels */}
				<div className="border-t border-white/[0.07] pt-4">
					<p className="mb-2.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#9b93ad] uppercase">
						{t("needHelp")}
					</p>
					<div className="grid grid-cols-2 gap-2.5">
						<a
							href={`tel:${CONTACT_INFO.phoneRaw}`}
							aria-label={`${t("callCta")}: ${CONTACT_INFO.phone}`}
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-[#e5e2e1] transition-all hover:border-[#a855f7]/60 hover:bg-[#7b2dff]/15 hover:text-white"
						>
							<Phone className="h-3.5 w-3.5 text-[#d1bcff]" aria-hidden="true" />
							<span>{t("callCta")}</span>
						</a>
						<a
							href={CONTACT_INFO.whatsappUrl}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`${t("whatsappCta")}: ${CONTACT_INFO.phone}`}
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-3 py-2.5 text-xs font-semibold text-emerald-200 transition-all hover:border-emerald-400/55 hover:bg-emerald-500/20 hover:text-white"
						>
							<MessageCircle className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
							<span>{t("whatsappCta")}</span>
						</a>
					</div>
				</div>
			</div>
		</aside>
	);
};
