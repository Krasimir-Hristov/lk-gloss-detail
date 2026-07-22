import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";

import { uploadServiceImage } from "@/features/admin/actions/services";
import { ServiceInputSchema, type ServiceInput } from "@/features/admin/schemas/services.schema";
import { getLocalizedText, type AdminServiceItem } from "@/features/admin/types/services.types";

interface ServiceModalProps {
	isOpen: boolean;
	service?: AdminServiceItem;
	onClose: () => void;
	onSave: (data: ServiceInput) => Promise<void>;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, service, onClose, onSave }) => {
	const t = useTranslations("Admin.services");
	const locale = useLocale();
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const isEditing = !!service;

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<ServiceInput>({
		resolver: zodResolver(ServiceInputSchema),
		defaultValues: service
			? {
					name: getLocalizedText(service.name, locale),
					short_description: getLocalizedText(service.short_description, locale),
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
				},
	});

	const imageUrl = watch("image_url");

	if (!isOpen) return null;

	const onSubmit = async (data: ServiceInput) => {
		await onSave(data);
		if (!isEditing) reset();
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploadError(null);
		setIsUploading(true);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const result = await uploadServiceImage(formData);
			if (result.success) {
				setValue("image_url", result.data, { shouldValidate: true });
			} else {
				setUploadError(result.error);
			}
		} catch {
			setUploadError("Image upload failed");
		} finally {
			setIsUploading(false);
		}
	};

	const removeImage = () => {
		setValue("image_url", null, { shouldValidate: true });
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

			<div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
				<div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-blue-500 to-cyan-400" />

				{/* Header */}
				<div className="flex items-center justify-between border-b border-neutral-800 p-6">
					<h3 className="Montserrat text-xl font-bold text-white">
						{isEditing ? t("form.editTitle") : t("form.addTitle")}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-6">
					<form id="service-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
						{/* Basic Info */}
						<div className="space-y-4">
							<h4 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
								{t("form.sections.basic")}
							</h4>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<label className="mb-1 block text-sm font-medium text-neutral-300">
										{t("form.name")}
									</label>
									<input
										{...register("name")}
										className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2.5 text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
									/>
									{errors.name ? (
										<p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
									) : null}
								</div>

								<div>
									<label className="mb-1 block text-sm font-medium text-neutral-300">
										{t("form.category")}
									</label>
									<select
										{...register("category")}
										className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2.5 text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
									>
										<option value="exterior">Exterior</option>
										<option value="interior">Interior</option>
										<option value="paint">Paint Correction</option>
										<option value="protection">Protection / Coating</option>
										<option value="other">Other</option>
									</select>
									{errors.category ? (
										<p className="mt-1 text-xs text-red-400">{errors.category.message}</p>
									) : null}
								</div>

								<div className="md:col-span-2">
									<label className="mb-1 block text-sm font-medium text-neutral-300">
										{t("form.shortDescription")}
									</label>
									<textarea
										{...register("short_description")}
										rows={2}
										className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2.5 text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="mb-1 block text-sm font-medium text-neutral-300">
										{t("form.iconName")}
									</label>
									<input
										{...register("icon")}
										className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2.5 text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
										placeholder="e.g. Sparkles, ShieldCheck"
									/>
									{errors.icon ? (
										<p className="mt-1 text-xs text-red-400">{errors.icon.message}</p>
									) : null}
								</div>

								<div>
									<label className="mb-1 block text-sm font-medium text-neutral-300">
										{t("form.sortOrder")}
									</label>
									<input
										type="number"
										{...register("sort_order", { valueAsNumber: true })}
										className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2.5 text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
									/>
								</div>
							</div>
						</div>

						{/* Pricing & Duration */}
						<div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
							<h4 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
								{t("form.sections.pricing")}
							</h4>
							<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
								<div>
									<label className="mb-1 block text-sm font-medium text-neutral-300">
										Small (€)
									</label>
									<input
										type="number"
										step="0.01"
										{...register("price_small", { valueAsNumber: true })}
										className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-white outline-hidden focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium text-neutral-300">
										Medium (€)
									</label>
									<input
										type="number"
										step="0.01"
										{...register("price_medium", { valueAsNumber: true })}
										className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-white outline-hidden focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium text-neutral-300">
										Large (€)
									</label>
									<input
										type="number"
										step="0.01"
										{...register("price_large", { valueAsNumber: true })}
										className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-white outline-hidden focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium text-neutral-300">SUV (€)</label>
									<input
										type="number"
										step="0.01"
										{...register("price_suv", { valueAsNumber: true })}
										className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-white outline-hidden focus:border-blue-500"
									/>
								</div>
							</div>
							<div className="pt-2">
								<label className="mb-1 block text-sm font-medium text-neutral-300">
									{t("form.durationHours")}
								</label>
								<input
									type="number"
									step="0.5"
									{...register("duration_hours", { valueAsNumber: true })}
									className="max-w- w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-white outline-hidden focus:border-blue-500"
								/>
								{errors.duration_hours ? (
									<p className="mt-1 text-xs text-red-400">{errors.duration_hours.message}</p>
								) : null}
							</div>
						</div>

						{/* Image Upload */}
						<div className="space-y-4">
							<h4 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
								{t("form.sections.image")}
							</h4>

							<div className="flex flex-col items-start gap-4 sm:flex-row">
								<div className="max-w- relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-800/50 hover:border-blue-500/50">
									{imageUrl ? (
										<>
											<Image src={imageUrl} alt="Preview" fill className="object-cover" />
											<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
												<button
													type="button"
													onClick={removeImage}
													className="rounded-full bg-red-500/80 p-2 text-white hover:bg-red-500"
												>
													<X className="h-5 w-5" />
												</button>
											</div>
										</>
									) : (
										<div className="flex flex-col items-center justify-center p-6 text-neutral-500">
											{isUploading ? (
												<Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-500" />
											) : (
												<ImageIcon className="mb-2 h-8 w-8" />
											)}
											<span className="text-sm">
												{isUploading ? t("form.uploading") : t("form.uploadPrompt")}
											</span>
										</div>
									)}
									<input
										type="file"
										ref={fileInputRef}
										accept="image/png, image/jpeg, image/webp"
										onChange={handleImageUpload}
										disabled={isUploading}
										className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
									/>
								</div>

								<div className="flex flex-col gap-2 text-sm text-neutral-400">
									<p>Format: PNG, JPG, WebP</p>
									<p>Ratio: 16:10 or 16:9 recommended</p>
									<p>Max Size: 5MB</p>
									{uploadError ? <p className="text-red-400">{uploadError}</p> : null}
								</div>
							</div>
						</div>

						{/* Active Toggle */}
						<div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-800/30 p-4">
							<input
								type="checkbox"
								id="active-toggle"
								{...register("active")}
								className="h-5 w-5 rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900"
							/>
							<label htmlFor="active-toggle" className="text-sm font-medium text-white">
								{t("form.active")}
							</label>
						</div>
					</form>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 border-t border-neutral-800 bg-neutral-950 p-4">
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting || isUploading}
						className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-50"
					>
						{t("cancel")}
					</button>
					<button
						type="submit"
						form="service-form"
						disabled={isSubmitting || isUploading}
						className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
					>
						{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
						{t("form.save")}
					</button>
				</div>
			</div>
		</div>
	);
};
