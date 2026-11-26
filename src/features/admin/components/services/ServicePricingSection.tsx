"use client";

import { useTranslations } from "next-intl";
import React from "react";

import type { ServiceFormInput } from "@/features/admin/schemas/servicesSchema";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

const PRICE_FIELDS = [
	["price_small", "Small (€)"],
	["price_medium", "Medium (€)"],
	["price_large", "Large (€)"],
	["price_suv", "SUV (€)"],
] as const;

interface ServicePricingSectionProps {
	register: UseFormRegister<ServiceFormInput>;
	errors: FieldErrors<ServiceFormInput>;
}

export const ServicePricingSection: React.FC<ServicePricingSectionProps> = ({
	register,
	errors,
}) => {
	const t = useTranslations("Admin.services");

	return (
		<div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
			<h4 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
				{t("form.sections.pricing")}
			</h4>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{PRICE_FIELDS.map(([field, label]) => (
					<div key={field}>
						<label
							htmlFor={`service-${field}`}
							className="mb-1 block text-sm font-medium text-neutral-300"
						>
							{label}
						</label>
						<input
							id={`service-${field}`}
							type="number"
							step="0.01"
							{...register(field, { valueAsNumber: true })}
							className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-white outline-hidden focus:border-purple-500"
						/>
					</div>
				))}
			</div>
			<div className="pt-2">
				<label
					htmlFor="service-duration"
					className="mb-1 block text-sm font-medium text-neutral-300"
				>
					{t("form.durationHours")}
				</label>
				<input
					id="service-duration"
					type="number"
					step="0.5"
					{...register("duration_hours", { valueAsNumber: true })}
					className="w-full max-w-xs rounded-md border border-neutral-700 bg-neutral-800 p-2 text-white outline-hidden focus:border-purple-500"
				/>
				{errors.duration_hours ? (
					<p className="mt-1 text-xs text-red-400">{errors.duration_hours.message}</p>
				) : null}
			</div>
		</div>
	);
};
