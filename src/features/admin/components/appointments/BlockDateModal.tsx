"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarOff, Trash2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";

import { blockDate, blockDateRange, unblockDate } from "@/features/admin/actions/blockedDates";
import { BlockDateForm } from "@/features/admin/components/appointments/BlockDateForm";

import type { BookingConflict } from "@/features/admin/components/appointments/BlockDateConflictBanner";
import type { BlockedDateItem } from "@/features/admin/types/appointmentsTypes";

interface BlockDateModalProps {
	isOpen: boolean;
	blockedDates: BlockedDateItem[];
	onClose: () => void;
	onBlockedDatesUpdated: () => void;
}

export const BlockDateModal: React.FC<BlockDateModalProps> = ({
	isOpen,
	blockedDates,
	onClose,
	onBlockedDatesUpdated,
}) => {
	const t = useTranslations("Admin.appointments.modals.block");
	const [mode, setMode] = useState<"single" | "range">("single");
	const [dateInput, setDateInput] = useState("");
	const [startDateInput, setStartDateInput] = useState("");
	const [endDateInput, setEndDateInput] = useState("");
	const [reasonInput, setReasonInput] = useState("");
	const [conflicts, setConflicts] = useState<BookingConflict[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen && !isSubmitting) onClose();
		};
		if (isOpen) window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, isSubmitting, onClose]);

	const handleSingleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!dateInput || isSubmitting) return;
		setIsSubmitting(true);
		setErrorMsg(null);
		try {
			const res = await blockDate({ blocked_date: dateInput, reason: reasonInput });
			if (res.success) {
				setDateInput("");
				setReasonInput("");
				onBlockedDatesUpdated();
			} else {
				setErrorMsg(res.error);
			}
		} catch (err) {
			console.error("[BlockDateModal] Error blocking date:", err);
			setErrorMsg(t("blockFailed"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const submitRange = async (allowConflict: boolean) => {
		if (!startDateInput || !endDateInput || isSubmitting) return;
		setIsSubmitting(true);
		setErrorMsg(null);
		try {
			const res = await blockDateRange({
				start_date: startDateInput,
				end_date: endDateInput,
				reason: reasonInput || undefined,
				allow_conflict: allowConflict,
			});
			if (!res.success) {
				setErrorMsg(res.error);
				return;
			}
			if (res.data.conflicts.length > 0 && !allowConflict && res.data.added.length === 0) {
				setConflicts(res.data.conflicts);
				return;
			}
			setStartDateInput("");
			setEndDateInput("");
			setReasonInput("");
			setConflicts([]);
			onBlockedDatesUpdated();
		} catch (err) {
			console.error("[BlockDateModal] Error blocking range:", err);
			setErrorMsg(t("blockFailed"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUnblock = async (id: string) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		setErrorMsg(null);
		try {
			const res = await unblockDate(id);
			if (res.success) onBlockedDatesUpdated();
			else setErrorMsg(res.error);
		} catch (err) {
			console.error("[BlockDateModal] Error unblocking date:", err);
			setErrorMsg(t("unblockFailed"));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen ? (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="block-date-modal-title"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.2 }}
						className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-2xl sm:p-6"
					>
						<button
							type="button"
							onClick={onClose}
							aria-label={t("done")}
							className="absolute top-4 right-4 cursor-pointer rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
						>
							<X className="size-5" />
						</button>

						<div className="mb-5 flex items-center gap-3 border-b border-neutral-800 pb-4">
							<div className="rounded-lg border border-purple-500/30 bg-purple-950/30 p-2.5 text-purple-400">
								<CalendarOff className="size-6" />
							</div>
							<div>
								<h2 id="block-date-modal-title" className="Montserrat text-xl font-bold text-white">
									{t("title")}
								</h2>
								<p className="text-xs text-neutral-400">{t("subtitle")}</p>
							</div>
						</div>

						{errorMsg ? (
							<div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-400">
								<AlertCircle className="size-4 shrink-0" />
								<span>{errorMsg}</span>
							</div>
						) : null}

						<BlockDateForm
							mode={mode}
							dateInput={dateInput}
							startDateInput={startDateInput}
							endDateInput={endDateInput}
							reasonInput={reasonInput}
							conflicts={conflicts}
							isSubmitting={isSubmitting}
							onModeChange={(tab) => {
								setMode(tab);
								setConflicts([]);
								setErrorMsg(null);
							}}
							onDateChange={setDateInput}
							onStartDateChange={(val) => {
								setStartDateInput(val);
								setConflicts([]);
							}}
							onEndDateChange={(val) => {
								setEndDateInput(val);
								setConflicts([]);
							}}
							onReasonChange={setReasonInput}
							onCancelConflicts={() => setConflicts([])}
							onSingleSubmit={(e) => void handleSingleSubmit(e)}
							onRangeSubmit={(allow) => void submitRange(allow)}
						/>

						<div>
							<h3 className="mb-2 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
								{t("currentlyBlocked")} ({blockedDates.length})
							</h3>
							{blockedDates.length === 0 ? (
								<p className="py-4 text-center text-xs text-neutral-500">{t("noBlocked")}</p>
							) : (
								<div className="max-h-44 space-y-2 overflow-y-auto pr-1">
									{blockedDates.map((b) => (
										<div
											key={b.id}
											className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs"
										>
											<div>
												<p className="font-bold text-white">{b.blocked_date}</p>
												<p className="text-neutral-400">{b.reason || "—"}</p>
											</div>
											<button
												type="button"
												disabled={isSubmitting}
												onClick={() => handleUnblock(b.id)}
												aria-label={t("unblock")}
												className="cursor-pointer rounded border border-rose-500/30 p-1.5 text-rose-400 transition-colors hover:bg-rose-950/40"
											>
												<Trash2 className="size-3.5" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="mt-5 flex justify-end border-t border-neutral-800 pt-4">
							<button
								type="button"
								onClick={onClose}
								aria-label={t("done")}
								className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
							>
								{t("done")}
							</button>
						</div>
					</motion.div>
				</div>
			) : null}
		</AnimatePresence>
	);
};
