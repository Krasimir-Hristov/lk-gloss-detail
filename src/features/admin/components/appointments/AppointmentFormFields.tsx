"use client";

import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { getLocalizedText } from "@/features/admin/types/servicesTypes";

import type {
	AppointmentServiceItem,
	AppointmentStatus,
} from "@/features/admin/types/appointmentsTypes";

interface AppointmentFormFieldsProps {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	carDescription: string;
	bookingDate: string;
	status: AppointmentStatus;
	selectedServiceIds: string[];
	availableServices: AppointmentServiceItem[];
	onFirstNameChange: (val: string) => void;
	onLastNameChange: (val: string) => void;
	onEmailChange: (val: string) => void;
	onPhoneChange: (val: string) => void;
	onCarDescriptionChange: (val: string) => void;
	onBookingDateChange: (val: string) => void;
	onStatusChange: (val: AppointmentStatus) => void;
	onServiceToggle: (id: string) => void;
}

export const AppointmentFormFields: React.FC<AppointmentFormFieldsProps> = ({
	firstName,
	lastName,
	email,
	phone,
	carDescription,
	bookingDate,
	status,
	selectedServiceIds,
	availableServices,
	onFirstNameChange,
	onLastNameChange,
	onEmailChange,
	onPhoneChange,
	onCarDescriptionChange,
	onBookingDateChange,
	onStatusChange,
	onServiceToggle,
}) => {
	const t = useTranslations("Admin.appointments");
	const tServices = useTranslations("HomePage.services");
	const locale = useLocale();

	const getServiceName = (name: Record<string, string> | string) => {
		const localized = getLocalizedText(name, locale);
		try {
			if (tServices.has(`${localized}.title`)) {
				return tServices(`${localized}.title`);
			}
		} catch {
			// Fallback
		}
		return localized;
	};

	const inputClass =
		"mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none";

	return (
		<>
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
						onChange={(e) => onFirstNameChange(e.target.value)}
						className={inputClass}
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
						onChange={(e) => onLastNameChange(e.target.value)}
						className={inputClass}
					/>
				</div>
			</div>

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
						onChange={(e) => onEmailChange(e.target.value)}
						className={inputClass}
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
						onChange={(e) => onPhoneChange(e.target.value)}
						className={inputClass}
					/>
				</div>
			</div>

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
						onChange={(e) => onCarDescriptionChange(e.target.value)}
						className={inputClass}
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
						onChange={(e) => onBookingDateChange(e.target.value)}
						className={inputClass}
					/>
				</div>
			</div>

			<div>
				<label htmlFor="edit-status" className="block font-medium text-neutral-400">
					{t("modals.edit.status")}
				</label>
				<select
					id="edit-status"
					value={status}
					onChange={(e) => onStatusChange(e.target.value as AppointmentStatus)}
					className={inputClass}
				>
					<option value="pending">{t("status.pending")}</option>
					<option value="confirmed">{t("status.confirmed")}</option>
					<option value="completed">{t("status.completed")}</option>
					<option value="cancelled">{t("status.cancelled")}</option>
				</select>
			</div>

			<div>
				<span className="mb-2 block font-medium text-neutral-400">
					{t("modals.edit.services")} ({selectedServiceIds.length})
				</span>
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
										onChange={() => onServiceToggle(service.id)}
										className="rounded border-neutral-700 bg-neutral-900 text-purple-600 focus:ring-purple-500"
									/>
									<span className="font-medium text-white">{getServiceName(service.name)}</span>
								</div>
								<span className="font-semibold text-emerald-400">
									€{service.price_medium || service.price_small}
								</span>
							</label>
						);
					})}
				</div>
			</div>
		</>
	);
};
