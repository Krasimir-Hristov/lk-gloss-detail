"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarOff, Trash2, Plus, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { blockDate, unblockDate } from "@/features/admin/actions/blocked-dates";

import type { BlockedDateItem } from "@/features/admin/types/appointments.types";

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
	const [dateInput, setDateInput] = useState("");
	const [reasonInput, setReasonInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	if (!isOpen) return null;

	const handleBlockSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!dateInput) return;

		setIsSubmitting(true);
		setErrorMsg(null);

		try {
			const res = await blockDate({
				blocked_date: dateInput,
				reason: reasonInput,
			});

			if (res.success) {
				setDateInput("");
				setReasonInput("");
				onBlockedDatesUpdated();
			} else {
				setErrorMsg(res.error);
			}
		} catch (err) {
			console.error("[BlockDateModal] Error blocking date:", err);
			setErrorMsg("Failed to block date");
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
			if (res.success) {
				onBlockedDatesUpdated();
			} else {
				setErrorMsg(res.error);
			}
		} catch (err) {
			console.error("[BlockDateModal] Error unblocking date:", err);
			setErrorMsg("Failed to unblock date");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 20 }}
					transition={{ duration: 0.2 }}
					className="relative w-full max-w-md overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
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
							<CalendarOff className="size-6" />
						</div>
						<div>
							<h2 className="Montserrat text-xl font-bold text-white">{t("title")}</h2>
							<p className="text-xs text-neutral-400">{t("subtitle")}</p>
						</div>
					</div>

					{errorMsg ? (
						<div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-400">
							<AlertCircle className="size-4 shrink-0" />
							{errorMsg}
						</div>
					) : null}

					{/* Form to Block a New Date */}
					<form
						onSubmit={handleBlockSubmit}
						className="mb-6 space-y-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4"
					>
						<h3 className="text-xs font-semibold tracking-wider text-purple-400 uppercase">
							{t("blockNew")}
						</h3>

						<div>
							<label htmlFor="block-date" className="block text-xs text-neutral-400">
								{t("selectDate")}
							</label>
							<input
								id="block-date"
								type="date"
								required
								value={dateInput}
								onChange={(e) => setDateInput(e.target.value)}
								className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
							/>
						</div>

						<div>
							<label htmlFor="block-reason" className="block text-xs text-neutral-400">
								{t("reason")}
							</label>
							<input
								id="block-reason"
								type="text"
								placeholder="e.g. Holiday, Maintenance"
								value={reasonInput}
								onChange={(e) => setReasonInput(e.target.value)}
								className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
							/>
						</div>

						<button
							type="submit"
							disabled={isSubmitting || !dateInput}
							className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
						>
							<Plus className="size-4" /> {t("submit")}
						</button>
					</form>

					{/* Currently Blocked Dates List */}
					<div>
						<h3 className="mb-2 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
							{t("currentlyBlocked")} ({blockedDates.length})
						</h3>

						{blockedDates.length === 0 ? (
							<p className="py-4 text-center text-xs text-neutral-500">{t("noBlocked")}</p>
						) : (
							<div className="max-h-48 space-y-2 overflow-y-auto pr-1">
								{blockedDates.map((b) => (
									<div
										key={b.id}
										className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs"
									>
										<div>
											<p className="font-bold text-white">{b.blocked_date}</p>
											{b.reason ? (
												<p className="text-neutral-400">{b.reason}</p>
											) : (
												<p className="text-neutral-500 italic">—</p>
											)}
										</div>
										<button
											type="button"
											disabled={isSubmitting}
											onClick={() => handleUnblock(b.id)}
											className="cursor-pointer rounded border border-rose-500/30 p-1.5 text-rose-400 transition-colors hover:bg-rose-950/40"
											title="Unblock this date"
										>
											<Trash2 className="size-3.5" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="mt-6 flex justify-end border-t border-neutral-800 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
						>
							{t("done")}
						</button>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};
