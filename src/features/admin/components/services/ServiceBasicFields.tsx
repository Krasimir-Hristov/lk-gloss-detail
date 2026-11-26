"use client";

import { useTranslations } from "next-intl";
import React from "react";

import { ServiceIconPicker } from "@/features/admin/components/services/ServiceIconPicker";

import type { ServiceFormInput } from "@/features/admin/schemas/servicesSchema";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

const SERVICE_CATEGORIES = ["exterior", "interior", "paint", "protection", "other"] as const;

interface ServiceBasicFieldsProps {
	register: UseFormRegister<ServiceFormInput>;
	errors: FieldErrors<ServiceFormInput>;
	selectedIcon: string;
	onIconChange: (iconName: string) => void;
}

export const ServiceBasicFields: React.FC<ServiceBasicFieldsProps> = ({
	register,
	errors,
	selectedIcon,
	onIconChange,
}) => {
	const t = useTranslations("Admin.services");

	return (
		<div className="space-y-4">
			<h4 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
				{t("form.sections.basic")}
			</h4>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label htmlFor="service-name" className="mb-1 block text-sm font-medium text-neutral-300">
						{t("form.name")}
					</label>
					<input
						id="service-name"
						{...register("name")}
						className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2.5 text-white outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
					/>
					{errors.name ? <p className="mt-1 text-xs text-red-400">{errors.name.message}</p> : null}
				</div>

				<div>
					<label
						htmlFor="service-category"
						className="mb-1 block text-sm font-medium text-neutral-300"
					>
						{t("form.category")}
					</label>
					<select
						id="service-category"
						{...register("category")}
						className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2.5 text-white outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
					>
						{SERVICE_CATEGORIES.map((cat) => (
							<option key={cat} value={cat}>
								{t(`categories.${cat}`)}
							</option>
						))}
					</select>
					{errors.category ? (
						<p className="mt-1 text-xs text-red-400">{errors.category.message}</p>
					) : null}
				</div>

				<div className="md:col-span-2">
					<label htmlFor="service-desc" className="mb-1 block text-sm font-medium text-neutral-300">
						{t("form.shortDescription")}
					</label>
					<textarea
						id="service-desc"
						{...register("short_description")}
						rows={2}
						className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2.5 text-white outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
					/>
				</div>

				<div className="md:col-span-2">
					<ServiceIconPicker
						value={selectedIcon}
						label={t("form.iconName")}
						onChange={onIconChange}
						error={errors.icon?.message}
					/>
				</div>

				<div>
					<label
						htmlFor="service-order"
						className="mb-1 block text-sm font-medium text-neutral-300"
					>
						{t("form.sortOrder")}
					</label>
					<input
						id="service-order"
						type="number"
						{...register("sort_order", { valueAsNumber: true })}
						className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2.5 text-white outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
					/>
				</div>
			</div>
		</div>
	);
};
