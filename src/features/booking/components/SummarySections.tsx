"use client";

import { parseISO } from "date-fns";
import { CalendarCheck, Car, Clock, Mail, Pencil, Phone, Sparkles, User } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import React from "react";

import { getLocalizedText } from "@/features/admin/types/servicesTypes";
import { getIcon } from "@/lib/iconMap";

import type { BookingService } from "@/features/booking/types/bookingService";

type SummarySectionsProps = {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	carDescription?: string;
	selectedServices: BookingService[];
	bookingDate: string;
	isSubmitting: boolean;
	onEditStep: (step: 1 | 2 | 3) => void;
};

export const SummarySections: React.FC<SummarySectionsProps> = ({
	firstName,
	lastName,
	email,
	phone,
	carDescription,
	selectedServices,
	bookingDate,
	isSubmitting,
	onEditStep,
}) => {
	const t = useTranslations("Booking.step4");
	const tBooking = useTranslations("Booking");
	const tStep2 = useTranslations("Booking.step2");
	const locale = useLocale();
	const format = useFormatter();

	const formattedDate = bookingDate
		? format.dateTime(parseISO(bookingDate), { dateStyle: "full" })
		: "";

	return (
		<>
			{/* Section 1: Client Details */}
			<section className="rounded-2xl border border-white/[0.08] bg-[#0b0b11]/90 p-4 sm:p-5">
				<div className="mb-4 flex items-center justify-between gap-2.5 border-b border-white/[0.07] pb-3 sm:gap-3">
					<h3 className="font-display flex min-w-0 items-center gap-2 text-xs leading-snug font-bold tracking-wide text-white uppercase sm:text-sm">
						<User className="h-4 w-4 shrink-0 text-[#a855f7]" aria-hidden="true" />
						<span className="break-words">{t("yourData")}</span>
					</h3>
					<button
						type="button"
						onClick={() => onEditStep(1)}
						disabled={isSubmitting}
						aria-label={`${tBooking("edit")} ${t("yourData")}`}
						className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#d1bcff] transition-colors hover:border-[#a855f7]/50 hover:bg-[#7b2dff]/15 hover:text-white disabled:opacity-40"
					>
						<Pencil className="h-3 w-3" aria-hidden="true" />
						<span>{tBooking("edit")}</span>
					</button>
				</div>

				<dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
					<div className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
						<dt className="font-mono text-[10px] tracking-wider text-[#8c859e] uppercase">
							{t("name")}
						</dt>
						<dd className="mt-0.5 font-semibold break-words text-white">
							{firstName} {lastName}
						</dd>
					</div>

					<div className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
						<dt className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-[#8c859e] uppercase">
							<Phone className="h-3 w-3 text-[#a855f7]" aria-hidden="true" />
							<span>{t("phone")}</span>
						</dt>
						<dd className="mt-0.5 font-semibold break-words text-white">{phone}</dd>
					</div>

					<div className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 sm:col-span-2">
						<dt className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-[#8c859e] uppercase">
							<Mail className="h-3 w-3 text-[#a855f7]" aria-hidden="true" />
							<span>{t("email")}</span>
						</dt>
						<dd className="mt-0.5 font-semibold break-all text-white">{email}</dd>
					</div>

					{carDescription ? (
						<div className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 sm:col-span-2">
							<dt className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-[#8c859e] uppercase">
								<Car className="h-3 w-3 text-[#a855f7]" aria-hidden="true" />
								<span>{t("carDescription")}</span>
							</dt>
							<dd className="mt-1 text-sm leading-relaxed break-words text-[#e5e2e1]">
								{carDescription}
							</dd>
						</div>
					) : null}
				</dl>
			</section>

			{/* Section 2: Selected Services */}
			<section className="rounded-2xl border border-white/[0.08] bg-[#0b0b11]/90 p-4 sm:p-5">
				<div className="mb-4 flex items-center justify-between gap-2.5 border-b border-white/[0.07] pb-3 sm:gap-3">
					<h3 className="font-display flex min-w-0 items-center gap-2 text-xs leading-snug font-bold tracking-wide text-white uppercase sm:text-sm">
						<Sparkles className="h-4 w-4 shrink-0 text-[#a855f7]" aria-hidden="true" />
						<span className="break-words">{t("selectedServices")}</span>
					</h3>
					<button
						type="button"
						onClick={() => onEditStep(2)}
						disabled={isSubmitting}
						aria-label={`${tBooking("edit")} ${t("selectedServices")}`}
						className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#d1bcff] transition-colors hover:border-[#a855f7]/50 hover:bg-[#7b2dff]/15 hover:text-white disabled:opacity-40"
					>
						<Pencil className="h-3 w-3" aria-hidden="true" />
						<span>{tBooking("edit")}</span>
					</button>
				</div>

				<ul className="flex flex-col gap-2.5">
					{selectedServices.map((service) => {
						const IconComponent = getIcon(service.icon);
						return (
							<li
								key={service.id}
								className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#7b2dff]/25 bg-[#7b2dff]/[0.07] px-3 py-2.5 sm:flex-nowrap sm:gap-3 sm:px-3.5"
							>
								<div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#7b2dff]/40 bg-[#7b2dff]/18 text-[#d8b4fe]">
										<IconComponent className="h-4 w-4" aria-hidden="true" />
									</div>
									<span className="line-clamp-2 text-sm font-semibold text-white">
										{getLocalizedText(service.name, locale)}
									</span>
								</div>

								<div className="flex shrink-0 items-center gap-2">
									{typeof service.duration_hours === "number" ? (
										<span className="hidden items-center gap-1 font-mono text-[11px] text-[#b8b2c7] sm:inline-flex">
											<Clock className="h-3 w-3 text-[#a855f7]" aria-hidden="true" />
											{service.duration_hours}h
										</span>
									) : null}
									{typeof service.price_small === "number" ? (
										<span className="rounded-full border border-[#7b2dff]/40 bg-[#7b2dff]/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#e9d5ff]">
											{tStep2("fromPrice", { price: service.price_small })}
										</span>
									) : null}
								</div>
							</li>
						);
					})}
				</ul>
			</section>

			{/* Section 3: Appointment Date */}
			<section className="rounded-2xl border border-[#a855f7]/40 bg-linear-to-r from-[#7b2dff]/14 via-[#7b2dff]/[0.08] to-transparent p-4 sm:p-5">
				<div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap sm:items-center">
					<div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#7b2dff] to-[#c026ff] text-white shadow-[0_0_20px_rgba(192,38,255,0.45)] sm:h-11 sm:w-11">
							<CalendarCheck className="h-5 w-5" aria-hidden="true" />
						</div>
						<div className="min-w-0">
							<h3 className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#d8b4fe] uppercase sm:text-[11px] sm:tracking-[0.16em]">
								{t("dateAndTime")}
							</h3>
							<p className="font-display mt-0.5 text-sm leading-snug font-bold break-words text-white sm:text-lg">
								{formattedDate}
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={() => onEditStep(3)}
						disabled={isSubmitting}
						aria-label={`${tBooking("edit")} ${t("dateAndTime")}`}
						className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-black/35 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#e9d5ff] transition-colors hover:border-[#c026ff]/65 hover:bg-[#7b2dff]/25 hover:text-white disabled:opacity-40"
					>
						<Pencil className="h-3 w-3" aria-hidden="true" />
						<span>{tBooking("edit")}</span>
					</button>
				</div>
			</section>
		</>
	);
};
