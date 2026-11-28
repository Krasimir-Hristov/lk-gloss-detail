"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

import { ServiceBasicFields } from "@/features/admin/components/services/ServiceBasicFields";
import { ServiceImageUploader } from "@/features/admin/components/services/ServiceImageUploader";
import { ServicePricingSection } from "@/features/admin/components/services/ServicePricingSection";
import { ServiceTranslationsSection } from "@/features/admin/components/services/ServiceTranslationsSection";
import {
	ServiceInputSchema,
	type ServiceFormInput,
	type ServiceInput,
	type ServiceLocale,
} from "@/features/admin/schemas/servicesSchema";
import {
	getExactLocalizedText,
	getLocalizedText,
	type AdminServiceItem,
} from "@/features/admin/types/servicesTypes";
import { SUPPORTED_LOCALES, resolveAppLocale } from "@/i18n/locales";

const buildTranslationsMap = (
	getValue: (locale: ServiceLocale) => string,
): Record<ServiceLocale, string> =>
	Object.fromEntries(SUPPORTED_LOCALES.map((loc) => [loc, getValue(loc)])) as Record<
		ServiceLocale,
		string
	>;

const extractTranslationsMap = (
	field: Record<string, string> | string | null | undefined,
): Record<ServiceLocale, string> =>
	buildTranslationsMap((loc) => getExactLocalizedText(field, loc));

const createEmptyTranslationsMap = (): Record<ServiceLocale, string> =>
	buildTranslationsMap(() => "");

interface ServiceModalProps {
	isOpen: boolean;
	service?: AdminServiceItem;
	onClose: () => void;
	onSave: (data: ServiceInput) => Promise<void>;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, service, onClose, onSave }) => {
	const t = useTranslations("Admin.services");
	const rawLocale = useLocale();
	const activeLocale: ServiceLocale = resolveAppLocale(rawLocale);

	const [isUploading, setIsUploading] = useState(false);
	const [showTranslations, setShowTranslations] = useState(false);
	const [hasEditedTranslations, setHasEditedTranslations] = useState(false);
	const [nameOverrides, setNameOverrides] = useState<Record<ServiceLocale, string>>(() =>
		service ? extractTranslationsMap(service.name) : createEmptyTranslationsMap(),
	);
	const [descOverrides, setDescOverrides] = useState<Record<ServiceLocale, string>>(() =>
		service ? extractTranslationsMap(service.short_description) : createEmptyTranslationsMap(),
	);

	const isEditing = Boolean(service);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<ServiceFormInput, unknown, ServiceInput>({
		resolver: zodResolver(ServiceInputSchema),
		defaultValues: service
			? {
					name: getLocalizedText(service.name, activeLocale),
					short_description: getLocalizedText(service.short_description, activeLocale),
					category: service.category,
					icon: service.icon,
					image_url: service.image_url,
					price_small: service.price_small,
					price_medium: service.price_medium,
					price_large: service.price_large,
					price_suv: service.price_suv,
					duration_hours: service.duration_hours,
					active: service.active,
					sort_order: service.sort_order,
					locale: activeLocale,
				}
			: {
					name: "",
					short_description: "",
					category: "exterior",
					icon: "Sparkles",
					image_url: null,
					price_small: 0,
					price_medium: 0,
					price_large: 0,
					price_suv: 0,
					duration_hours: 1,
					active: true,
					sort_order: 0,
					locale: activeLocale,
				},
	});

	const imageUrl = watch("image_url");
	const selectedIcon = watch("icon");

	if (!isOpen) return null;

	const onSubmit = async (data: ServiceInput) => {
		const shouldSyncActiveName =
			!service || data.name.trim() !== getLocalizedText(service.name, activeLocale).trim();
		const shouldSyncActiveDesc =
			!service ||
			(data.short_description ?? "").trim() !==
				getLocalizedText(service.short_description, activeLocale).trim();

		const syncedNames: Record<ServiceLocale, string> = shouldSyncActiveName
			? { ...nameOverrides, [activeLocale]: data.name }
			: { ...nameOverrides };
		const syncedDescs: Record<ServiceLocale, string> = shouldSyncActiveDesc
			? { ...descOverrides, [activeLocale]: data.short_description ?? "" }
			: { ...descOverrides };

		const payload: ServiceInput = hasEditedTranslations
			? {
					...data,
					locale: activeLocale,
					translations: {
						name: syncedNames,
						short_description: syncedDescs,
					},
				}
			: {
					...data,
					locale: activeLocale,
				};

		await onSave(payload);
		if (!isEditing) reset();
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="service-modal-title"
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
		>
			<div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />

			<div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
				<div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-purple-600 to-indigo-600" />

				<div className="flex items-center justify-between border-b border-neutral-800 p-6">
					<h3 id="service-modal-title" className="Montserrat text-xl font-bold text-white">
						{isEditing ? t("form.editTitle") : t("form.addTitle")}
					</h3>
					<button
						type="button"
						onClick={onClose}
						aria-label={t("cancel")}
						className="cursor-pointer rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-6">
					<form id="service-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<ServiceBasicFields
							register={register}
							errors={errors}
							selectedIcon={selectedIcon}
							onIconChange={(iconName) => setValue("icon", iconName, { shouldValidate: true })}
						/>

						<ServiceTranslationsSection
							isExpanded={showTranslations}
							nameOverrides={nameOverrides}
							descOverrides={descOverrides}
							t={t}
							onToggle={() => setShowTranslations((prev) => !prev)}
							onNameChange={(loc, val) => {
								setHasEditedTranslations(true);
								setNameOverrides((prev) => ({ ...prev, [loc]: val }));
							}}
							onDescChange={(loc, val) => {
								setHasEditedTranslations(true);
								setDescOverrides((prev) => ({ ...prev, [loc]: val }));
							}}
						/>

						<ServicePricingSection register={register} errors={errors} />

						<ServiceImageUploader
							imageUrl={imageUrl}
							isUploading={isUploading}
							onUploadingChange={setIsUploading}
							onImageChange={(url) => setValue("image_url", url, { shouldValidate: true })}
						/>

						<div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-800/30 p-4">
							<input
								type="checkbox"
								id="active-toggle"
								{...register("active")}
								className="h-5 w-5 rounded border-neutral-600 bg-neutral-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-neutral-900"
							/>
							<label htmlFor="active-toggle" className="text-sm font-medium text-white">
								{t("form.active")}
							</label>
						</div>
					</form>
				</div>

				<div className="flex items-center justify-end gap-3 border-t border-neutral-800 bg-neutral-950 p-4">
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting || isUploading}
						aria-label={t("cancel")}
						className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-50"
					>
						{t("cancel")}
					</button>
					<button
						type="submit"
						form="service-form"
						disabled={isSubmitting || isUploading}
						aria-label={t("form.save")}
						className="flex cursor-pointer items-center gap-2 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
						{t("form.save")}
					</button>
				</div>
			</div>
		</div>
	);
};
