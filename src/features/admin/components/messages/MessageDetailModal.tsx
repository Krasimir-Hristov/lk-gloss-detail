"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Archive,
	Check,
	Clock,
	Copy,
	Mail,
	MailCheck,
	MailOpen,
	MessageCircle,
	Phone,
	Trash2,
	X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { sanitizeTel, toWhatsappUrl } from "@/features/admin/components/messages/contactLinks";
import { DATE_LOCALE_MAP, resolveAppLocale } from "@/i18n/locales";

import type { AdminMessage, MessageStatus } from "@/features/admin/types/messagesTypes";

interface MessageDetailModalProps {
	message: AdminMessage | null;
	isUpdating: boolean;
	onClose: () => void;
	onStatusChange: (id: string, status: MessageStatus) => void;
	onRequestDelete: (id: string) => void;
}

const statusBadgeStyles: Record<MessageStatus, string> = {
	unread: "border-purple-500/40 bg-purple-500/15 text-purple-300",
	read: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
	archived: "border-neutral-700 bg-neutral-800/80 text-neutral-400",
};

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
	message,
	isUpdating,
	onClose,
	onStatusChange,
	onRequestDelete,
}) => {
	const t = useTranslations("Admin.messages");
	const locale = useLocale();
	const [copiedField, setCopiedField] = useState<"phone" | "email" | null>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && message && !isUpdating) onClose();
		};
		if (message) window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [message, isUpdating, onClose]);

	const handleCopy = async (value: string, field: "phone" | "email") => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField((prev) => (prev === field ? null : prev)), 1800);
		} catch (err) {
			console.error("[MessageDetailModal] Clipboard copy failed:", err);
		}
	};

	const telTarget = message ? sanitizeTel(message.phone) : "";
	const waUrl = message ? toWhatsappUrl(message.phone) : null;
	const dateLocale = DATE_LOCALE_MAP[resolveAppLocale(locale)];

	return (
		<AnimatePresence>
			{message ? (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="message-detail-title"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: 16 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: 16 }}
						transition={{ duration: 0.2 }}
						className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl sm:p-6"
					>
						<button
							type="button"
							onClick={onClose}
							aria-label={t("modal.close")}
							className="absolute top-4 right-4 cursor-pointer rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
						>
							<X className="size-5" />
						</button>

						<div className="mb-5 border-b border-neutral-800 pr-8 pb-4">
							<div className="flex flex-wrap items-center gap-2.5">
								<span
									className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${statusBadgeStyles[message.status]}`}
								>
									{t(`status.${message.status}`)}
								</span>
								<span className="flex items-center gap-1 text-xs text-neutral-500">
									<Clock className="size-3.5" />
									{new Date(message.created_at).toLocaleString(dateLocale, {
										dateStyle: "medium",
										timeStyle: "short",
									})}
								</span>
							</div>
							<h2
								id="message-detail-title"
								className="Montserrat mt-2 text-2xl font-bold text-white"
							>
								{message.name}
							</h2>
						</div>

						<div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5">
								<p className="text-xs text-neutral-500">{t("modal.phone")}</p>
								<p className="mt-1 text-sm font-semibold text-white">{message.phone || "—"}</p>
								<div className="mt-3 flex flex-wrap items-center gap-2">
									{telTarget ? (
										<a
											href={`tel:${telTarget}`}
											aria-label={`${t("actions.call")} ${message.name}`}
											className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25"
										>
											<Phone className="size-3.5" />
											{t("actions.call")}
										</a>
									) : null}
									{waUrl ? (
										<a
											href={waUrl}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={`WhatsApp ${message.name}`}
											className="inline-flex items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/20"
										>
											<MessageCircle className="size-3.5" />
											WhatsApp
										</a>
									) : null}
									{message.phone ? (
										<button
											type="button"
											onClick={() => handleCopy(message.phone, "phone")}
											aria-label={t("actions.copyPhone")}
											className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-purple-500/40 hover:text-white"
										>
											{copiedField === "phone" ? (
												<Check className="size-3.5 text-emerald-400" />
											) : (
												<Copy className="size-3.5" />
											)}
											<span>
												{copiedField === "phone" ? t("actions.copied") : t("actions.copy")}
											</span>
										</button>
									) : null}
								</div>
							</div>

							<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5">
								<p className="text-xs text-neutral-500">{t("modal.email")}</p>
								<p className="mt-1 truncate text-sm font-semibold text-white">
									{message.email || "—"}
								</p>
								<div className="mt-3 flex flex-wrap items-center gap-2">
									{message.email ? (
										<>
											<a
												href={`mailto:${message.email}`}
												aria-label={`${t("actions.email")} ${message.email}`}
												className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/20"
											>
												<Mail className="size-3.5" />
												{t("actions.email")}
											</a>
											<button
												type="button"
												onClick={() => handleCopy(message.email, "email")}
												aria-label={t("actions.copyEmail")}
												className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-purple-500/40 hover:text-white"
											>
												{copiedField === "email" ? (
													<Check className="size-3.5 text-emerald-400" />
												) : (
													<Copy className="size-3.5" />
												)}
												<span>
													{copiedField === "email" ? t("actions.copied") : t("actions.copy")}
												</span>
											</button>
										</>
									) : null}
								</div>
							</div>
						</div>

						<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
							<p className="mb-2 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
								{t("modal.messageLabel")}
							</p>
							<p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-200">
								{message.message}
							</p>
						</div>

						<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-4">
							<button
								type="button"
								disabled={isUpdating}
								onClick={() => onRequestDelete(message.id)}
								aria-label={t("actions.delete")}
								className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-950/40 disabled:opacity-50"
							>
								<Trash2 className="size-3.5" />
								{t("actions.delete")}
							</button>

							<div className="flex flex-wrap items-center gap-2">
								<button
									type="button"
									disabled={isUpdating}
									onClick={() =>
										onStatusChange(message.id, message.status !== "unread" ? "unread" : "read")
									}
									aria-label={
										message.status !== "unread" ? t("actions.markUnread") : t("actions.markRead")
									}
									className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 transition-colors hover:bg-neutral-700 disabled:opacity-50"
								>
									{message.status !== "unread" ? (
										<MailOpen className="size-3.5" />
									) : (
										<MailCheck className="size-3.5 text-emerald-400" />
									)}
									{message.status !== "unread" ? t("actions.markUnread") : t("actions.markRead")}
								</button>

								<button
									type="button"
									disabled={isUpdating}
									onClick={() =>
										onStatusChange(message.id, message.status !== "archived" ? "archived" : "read")
									}
									aria-label={
										message.status !== "archived" ? t("actions.archive") : t("actions.unarchive")
									}
									className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/30 px-3 py-2 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-950/50 disabled:opacity-50"
								>
									{message.status !== "archived" ? (
										<Archive className="size-3.5" />
									) : (
										<MailCheck className="size-3.5" />
									)}
									{message.status !== "archived" ? t("actions.archive") : t("actions.unarchive")}
								</button>

								<button
									type="button"
									onClick={onClose}
									aria-label={t("modal.close")}
									className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
								>
									{t("modal.close")}
								</button>
							</div>
						</div>
					</motion.div>
				</div>
			) : null}
		</AnimatePresence>
	);
};
