"use client";

import { Archive, Check, Copy, Mail, MessageCircle, Phone, Trash2 } from "lucide-react";
import React from "react";

import { sanitizeTel, toWhatsappUrl } from "@/features/admin/components/messages/contactLinks";

import type { AdminMessage, MessageStatus } from "@/features/admin/types/messagesTypes";

interface MessageCardProps {
	message: AdminMessage;
	dateLocale: string;
	copiedKey: string | null;
	isMutating: boolean;
	t: (key: string) => string;
	onOpen: (msg: AdminMessage) => void;
	onCopy: (value: string, key: string) => void;
	onStatusChange: (id: string, nextStatus: MessageStatus) => void;
	onRequestDelete: (id: string) => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({
	message: msg,
	dateLocale,
	copiedKey,
	isMutating,
	t,
	onOpen,
	onCopy,
	onStatusChange,
	onRequestDelete,
}) => {
	const telTarget = sanitizeTel(msg.phone);
	const waUrl = toWhatsappUrl(msg.phone);
	const isUnread = msg.status === "unread";

	return (
		<article
			className={`rounded-xl border p-4 transition-colors ${
				isUnread
					? "border-purple-500/40 bg-neutral-900/95"
					: "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700"
			}`}
		>
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<button
					type="button"
					onClick={() => onOpen(msg)}
					aria-label={`${t("actions.open")}: ${msg.name}`}
					className="min-w-0 flex-1 cursor-pointer text-left"
				>
					<div className="flex flex-wrap items-center gap-2">
						{isUnread ? <span className="inline-block size-2 rounded-full bg-purple-400" /> : null}
						<h3 className="text-sm font-bold text-white">{msg.name}</h3>
						<span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-[10px] font-semibold text-neutral-400 uppercase">
							{t(`status.${msg.status}`)}
						</span>
						<span className="text-xs text-neutral-500">
							{new Date(msg.created_at).toLocaleString(dateLocale, {
								dateStyle: "short",
								timeStyle: "short",
							})}
						</span>
					</div>
					<p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-300">
						{msg.message}
					</p>
					<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
						<span className="flex items-center gap-1">
							<Phone className="size-3" /> {msg.phone || "—"}
						</span>
						<span className="flex items-center gap-1">
							<Mail className="size-3" /> {msg.email || "—"}
						</span>
					</div>
				</button>

				<div className="flex shrink-0 flex-wrap items-center gap-1.5">
					{telTarget ? (
						<a
							href={`tel:${telTarget}`}
							aria-label={`${t("actions.call")} ${msg.name}`}
							className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
						>
							<Phone className="size-3.5" />
							<span>{t("actions.call")}</span>
						</a>
					) : null}
					{waUrl ? (
						<a
							href={waUrl}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`WhatsApp ${msg.name}`}
							className="inline-flex items-center gap-1 rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-2.5 py-1.5 text-xs font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/20"
						>
							<MessageCircle className="size-3.5" />
							<span>WhatsApp</span>
						</a>
					) : null}
					{msg.phone ? (
						<button
							type="button"
							onClick={() => onCopy(msg.phone, `${msg.id}-phone`)}
							aria-label={t("actions.copyPhone")}
							title={t("actions.copyPhone")}
							className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-1.5 text-neutral-400 transition-colors hover:border-purple-500/40 hover:text-white"
						>
							{copiedKey === `${msg.id}-phone` ? (
								<Check className="size-3.5 text-emerald-400" />
							) : (
								<Copy className="size-3.5" />
							)}
						</button>
					) : null}
					{msg.status !== "archived" ? (
						<button
							type="button"
							disabled={isMutating}
							onClick={() => onStatusChange(msg.id, "archived")}
							aria-label={t("actions.archive")}
							title={t("actions.archive")}
							className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-1.5 text-neutral-400 transition-colors hover:border-purple-500/40 hover:text-purple-300 disabled:opacity-50"
						>
							<Archive className="size-3.5" />
						</button>
					) : null}
					<button
						type="button"
						disabled={isMutating}
						onClick={() => onRequestDelete(msg.id)}
						aria-label={t("actions.delete")}
						title={t("actions.delete")}
						className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-1.5 text-rose-400 transition-colors hover:border-rose-500/40 hover:bg-rose-950/20 disabled:opacity-50"
					>
						<Trash2 className="size-3.5" />
					</button>
				</div>
			</div>
		</article>
	);
};
