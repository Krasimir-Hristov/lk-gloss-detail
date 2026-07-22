import { Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { getLocalizedText } from "@/features/admin/types/services.types";
import { getIcon } from "@/lib/icon-map";

import type { AdminServiceItem } from "@/features/admin/types/services.types";

interface ServicesTableProps {
	services: AdminServiceItem[];
	onEdit: (service: AdminServiceItem) => void;
	onDelete: (service: AdminServiceItem) => void;
	onToggleActive: (id: string, currentStatus: boolean) => Promise<void>;
}

export const ServicesTable: React.FC<ServicesTableProps> = ({
	services,
	onEdit,
	onDelete,
	onToggleActive,
}) => {
	const t = useTranslations("Admin.services");
	const locale = useLocale();

	if (services.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 py-16 text-neutral-500">
				<p>{t("empty")}</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/50">
			<table className="w-full text-left text-sm text-neutral-300">
				<thead className="border-b border-neutral-800 bg-neutral-900 text-xs text-neutral-400 uppercase">
					<tr>
						<th className="px-4 py-3">{t("columns.image")}</th>
						<th className="px-4 py-3">{t("columns.name")}</th>
						<th className="px-4 py-3">{t("columns.category")}</th>
						<th className="px-4 py-3">{t("columns.pricing")}</th>
						<th className="px-4 py-3">{t("columns.duration")}</th>
						<th className="px-4 py-3 text-center">{t("columns.active")}</th>
						<th className="px-4 py-3 text-center">{t("columns.order")}</th>
						<th className="px-4 py-3 text-right">{t("columns.actions")}</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-neutral-800">
					{services.map((service) => {
						const IconComponent = getIcon(service.icon);
						const nameStr = getLocalizedText(service.name, locale);
						const descStr = getLocalizedText(service.short_description, locale);

						return (
							<tr key={service.id} className="transition-colors hover:bg-neutral-800/50">
								{/* Image */}
								<td className="px-4 py-3">
									<div className="relative h-12 w-16 overflow-hidden rounded-md bg-neutral-800">
										{service.image_url ? (
											<Image src={service.image_url} alt={nameStr} fill className="object-cover" />
										) : (
											<div className="flex h-full w-full items-center justify-center">
												<ImageIcon className="h-5 w-5 text-neutral-600" />
											</div>
										)}
									</div>
								</td>

								{/* Name & Icon */}
								<td className="px-4 py-3">
									<div className="flex items-center gap-3">
										<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800">
											{React.createElement(IconComponent, {
												className: "h-4 w-4 text-blue-400",
											})}
										</div>
										<div>
											<p className="font-medium text-white">{nameStr}</p>
											{descStr ? (
												<p className="max-w- truncate text-xs text-neutral-500">{descStr}</p>
											) : null}
										</div>
									</div>
								</td>

								{/* Category */}
								<td className="px-4 py-3">
									<span className="inline-flex items-center rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
										{service.category}
									</span>
								</td>

								{/* Pricing */}
								<td className="px-4 py-3 text-xs">
									<div className="flex flex-col gap-1 text-neutral-400">
										<span>
											S: €{service.price_small} | M: €{service.price_medium}
										</span>
										<span>
											L: €{service.price_large} | SUV: €{service.price_suv}
										</span>
									</div>
								</td>

								{/* Duration */}
								<td className="px-4 py-3">{service.duration_hours}h</td>

								{/* Active Toggle */}
								<td className="px-4 py-3 text-center">
									<button
										type="button"
										onClick={() => onToggleActive(service.id, service.active)}
										className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
											service.active ? "bg-blue-600" : "bg-neutral-700"
										}`}
									>
										<span
											className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
												service.active ? "translate-x-4" : "translate-x-0"
											}`}
										/>
									</button>
								</td>

								{/* Sort Order */}
								<td className="px-4 py-3 text-center text-neutral-400">{service.sort_order}</td>

								{/* Actions */}
								<td className="px-4 py-3 text-right">
									<div className="flex items-center justify-end gap-2">
										<button
											onClick={() => onEdit(service)}
											className="rounded-lg bg-neutral-800 p-2 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
											title={t("edit")}
										>
											<Edit2 className="h-4 w-4" />
										</button>
										<button
											onClick={() => onDelete(service)}
											className="rounded-lg bg-red-950/30 p-2 text-red-400 transition-colors hover:bg-red-900/50 hover:text-red-300"
											title={t("delete.title")}
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
