"use client";

import { motion } from "framer-motion";
import { Plus, Search, Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useMemo } from "react";

import {
	createService,
	deleteService,
	toggleServiceActive,
	updateService,
} from "@/features/admin/actions/services";
import { DeleteServiceModal } from "@/features/admin/components/services/DeleteServiceModal";
import { ServiceModal } from "@/features/admin/components/services/ServiceModal";
import { ServicesTable } from "@/features/admin/components/services/ServicesTable";
import { getLocalizedText, type AdminServiceItem } from "@/features/admin/types/services.types";

import type { ServiceInput } from "@/features/admin/schemas/services.schema";

interface ServicesManagerProps {
	initialServices: AdminServiceItem[];
}

export const ServicesManager: React.FC<ServicesManagerProps> = ({ initialServices }) => {
	const t = useTranslations("Admin.services");

	const [services, setServices] = useState<AdminServiceItem[]>(initialServices);
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Modals state
	const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
	const [editingService, setEditingService] = useState<AdminServiceItem | undefined>(undefined);

	const [serviceToDelete, setServiceToDelete] = useState<AdminServiceItem | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const filteredServices = useMemo(() => {
		return services.filter((s) => {
			const nameStr = getLocalizedText(s.name);
			const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
			const matchesStatus =
				statusFilter === "all" ||
				(statusFilter === "active" && s.active) ||
				(statusFilter === "inactive" && !s.active);

			return matchesSearch && matchesCategory && matchesStatus;
		});
	}, [services, searchQuery, categoryFilter, statusFilter]);

	const categories = useMemo(() => {
		const cats = new Set(services.map((s) => s.category));
		return Array.from(cats);
	}, [services]);

	// Handlers
	const handleAddClick = () => {
		setErrorMessage(null);
		setSuccessMessage(null);
		setEditingService(undefined);
		setIsServiceModalOpen(true);
	};

	const handleEditClick = (service: AdminServiceItem) => {
		setErrorMessage(null);
		setSuccessMessage(null);
		setEditingService(service);
		setIsServiceModalOpen(true);
	};

	const handleDeleteClick = (service: AdminServiceItem) => {
		setErrorMessage(null);
		setSuccessMessage(null);
		setServiceToDelete(service);
	};

	const handleSaveService = async (data: ServiceInput) => {
		setErrorMessage(null);
		setSuccessMessage(null);
		if (editingService) {
			const res = await updateService(editingService.id, data);
			if (res.success) {
				setSuccessMessage(t("toast.updateSuccess"));
				setServices((prev) =>
					prev
						.map((s) => (s.id === editingService.id ? { ...s, ...data } : s))
						.sort((a, b) => a.sort_order - b.sort_order),
				);
				setIsServiceModalOpen(false);
			} else {
				setErrorMessage(res.error);
			}
		} else {
			const res = await createService(data);
			if (res.success) {
				setSuccessMessage(t("toast.createSuccess"));
				// Full page refresh might be better to get the new ID, or we can just refetch
				window.location.reload();
			} else {
				setErrorMessage(res.error);
			}
		}
	};

	const handleConfirmDelete = async () => {
		if (!serviceToDelete) return;
		setIsDeleting(true);
		setErrorMessage(null);

		const res = await deleteService(serviceToDelete.id);
		setIsDeleting(false);

		if (res.success) {
			setSuccessMessage(t("toast.deleteSuccess"));
			setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
			setServiceToDelete(null);
		} else {
			setErrorMessage(res.error);
		}
	};

	const handleToggleActive = async (id: string, currentStatus: boolean) => {
		setErrorMessage(null);
		setSuccessMessage(null);
		// Optimistic update
		setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: !currentStatus } : s)));

		const res = await toggleServiceActive(id, !currentStatus);
		if (!res.success) {
			setErrorMessage(res.error);
			// Revert on failure
			setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: currentStatus } : s)));
		} else {
			setSuccessMessage(t("toast.statusUpdateSuccess"));
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="space-y-6"
		>
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="Montserrat text-2xl font-bold text-white">{t("title")}</h2>
					<p className="text-sm text-neutral-400">{t("subtitle")}</p>
				</div>
				<button
					onClick={handleAddClick}
					className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
				>
					<Plus className="h-4 w-4" />
					{t("addService")}
				</button>
			</div>

			{errorMessage ? (
				<div className="rounded-lg border border-red-500/30 bg-red-950/50 p-4 text-sm text-red-400">
					{errorMessage}
				</div>
			) : null}
			{successMessage ? (
				<div className="rounded-lg border border-green-500/30 bg-green-950/50 p-4 text-sm text-green-400">
					{successMessage}
				</div>
			) : null}

			{/* Filters */}
			<div className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
					<input
						type="text"
						placeholder={t("searchPlaceholder")}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 pr-4 pl-10 text-sm text-white placeholder-neutral-500 outline-hidden focus:border-blue-500"
					/>
				</div>

				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm">
						<Filter className="h-4 w-4 text-neutral-500" />
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="bg-transparent text-white outline-hidden"
						>
							<option value="all">{t("filters.allCategories")}</option>
							{categories.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</div>

					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-hidden"
					>
						<option value="all">{t("filters.allStatuses")}</option>
						<option value="active">{t("filters.active")}</option>
						<option value="inactive">{t("filters.inactive")}</option>
					</select>
				</div>
			</div>

			<ServicesTable
				services={filteredServices}
				onEdit={handleEditClick}
				onDelete={handleDeleteClick}
				onToggleActive={handleToggleActive}
			/>

			{isServiceModalOpen ? (
				<ServiceModal
					isOpen={isServiceModalOpen}
					service={editingService}
					onClose={() => setIsServiceModalOpen(false)}
					onSave={handleSaveService}
				/>
			) : null}

			<DeleteServiceModal
				isOpen={!!serviceToDelete}
				serviceName={getLocalizedText(serviceToDelete?.name)}
				onClose={() => setServiceToDelete(null)}
				onConfirm={handleConfirmDelete}
				isDeleting={isDeleting}
			/>
		</motion.div>
	);
};
