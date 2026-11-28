"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import {
	BlockDateConflictBanner,
	type BookingConflict,
} from "@/features/admin/components/appointments/BlockDateConflictBanner";

interface BlockDateFormProps {
	mode: "single" | "range";
	dateInput: string;
	startDateInput: string;
	endDateInput: string;
	reasonInput: string;
	conflicts: BookingConflict[];
	isSubmitting: boolean;
	onModeChange: (mode: "single" | "range") => void;
	onDateChange: (val: string) => void;
	onStartDateChange: (val: string) => void;
	onEndDateChange: (val: string) => void;
	onReasonChange: (val: string) => void;
	onCancelConflicts: () => void;
	onSingleSubmit: (e: React.FormEvent) => void;
	onRangeSubmit: (allowConflict: boolean) => void;
}

export const BlockDateForm: React.FC<BlockDateFormProps> = ({
	mode,
	dateInput,
	startDateInput,
	endDateInput,
	reasonInput,
	conflicts,
	isSubmitting,
	onModeChange,
	onDateChange,
	onStartDateChange,
	onEndDateChange,
	onReasonChange,
	onCancelConflicts,
	onSingleSubmit,
	onRangeSubmit,
}) => {
	const t = useTranslations("Admin.appointments.modals.block");

	return (
		<>
			<div className="mb-4 grid grid-cols-2 gap-1 rounded-lg border border-neutral-800 bg-neutral-950 p-1 text-xs">
				{(["single", "range"] as const).map((tab) => (
					<button
						key={tab}
						type="button"
						disabled={isSubmitting}
						onClick={() => onModeChange(tab)}
						aria-label={t(tab === "single" ? "modeSingle" : "modeRange")}
						className={`cursor-pointer rounded-md py-1.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
							mode === tab ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
						}`}
					>
						{t(tab === "single" ? "modeSingle" : "modeRange")}
					</button>
				))}
			</div>

			<form
				onSubmit={(e) => {
					if (mode === "single") {
						onSingleSubmit(e);
					} else {
						e.preventDefault();
						onRangeSubmit(false);
					}
				}}
				className="mb-5 space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4"
			>
				<h3 className="text-xs font-semibold tracking-wider text-purple-400 uppercase">
					{t(mode === "single" ? "blockNew" : "blockRangeTitle")}
				</h3>

				{mode === "single" ? (
					<div>
						<label htmlFor="block-date" className="block text-xs text-neutral-400">
							{t("selectDate")}
						</label>
						<input
							id="block-date"
							type="date"
							required
							disabled={isSubmitting}
							value={dateInput}
							onChange={(e) => onDateChange(e.target.value)}
							className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="block-start-date" className="block text-xs text-neutral-400">
								{t("startDate")}
							</label>
							<input
								id="block-start-date"
								type="date"
								required
								disabled={isSubmitting}
								value={startDateInput}
								onChange={(e) => onStartDateChange(e.target.value)}
								className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							/>
						</div>
						<div>
							<label htmlFor="block-end-date" className="block text-xs text-neutral-400">
								{t("endDate")}
							</label>
							<input
								id="block-end-date"
								type="date"
								required
								disabled={isSubmitting}
								value={endDateInput}
								onChange={(e) => onEndDateChange(e.target.value)}
								className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							/>
						</div>
					</div>
				)}

				<div>
					<label htmlFor="block-reason" className="block text-xs text-neutral-400">
						{t("reason")}
					</label>
					<input
						id="block-reason"
						type="text"
						disabled={isSubmitting}
						placeholder={t("reasonPlaceholder")}
						value={reasonInput}
						onChange={(e) => onReasonChange(e.target.value)}
						className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					/>
				</div>

				{conflicts.length > 0 ? (
					<BlockDateConflictBanner
						conflicts={conflicts}
						isSubmitting={isSubmitting}
						onCancel={onCancelConflicts}
						onConfirmOverride={() => onRangeSubmit(true)}
					/>
				) : (
					<button
						type="submit"
						disabled={
							isSubmitting || (mode === "single" ? !dateInput : !startDateInput || !endDateInput)
						}
						aria-label={mode === "single" ? t("submit") : t("submitRange")}
						className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
					>
						<Plus className="size-4" /> {mode === "single" ? t("submit") : t("submitRange")}
					</button>
				)}
			</form>
		</>
	);
};
