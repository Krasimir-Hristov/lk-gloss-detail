"use client";

import { motion } from "framer-motion";
import { Calendar, List, CalendarOff, RefreshCw, AlertCircle } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useState, useCallback } from "react";

import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { deleteAppointment, getAdminAppointments } from "@/features/admin/actions/appointments";
import { getBlockedDates } from "@/features/admin/actions/blockedDates";
import { AppointmentDetailModal } from "@/features/admin/components/appointments/AppointmentDetailModal";
import { AppointmentsCalendarView } from "@/features/admin/components/appointments/AppointmentsCalendarView";
import { AppointmentsListView } from "@/features/admin/components/appointments/AppointmentsListView";
import { BlockDateModal } from "@/features/admin/components/appointments/BlockDateModal";
import { EditAppointmentModal } from "@/features/admin/components/appointments/EditAppointmentModal";

import type {
	AdminAppointment,
	AppointmentServiceItem,
	AppointmentStatus,
	BlockedDateItem,
} from "@/features/admin/types/appointmentsTypes";

interface AppointmentsManagerProps {
	initialAppointments: AdminAppointment[];
	initialBlockedDates: BlockedDateItem[];
	initialServices: AppointmentServiceItem[];
	initialStatus?: AppointmentStatus | "all";
}

export const AppointmentsManager: React.FC<AppointmentsManagerProps> = ({
	initialAppointments,
	initialBlockedDates,
	initialServices,
	initialStatus = "all",
}) => {
	const t = useTranslations("Admin.appointments");
	const tConfirm = useTranslations("ConfirmModal");

	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();

	const [appointments, setAppointments] = useState<AdminAppointment[]>(initialAppointments);
	const [blockedDates, setBlockedDates] = useState<BlockedDateItem[]>(initialBlockedDates);

	const [viewMode, setViewMode] = useState<"calendar" | "list">(
		initialStatus !== "all" ? "list" : "calendar",
	);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const [detailAppointment, setDetailAppointment] = useState<AdminAppointment | null>(null);
	const [editAppointment, setEditAppointment] = useState<AdminAppointment | null>(null);
	const [isBlockModalOpen, setIsBlockModalOpen] = useState(
		() => searchParams.get("action") === "blockDate",
	);

	const handleCloseBlockModal = useCallback(() => {
		setIsBlockModalOpen(false);
		if (searchParams.get("action") === "blockDate") {
			window.history.replaceState(null, "", pathname);
		}
	}, [searchParams, pathname]);

	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const refreshData = useCallback(async () => {
		setIsLoading(true);
		setErrorMessage(null);
		try {
			const [apptsRes, blockedRes] = await Promise.all([getAdminAppointments(), getBlockedDates()]);

			if (apptsRes.success) setAppointments(apptsRes.data);
			if (blockedRes.success) setBlockedDates(blockedRes.data);
			router.refresh();
		} catch (err) {
			console.error("[AppointmentsManager] Error refreshing data:", err);
			setErrorMessage(t("errors.refreshFailed"));
		} finally {
			setIsLoading(false);
		}
	}, [router, t]);

	const handleStatusChanged = (id: string, newStatus: AppointmentStatus) => {
		setAppointments((prev) =>
			prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app)),
		);
		if (detailAppointment && detailAppointment.id === id) {
			setDetailAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
		}
		router.refresh();
	};

	const onRequestDelete = (id: string) => {
		setDeletingId(id);
	};

	const handleConfirmDelete = async () => {
		if (!deletingId || isDeleting) return;

		setIsDeleting(true);
		setErrorMessage(null);
		try {
			const res = await deleteAppointment(deletingId);
			if (res.success) {
				setAppointments((prev) => prev.filter((a) => a.id !== deletingId));
				if (detailAppointment?.id === deletingId) setDetailAppointment(null);
				if (editAppointment?.id === deletingId) setEditAppointment(null);
				router.refresh();
			} else {
				setErrorMessage(res.error);
			}
		} catch (err) {
			console.error("[AppointmentsManager] Error deleting appointment:", err);
			setErrorMessage(t("errors.deleteFailed"));
		} finally {
			setIsDeleting(false);
			setDeletingId(null);
		}
	};

	return (
		<div className="space-y-6">
			{/* Top Bar: Title & View Mode Controls */}
			<div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="Montserrat text-3xl font-extrabold tracking-tight text-white">
						{t("title")}
					</h1>
					<p className="mt-1 text-sm text-neutral-400">{t("subtitle")}</p>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={refreshData}
						disabled={isLoading}
						aria-label={t("refresh")}
						className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors hover:border-purple-500/50 hover:text-white disabled:opacity-50"
						title={t("refresh")}
					>
						<RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} /> {t("refresh")}
					</button>

					<button
						type="button"
						onClick={() => setIsBlockModalOpen(true)}
						aria-label={t("blockDate")}
						className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/30 px-3.5 py-2 text-xs font-bold text-purple-300 transition-all hover:bg-purple-950/60"
					>
						<CalendarOff className="size-4" /> {t("blockDate")}
					</button>

					<div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-950 p-1">
						<button
							type="button"
							onClick={() => setViewMode("calendar")}
							aria-label={t("calendar")}
							className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
								viewMode === "calendar"
									? "bg-purple-600 text-white shadow-md"
									: "text-neutral-400 hover:text-white"
							}`}
						>
							<Calendar className="size-3.5" /> {t("calendar")}
						</button>
						<button
							type="button"
							onClick={() => setViewMode("list")}
							aria-label={t("listView")}
							className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
								viewMode === "list"
									? "bg-purple-600 text-white shadow-md"
									: "text-neutral-400 hover:text-white"
							}`}
						>
							<List className="size-3.5" /> {t("listView")}
						</button>
					</div>
				</div>
			</div>

			{errorMessage ? (
				<div className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-950/20 p-3.5 text-xs text-rose-400">
					<div className="flex items-center gap-2">
						<AlertCircle className="size-4 shrink-0" />
						<span>{errorMessage}</span>
					</div>
					<button
						type="button"
						onClick={() => setErrorMessage(null)}
						aria-label={t("modals.details.close")}
						className="cursor-pointer text-xs font-bold text-rose-400 hover:underline"
					>
						×
					</button>
				</div>
			) : null}

			<motion.div
				key={viewMode}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
			>
				{viewMode === "calendar" ? (
					<AppointmentsCalendarView
						appointments={appointments}
						blockedDates={blockedDates}
						onViewDetails={(appt) => setDetailAppointment(appt)}
						onBlockedDatesUpdated={refreshData}
					/>
				) : (
					<AppointmentsListView
						appointments={appointments}
						initialStatus={initialStatus}
						onViewDetails={(appt) => setDetailAppointment(appt)}
						onEdit={(appt) => setEditAppointment(appt)}
						onDelete={onRequestDelete}
					/>
				)}
			</motion.div>

			<AppointmentDetailModal
				appointment={detailAppointment}
				onClose={() => setDetailAppointment(null)}
				onEdit={(appt) => {
					setDetailAppointment(null);
					setEditAppointment(appt);
				}}
				onDelete={onRequestDelete}
				onStatusChanged={handleStatusChanged}
			/>

			<EditAppointmentModal
				key={editAppointment?.id}
				appointment={editAppointment}
				availableServices={initialServices}
				onClose={() => setEditAppointment(null)}
				onSaved={() => {
					setEditAppointment(null);
					refreshData();
				}}
			/>

			<BlockDateModal
				isOpen={isBlockModalOpen}
				blockedDates={blockedDates}
				onClose={handleCloseBlockModal}
				onBlockedDatesUpdated={refreshData}
			/>

			<ConfirmModal
				isOpen={Boolean(deletingId)}
				title={tConfirm("deleteTitle")}
				description={tConfirm("deleteDescription")}
				confirmText={tConfirm("confirm")}
				cancelText={tConfirm("cancel")}
				variant="danger"
				isLoading={isDeleting}
				onConfirm={handleConfirmDelete}
				onClose={() => setDeletingId(null)}
			/>
		</div>
	);
};
