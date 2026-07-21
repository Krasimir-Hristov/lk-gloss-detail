"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
	X,
	Calendar,
	User,
	Mail,
	Phone,
	Car,
	Tag,
	Clock,
	Trash2,
	Edit,
	CheckCircle2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";

import { updateAppointmentStatus } from "@/features/admin/actions/appointments";

import type {
	AdminAppointment,
	AppointmentStatus,
} from "@/features/admin/types/appointments.types";

interface AppointmentDetailModalProps {
	appointment: AdminAppointment | null;
	onClose: () => void;
	onEdit: (appointment: AdminAppointment) => void;
	onDelete: (appointmentId: string) => void;
	onStatusChanged: (appointmentId: string, newStatus: AppointmentStatus) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
	appointment,
	onClose,
	onEdit,
	onDelete,
	onStatusChanged,
}) => {
	const t = useTranslations("Admin.appointments");
	const tServices = useTranslations("HomePage.services");
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && appointment && !isUpdatingStatus) {
				onClose();
			}
		};
		if (appointment) {
			window.addEventListener("keydown", handleKeyDown);
		}
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [appointment, isUpdatingStatus, onClose]);

	const getServiceName = (name: string) => {
		try {
			if (tServices.has(`${name}.title`)) {
				return tServices(`${name}.title`);
			}
		} catch {
			// Fallback
		}
		return name;
	};

	const handleStatusChange = async (newStatus: AppointmentStatus) => {
		if (!appointment || newStatus === appointment.status || isUpdatingStatus) return;
		setIsUpdatingStatus(true);

		try {
			const res = await updateAppointmentStatus({ id: appointment.id, status: newStatus });
			if (res.success) {
				onStatusChanged(appointment.id, newStatus);
			} else {
				alert(res.error);
			}
		} catch (err) {
			console.error("[AppointmentDetailModal] Error updating status:", err);
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const totalPrice = appointment
		? appointment.services.reduce((acc, s) => acc + (s.price_medium || s.price_small), 0)
		: 0;

	const statusColors: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
		pending: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
		confirmed: {
			bg: "bg-emerald-500/10",
			text: "text-emerald-400",
			border: "border-emerald-500/30",
		},
		completed: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
		cancelled: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
	};

	return (
		<AnimatePresence>
			{appointment ? (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="appointment-detail-title"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.2 }}
						className="relative w-full max-w-xl overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
					>
						{/* Close Button */}
						<button
							type="button"
							onClick={onClose}
							className="absolute top-4 right-4 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
						>
							<X className="size-5" />
						</button>

						{/* Header */}
						<div className="mb-6 border-b border-neutral-800 pb-4">
							<div className="flex items-center gap-3">
								<span
									className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase ${
										statusColors[appointment.status]?.bg || ""
									} ${statusColors[appointment.status]?.text || ""} ${
										statusColors[appointment.status]?.border || ""
									}`}
								>
									<CheckCircle2 className="size-3.5" />
									{t(`status.${appointment.status}`)}
								</span>
								<span className="text-xs text-neutral-500">ID: {appointment.id.slice(0, 8)}</span>
							</div>
							<h2
								id="appointment-detail-title"
								className="Montserrat mt-2 text-2xl font-bold text-white"
							>
								{appointment.first_name} {appointment.last_name}
							</h2>
						</div>

						{/* Body Content */}
						<div className="space-y-6 text-sm text-neutral-300">
							{/* Date & Time */}
							<div className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-950/20 p-3 text-purple-300">
								<Calendar className="size-5 text-purple-400" />
								<div>
									<p className="text-xs font-medium text-purple-400 uppercase">{t("table.date")}</p>
									<p className="text-base font-bold text-white">{appointment.booking_date}</p>
								</div>
							</div>

							{/* Client Contact Info */}
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
									<div>
										<p className="text-xs text-neutral-500">{t("modals.details.phone")}</p>
										<a
											href={`tel:${appointment.phone}`}
											className="font-semibold text-purple-400 hover:underline"
										>
											{appointment.phone}
										</a>
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

							{/* Services */}
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

							{/* Quick Status Switcher */}
							<div>
								<p className="mb-2 text-xs font-semibold text-neutral-400 uppercase">
									{t("modals.details.updateStatus")}
								</p>
								<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
									{(["pending", "confirmed", "completed", "cancelled"] as AppointmentStatus[]).map(
										(st) => (
											<button
												key={st}
												type="button"
												disabled={isUpdatingStatus}
												onClick={() => handleStatusChange(st)}
												className={`cursor-pointer rounded-lg border py-2 text-xs font-semibold uppercase transition-all ${
													appointment.status === st
														? `${statusColors[st]?.bg || ""} ${statusColors[st]?.text || ""} ${statusColors[st]?.border || ""} ring-2 ring-purple-500/50`
														: "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
												}`}
											>
												{t(`status.${st}`)}
											</button>
										),
									)}
								</div>
							</div>
						</div>

						{/* Modal Footer Actions */}
						<div className="mt-6 flex items-center justify-between border-t border-neutral-800 pt-4">
							<button
								type="button"
								onClick={() => onDelete(appointment.id)}
								className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-950/40"
							>
								<Trash2 className="size-4" /> {t("modals.details.delete")}
							</button>

							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={() => onEdit(appointment)}
									className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/30 px-4 py-2 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-950/60"
								>
									<Edit className="size-4" /> {t("modals.details.edit")}
								</button>
								<button
									type="button"
									onClick={onClose}
									className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
								>
									{t("modals.details.close")}
								</button>
							</div>
						</div>
					</motion.div>
				</div>
			) : null}
		</AnimatePresence>
	);
};
