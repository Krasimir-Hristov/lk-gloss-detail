"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3, AlertCircle, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";

import { editAppointment } from "@/features/admin/actions/appointments";

import type {
	AdminAppointment,
	AppointmentServiceItem,
	AppointmentStatus,
} from "@/features/admin/types/appointments.types";

interface EditAppointmentModalProps {
	appointment: AdminAppointment | null;
	availableServices: AppointmentServiceItem[];
	onClose: () => void;
	onSaved: () => void;
}

export const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
	appointment,
	availableServices,
	onClose,
	onSaved,
}) => {
	const t = useTranslations("Admin.appointments");
	const tServices = useTranslations("HomePage.services");

	const [firstName, setFirstName] = useState(appointment?.first_name || "");
	const [lastName, setLastName] = useState(appointment?.last_name || "");
	const [email, setEmail] = useState(appointment?.email || "");
	const [phone, setPhone] = useState(appointment?.phone || "");
	const [carDescription, setCarDescription] = useState(appointment?.car_description || "");
	const [bookingDate, setBookingDate] = useState(appointment?.booking_date || "");
	const [status, setStatus] = useState<AppointmentStatus>(appointment?.status || "confirmed");
	const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
		appointment ? appointment.services.map((s) => s.id) : [],
	);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && appointment && !isSubmitting) {
				onClose();
			}
		};
		if (appointment) {
			window.addEventListener("keydown", handleKeyDown);
		}
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [appointment, isSubmitting, onClose]);

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

	const handleServiceToggle = (id: string) => {
		setSelectedServiceIds((prev) =>
			prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id],
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!appointment) return;
		if (selectedServiceIds.length === 0) {
			setErrorMsg("Please select at least one service.");
			return;
		}

		setIsSubmitting(true);
		setErrorMsg(null);

		try {
			const res = await editAppointment({
				id: appointment.id,
				first_name: firstName,
				last_name: lastName,
				email,
				phone,
				car_description: carDescription || null,
				booking_date: bookingDate,
				status,
				service_ids: selectedServiceIds,
			});

			if (res.success) {
				onSaved();
			} else {
				setErrorMsg(res.error);
			}
		} catch (err) {
			console.error("[EditAppointmentModal] Error saving changes:", err);
			setErrorMsg("Failed to update appointment");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{appointment ? (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="edit-appointment-title"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.2 }}
						className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
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
						<div className="mb-6 flex items-center gap-3 border-b border-neutral-800 pb-4">
							<div className="rounded-lg border border-purple-500/30 bg-purple-950/30 p-2.5 text-purple-400">
								<Edit3 className="size-6" />
							</div>
							<div>
								<h2 id="edit-appointment-title" className="Montserrat text-xl font-bold text-white">
									{t("modals.edit.title")}
								</h2>
								<p className="text-xs text-neutral-400">ID: {appointment.id.slice(0, 8)}</p>
							</div>
						</div>

						{errorMsg ? (
							<div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-400">
								<AlertCircle className="size-4 shrink-0" />
								{errorMsg}
							</div>
						) : null}

						<form onSubmit={handleSubmit} className="space-y-4 text-xs">
							{/* Name fields */}
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label htmlFor="edit-first-name" className="block font-medium text-neutral-400">
										{t("modals.edit.firstName")}
									</label>
									<input
										id="edit-first-name"
										type="text"
										required
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
										className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
									/>
								</div>

								<div>
									<label htmlFor="edit-last-name" className="block font-medium text-neutral-400">
										{t("modals.edit.lastName")}
									</label>
									<input
										id="edit-last-name"
										type="text"
										required
										value={lastName}
										onChange={(e) => setLastName(e.target.value)}
										className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
									/>
								</div>
							</div>

							{/* Contact fields */}
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label htmlFor="edit-email" className="block font-medium text-neutral-400">
										{t("modals.edit.email")}
									</label>
									<input
										id="edit-email"
										type="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
									/>
								</div>

								<div>
									<label htmlFor="edit-phone" className="block font-medium text-neutral-400">
										{t("modals.edit.phone")}
									</label>
									<input
										id="edit-phone"
										type="tel"
										required
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
									/>
								</div>
							</div>

							{/* Car description & Date */}
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label htmlFor="edit-car" className="block font-medium text-neutral-400">
										{t("modals.edit.car")}
									</label>
									<input
										id="edit-car"
										type="text"
										placeholder="e.g. BMW M3 Black"
										value={carDescription}
										onChange={(e) => setCarDescription(e.target.value)}
										className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
									/>
								</div>

								<div>
									<label htmlFor="edit-booking-date" className="block font-medium text-neutral-400">
										{t("modals.edit.date")}
									</label>
									<input
										id="edit-booking-date"
										type="date"
										required
										value={bookingDate}
										onChange={(e) => setBookingDate(e.target.value)}
										className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
									/>
								</div>
							</div>

							{/* Status Dropdown */}
							<div>
								<label htmlFor="edit-status" className="block font-medium text-neutral-400">
									{t("modals.edit.status")}
								</label>
								<select
									id="edit-status"
									value={status}
									onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
									className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
								>
									<option value="pending">{t("status.pending")}</option>
									<option value="confirmed">{t("status.confirmed")}</option>
									<option value="completed">{t("status.completed")}</option>
									<option value="cancelled">{t("status.cancelled")}</option>
								</select>
							</div>

							{/* Services Selector */}
							<div>
								<label className="mb-2 block font-medium text-neutral-400">
									{t("modals.edit.services")} ({selectedServiceIds.length})
								</label>
								<div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3">
									{availableServices.map((service) => {
										const isChecked = selectedServiceIds.includes(service.id);

										return (
											<label
												key={service.id}
												className={`flex cursor-pointer items-center justify-between rounded p-2 transition-colors ${
													isChecked
														? "bg-purple-950/40 text-purple-200"
														: "text-neutral-400 hover:bg-neutral-900"
												}`}
											>
												<div className="flex items-center gap-2">
													<input
														type="checkbox"
														checked={isChecked}
														onChange={() => handleServiceToggle(service.id)}
														className="rounded border-neutral-700 bg-neutral-900 text-purple-600 focus:ring-purple-500"
													/>
													<span className="font-medium text-white">
														{getServiceName(service.name)}
													</span>
												</div>
												<span className="font-semibold text-emerald-400">
													€{service.price_medium || service.price_small}
												</span>
											</label>
										);
									})}
								</div>
							</div>

							{/* Actions */}
							<div className="mt-6 flex items-center justify-end gap-3 border-t border-neutral-800 pt-4">
								<button
									type="button"
									onClick={onClose}
									className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
								>
									{t("modals.edit.cancel")}
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
								>
									<Save className="size-4" /> {t("modals.edit.save")}
								</button>
							</div>
						</form>
					</motion.div>
				</div>
			) : null}
		</AnimatePresence>
	);
};
