"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Edit, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";

import { updateAppointmentStatus } from "@/features/admin/actions/appointments";
import { AppointmentDetailInfo } from "@/features/admin/components/appointments/AppointmentDetailInfo";

import type { AdminAppointment, AppointmentStatus } from "@/features/admin/types/appointmentsTypes";

interface AppointmentDetailModalProps {
	appointment: AdminAppointment | null;
	onClose: () => void;
	onEdit: (appointment: AdminAppointment) => void;
	onDelete: (appointmentId: string) => void;
	onStatusChanged: (appointmentId: string, newStatus: AppointmentStatus) => void;
}

const statusColors: Record<AppointmentStatus, string> = {
	pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
	confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
	completed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
	cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
	"pending",
	"confirmed",
	"completed",
	"cancelled",
];

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
	appointment,
	onClose,
	onEdit,
	onDelete,
	onStatusChanged,
}) => {
	const t = useTranslations("Admin.appointments");
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && appointment && !isUpdatingStatus) onClose();
		};
		if (appointment) window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [appointment, isUpdatingStatus, onClose]);

	const handleStatusChange = async (newStatus: AppointmentStatus) => {
		if (!appointment || newStatus === appointment.status || isUpdatingStatus) return;
		setIsUpdatingStatus(true);
		setErrorMsg(null);
		try {
			const res = await updateAppointmentStatus({ id: appointment.id, status: newStatus });
			if (res.success) {
				onStatusChanged(appointment.id, newStatus);
			} else {
				setErrorMsg(res.error);
			}
		} catch (err) {
			console.error("[AppointmentDetailModal] Error updating status:", err);
			setErrorMsg(t("errors.statusUpdateFailed"));
		} finally {
			setIsUpdatingStatus(false);
		}
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
						className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-2xl sm:p-6"
					>
						<button
							type="button"
							onClick={onClose}
							aria-label={t("modals.details.close")}
							className="absolute top-4 right-4 cursor-pointer rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
						>
							<X className="size-5" />
						</button>

						<div className="mb-5 border-b border-neutral-800 pb-4">
							<div className="flex items-center gap-3">
								<span
									className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase ${statusColors[appointment.status] || ""}`}
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

						{errorMsg ? (
							<div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-400">
								<AlertCircle className="size-4 shrink-0" />
								<span>{errorMsg}</span>
							</div>
						) : null}

						<div className="space-y-5 text-sm text-neutral-300">
							<AppointmentDetailInfo appointment={appointment} />

							<div>
								<p className="mb-2 text-xs font-semibold text-neutral-400 uppercase">
									{t("modals.details.updateStatus")}
								</p>
								<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
									{APPOINTMENT_STATUSES.map((st) => (
										<button
											key={st}
											type="button"
											disabled={isUpdatingStatus}
											onClick={() => handleStatusChange(st)}
											aria-label={t(`status.${st}`)}
											className={`cursor-pointer rounded-lg border py-2 text-xs font-semibold uppercase transition-all ${
												appointment.status === st
													? `${statusColors[st]} ring-2 ring-purple-500/50`
													: "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
											}`}
										>
											{t(`status.${st}`)}
										</button>
									))}
								</div>
							</div>
						</div>

						<div className="mt-6 flex items-center justify-between border-t border-neutral-800 pt-4">
							<button
								type="button"
								onClick={() => onDelete(appointment.id)}
								aria-label={t("modals.details.delete")}
								className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-950/40"
							>
								<Trash2 className="size-4" /> {t("modals.details.delete")}
							</button>

							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={() => onEdit(appointment)}
									aria-label={t("modals.details.edit")}
									className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/30 px-4 py-2 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-950/60"
								>
									<Edit className="size-4" /> {t("modals.details.edit")}
								</button>
								<button
									type="button"
									onClick={onClose}
									aria-label={t("modals.details.close")}
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
