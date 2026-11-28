"use client";

import { Search, Eye, Edit, Trash2, Calendar, Mail, Phone, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";

import { getLocalizedText } from "@/features/admin/types/servicesTypes";

import type { AdminAppointment, AppointmentStatus } from "@/features/admin/types/appointmentsTypes";

interface AppointmentsListViewProps {
	appointments: AdminAppointment[];
	initialStatus?: AppointmentStatus | "all";
	onViewDetails: (appointment: AdminAppointment) => void;
	onEdit: (appointment: AdminAppointment) => void;
	onDelete: (appointmentId: string) => void;
}

const sanitizeTel = (phone: string): string => phone.replace(/[^\d+]/g, "");

const toWhatsappUrl = (phone: string): string | null => {
	let digits = phone.replace(/\D/g, "");
	if (!digits) return null;
	if (digits.startsWith("00")) {
		digits = digits.slice(2);
	} else if (digits.startsWith("0")) {
		digits = `49${digits.slice(1)}`;
	}
	return `https://wa.me/${digits}`;
};

export const AppointmentsListView: React.FC<AppointmentsListViewProps> = ({
	appointments,
	initialStatus = "all",
	onViewDetails,
	onEdit,
	onDelete,
}) => {
	const t = useTranslations("Admin.appointments");
	const tServices = useTranslations("HomePage.services");
	const locale = useLocale();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

	const getServiceName = (name: string | Record<string, string>) => {
		if (typeof name === "object" && name !== null) {
			return getLocalizedText(name, locale);
		}
		const nameStr = String(name);
		try {
			if (tServices.has(`${nameStr}.title`)) {
				return tServices(`${nameStr}.title`);
			}
		} catch {
			// Fallback to name
		}
		return nameStr;
	};

	const filteredAppointments = appointments.filter((app) => {
		if (statusFilter !== "all" && app.status !== statusFilter) {
			return false;
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			const fullName = `${app.first_name} ${app.last_name}`.toLowerCase();
			const email = app.email.toLowerCase();
			const phone = app.phone.toLowerCase();
			const car = (app.car_description || "").toLowerCase();
			const date = app.booking_date.toLowerCase();

			return (
				fullName.includes(q) ||
				email.includes(q) ||
				phone.includes(q) ||
				car.includes(q) ||
				date.includes(q)
			);
		}

		return true;
	});

	const statusBadges: Record<AppointmentStatus, { label: string; class: string }> = {
		pending: {
			label: t("status.pending"),
			class: "bg-amber-500/10 text-amber-400 border-amber-500/30",
		},
		confirmed: {
			label: t("status.confirmed"),
			class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
		},
		completed: {
			label: t("status.completed"),
			class: "bg-blue-500/10 text-blue-400 border-blue-500/30",
		},
		cancelled: {
			label: t("status.cancelled"),
			class: "bg-rose-500/10 text-rose-400 border-rose-500/30",
		},
	};

	return (
		<div className="space-y-4">
			{/* Filters Bar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative flex-1">
					<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
					<input
						type="text"
						placeholder={t("searchPlaceholder")}
						aria-label={t("searchPlaceholder")}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2.5 pr-4 pl-9 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
					/>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-xs text-neutral-400">{t("filterLabel")}</span>
					<select
						aria-label={t("filterLabel")}
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-white focus:border-purple-500 focus:outline-none"
					>
						<option value="all">
							{t("allStatuses")} ({appointments.length})
						</option>
						<option value="pending">{t("status.pending")}</option>
						<option value="confirmed">{t("status.confirmed")}</option>
						<option value="completed">{t("status.completed")}</option>
						<option value="cancelled">{t("status.cancelled")}</option>
					</select>
				</div>
			</div>

			{/* Appointments Data Table */}
			<div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="border-b border-neutral-800 bg-neutral-950 tracking-wider text-neutral-400 uppercase">
							<tr>
								<th className="p-4 font-semibold">{t("table.date")}</th>
								<th className="p-4 font-semibold">{t("table.client")}</th>
								<th className="p-4 font-semibold">{t("table.services")}</th>
								<th className="p-4 font-semibold">{t("table.total")}</th>
								<th className="p-4 font-semibold">{t("table.status")}</th>
								<th className="p-4 text-right font-semibold">{t("table.actions")}</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-neutral-800/60 text-neutral-300">
							{filteredAppointments.length === 0 ? (
								<tr>
									<td colSpan={6} className="p-8 text-center text-neutral-500">
										{t("noAppointments")}
									</td>
								</tr>
							) : (
								filteredAppointments.map((appt) => {
									const totalPrice = appt.services.reduce(
										(acc, s) => acc + (s.price_medium || s.price_small),
										0,
									);
									const telTarget = sanitizeTel(appt.phone);
									const waUrl = toWhatsappUrl(appt.phone);

									return (
										<tr key={appt.id} className="transition-colors hover:bg-neutral-800/40">
											<td className="p-4 whitespace-nowrap">
												<div className="flex items-center gap-2 font-bold text-white">
													<Calendar className="size-4 shrink-0 text-purple-400" />
													{appt.booking_date}
												</div>
											</td>

											<td className="p-4">
												<div className="font-semibold text-white">
													{appt.first_name} {appt.last_name}
												</div>
												<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-neutral-400">
													<span className="flex items-center gap-1">
														<Mail className="size-3" /> {appt.email}
													</span>
													{telTarget ? (
														<a
															href={`tel:${telTarget}`}
															aria-label={`${t("call")} ${appt.first_name}`}
															className="inline-flex items-center gap-1 font-medium text-emerald-400 hover:underline"
														>
															<Phone className="size-3" /> {appt.phone}
														</a>
													) : (
														<span className="flex items-center gap-1">
															<Phone className="size-3" /> {appt.phone}
														</span>
													)}
													{waUrl ? (
														<a
															href={waUrl}
															target="_blank"
															rel="noopener noreferrer"
															aria-label={`WhatsApp ${appt.first_name}`}
															className="inline-flex items-center gap-1 font-medium text-[#25D366] hover:underline"
														>
															<MessageCircle className="size-3" /> WhatsApp
														</a>
													) : null}
												</div>
											</td>

											<td className="p-4">
												<div className="space-y-0.5">
													{appt.services.map((s) => (
														<div key={s.id} className="text-neutral-300">
															• {getServiceName(s.name)}
														</div>
													))}
												</div>
											</td>

											<td className="p-4 font-bold whitespace-nowrap text-emerald-400">
												~€{totalPrice}
											</td>

											<td className="p-4 whitespace-nowrap">
												<span
													className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
														statusBadges[appt.status]?.class || ""
													}`}
												>
													{statusBadges[appt.status]?.label || appt.status}
												</span>
											</td>

											<td className="p-4 text-right whitespace-nowrap">
												<div className="flex items-center justify-end gap-1.5">
													<button
														type="button"
														onClick={() => onViewDetails(appt)}
														aria-label={t("modals.details.title")}
														className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-neutral-300 transition-colors hover:border-purple-500/50 hover:text-purple-400"
														title={t("modals.details.title")}
													>
														<Eye className="size-4" />
													</button>
													<button
														type="button"
														onClick={() => onEdit(appt)}
														aria-label={t("modals.edit.title")}
														className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-neutral-300 transition-colors hover:border-purple-500/50 hover:text-purple-400"
														title={t("modals.edit.title")}
													>
														<Edit className="size-4" />
													</button>
													<button
														type="button"
														onClick={() => onDelete(appt.id)}
														aria-label={t("modals.details.delete")}
														className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-rose-400 transition-colors hover:border-rose-500/50 hover:bg-rose-950/20"
														title={t("modals.details.delete")}
													>
														<Trash2 className="size-4" />
													</button>
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};
