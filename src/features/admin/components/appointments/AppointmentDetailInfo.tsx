"use client";

import { Calendar, Car, Clock, Mail, MessageCircle, Phone, Tag, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { sanitizeTel, toWhatsappUrl } from "@/features/admin/components/messages/contactLinks";
import { getLocalizedText } from "@/features/admin/types/servicesTypes";

import type { AdminAppointment } from "@/features/admin/types/appointmentsTypes";

interface AppointmentDetailInfoProps {
	appointment: AdminAppointment;
}

export const AppointmentDetailInfo: React.FC<AppointmentDetailInfoProps> = ({ appointment }) => {
	const t = useTranslations("Admin.appointments");
	const tServices = useTranslations("HomePage.services");
	const locale = useLocale();

	const getServiceName = (name: string | Record<string, string>) => {
		const localized = getLocalizedText(name, locale);
		if (typeof name === "object" && name !== null) return localized;
		try {
			if (tServices.has(`${localized}.title`)) return tServices(`${localized}.title`);
		} catch {
			// Fallback to localized text
		}
		return localized;
	};

	const totalPrice = appointment.services.reduce(
		(acc, s) => acc + (s.price_medium || s.price_small),
		0,
	);
	const telTarget = sanitizeTel(appointment.phone);
	const waUrl = toWhatsappUrl(appointment.phone);

	return (
		<>
			<div className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-950/20 p-3 text-purple-300">
				<Calendar className="size-5 text-purple-400" />
				<div>
					<p className="text-xs font-medium text-purple-400 uppercase">{t("table.date")}</p>
					<p className="text-base font-bold text-white">{appointment.booking_date}</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
					<User className="mt-0.5 size-4 text-neutral-500" />
					<div>
						<p className="text-xs text-neutral-500">{t("modals.details.clientName")}</p>
						<p className="font-semibold text-white">
							{appointment.first_name} {appointment.last_name}
						</p>
					</div>
				</div>

				<div className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
					<Mail className="mt-0.5 size-4 text-neutral-500" />
					<div className="truncate">
						<p className="text-xs text-neutral-500">{t("modals.details.email")}</p>
						<a
							href={`mailto:${appointment.email}`}
							className="truncate font-semibold text-purple-400 hover:underline"
						>
							{appointment.email}
						</a>
					</div>
				</div>

				<div className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
					<Phone className="mt-0.5 size-4 text-neutral-500" />
					<div className="space-y-1.5">
						<p className="text-xs text-neutral-500">{t("modals.details.phone")}</p>
						<div className="flex flex-wrap items-center gap-2">
							{telTarget ? (
								<a
									href={`tel:${telTarget}`}
									aria-label={`${t("call")} ${appointment.first_name}`}
									className="font-semibold text-emerald-400 hover:underline"
								>
									{appointment.phone}
								</a>
							) : (
								<span className="font-semibold text-white">{appointment.phone || "—"}</span>
							)}
							{waUrl ? (
								<a
									href={waUrl}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`WhatsApp ${appointment.first_name}`}
									className="inline-flex items-center gap-1 rounded border border-[#25D366]/30 bg-[#25D366]/10 px-2 py-0.5 text-[11px] font-semibold text-[#25D366] hover:bg-[#25D366]/20"
								>
									<MessageCircle className="size-3" /> WhatsApp
								</a>
							) : null}
						</div>
					</div>
				</div>

				<div className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
					<Car className="mt-0.5 size-4 text-neutral-500" />
					<div>
						<p className="text-xs text-neutral-500">{t("modals.details.car")}</p>
						<p className="font-semibold text-white">{appointment.car_description || "—"}</p>
					</div>
				</div>
			</div>

			<div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
				<div className="mb-3 flex items-center justify-between">
					<p className="flex items-center gap-2 font-semibold text-white">
						<Tag className="size-4 text-purple-400" />
						{t("modals.details.bookedServices")} ({appointment.services.length})
					</p>
					<span className="font-bold text-emerald-400">
						{t("modals.details.total")}: ~€{totalPrice}
					</span>
				</div>
				<div className="space-y-2">
					{appointment.services.map((service) => (
						<div
							key={service.id}
							className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-900 p-2.5 text-xs"
						>
							<div>
								<p className="font-medium text-white">{getServiceName(service.name)}</p>
								<span className="flex items-center gap-1 text-neutral-400">
									<Clock className="size-3" /> {service.duration_hours}h
								</span>
							</div>
							<span className="font-bold text-white">
								€{service.price_medium || service.price_small}
							</span>
						</div>
					))}
				</div>
			</div>
		</>
	);
};
