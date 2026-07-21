"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, X } from "lucide-react";
import React, { useEffect } from "react";

export interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "danger" | "warning" | "info";
	isLoading?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

const variantStyles = {
	danger: {
		iconBg: "border-rose-500/30 bg-rose-950/30 text-rose-400",
		confirmBtn:
			"bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0px_0px_20px_rgba(225,29,72,0.3)]",
	},
	warning: {
		iconBg: "border-amber-500/30 bg-amber-950/30 text-amber-400",
		confirmBtn:
			"bg-linear-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-[0px_0px_20px_rgba(217,119,6,0.3)]",
	},
	info: {
		iconBg: "border-purple-500/30 bg-purple-950/30 text-purple-400",
		confirmBtn:
			"bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0px_0px_20px_rgba(123,45,255,0.3)]",
	},
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
	isOpen,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "danger",
	isLoading = false,
	onConfirm,
	onClose,
}) => {
	const style = variantStyles[variant];

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !isLoading) {
				onClose();
			}
		};

		if (isOpen) {
			window.addEventListener("keydown", handleKeyDown);
		}
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, isLoading, onClose]);

	return (
		<AnimatePresence>
			{isOpen ? (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="confirm-modal-title"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 15 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 15 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-[#121212]/95 p-6 shadow-2xl backdrop-blur-xl"
					>
						{/* Close Icon */}
						<button
							type="button"
							onClick={onClose}
							disabled={isLoading}
							className="absolute top-4 right-4 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-50"
						>
							<X className="size-5" />
						</button>

						{/* Header */}
						<div className="flex items-start gap-4">
							<div className={`rounded-xl border p-3 ${style.iconBg}`}>
								{variant === "info" ? (
									<Info className="size-6 shrink-0" />
								) : (
									<AlertTriangle className="size-6 shrink-0" />
								)}
							</div>
							<div className="flex-1 pr-6">
								<h3 id="confirm-modal-title" className="Montserrat text-lg font-bold text-white">
									{title}
								</h3>
								<p className="mt-1 text-xs leading-relaxed text-neutral-400">{description}</p>
							</div>
						</div>

						{/* Actions Footer */}
						<div className="mt-6 flex items-center justify-end gap-3 border-t border-neutral-800/80 pt-4">
							<button
								type="button"
								onClick={onClose}
								disabled={isLoading}
								className="cursor-pointer rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-neutral-300 transition-all hover:bg-neutral-800 hover:text-white disabled:opacity-50"
							>
								{cancelText}
							</button>
							<button
								type="button"
								onClick={onConfirm}
								disabled={isLoading}
								className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all active:scale-98 disabled:opacity-50 ${style.confirmBtn}`}
							>
								{isLoading ? (
									<span className="inline-block size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
								) : null}
								{confirmText}
							</button>
						</div>
					</motion.div>
				</div>
			) : null}
		</AnimatePresence>
	);
};
