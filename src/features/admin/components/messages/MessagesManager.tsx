"use client";

import { Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";

import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
	deleteMessage,
	getAdminMessages,
	markAllMessagesRead,
	updateMessageStatus,
} from "@/features/admin/actions/messages";
import { MessageCard } from "@/features/admin/components/messages/MessageCard";
import { MessageDetailModal } from "@/features/admin/components/messages/MessageDetailModal";
import { MessagesToolbar } from "@/features/admin/components/messages/MessagesToolbar";

import type {
	AdminMessage,
	MessageCounts,
	MessageStatus,
} from "@/features/admin/types/messagesTypes";

interface MessagesManagerProps {
	initialMessages: AdminMessage[];
	initialCounts: MessageCounts;
	initialStatus?: MessageStatus | "all";
	initialError?: string | null;
}

const localeMap: Record<string, string> = {
	de: "de-DE",
	en: "en-US",
	el: "el-GR",
};

const computeCounts = (list: AdminMessage[]): MessageCounts => ({
	all: list.length,
	unread: list.filter((m) => m.status === "unread").length,
	read: list.filter((m) => m.status === "read").length,
	archived: list.filter((m) => m.status === "archived").length,
});

export const MessagesManager: React.FC<MessagesManagerProps> = ({
	initialMessages,
	initialCounts,
	initialStatus = "all",
	initialError = null,
}) => {
	const t = useTranslations("Admin.messages");
	const tConfirm = useTranslations("ConfirmModal");
	const locale = useLocale();
	const router = useRouter();

	const [messages, setMessages] = useState<AdminMessage[]>(initialMessages);
	const [counts, setCounts] = useState<MessageCounts>(initialCounts);
	const [statusFilter, setStatusFilter] = useState<MessageStatus | "all">(initialStatus);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isMutating, setIsMutating] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

	const dateLocale = localeMap[locale] ?? "de-DE";

	const filteredMessages = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return messages.filter((msg) => {
			if (statusFilter !== "all" && msg.status !== statusFilter) return false;
			if (!q) return true;
			return (
				msg.name.toLowerCase().includes(q) ||
				msg.email.toLowerCase().includes(q) ||
				msg.phone.toLowerCase().includes(q) ||
				msg.message.toLowerCase().includes(q)
			);
		});
	}, [messages, statusFilter, searchQuery]);

	const refreshMessages = async () => {
		setIsLoading(true);
		setErrorMsg(null);
		try {
			const res = await getAdminMessages({ status: "all" });
			if (res.success) {
				setMessages(res.data.messages);
				setCounts(res.data.counts);
				router.refresh();
			} else {
				setErrorMsg(res.error ?? t("errors.loadFailed"));
			}
		} catch (err) {
			console.error("[MessagesManager] Refresh error:", err);
			setErrorMsg(t("errors.loadFailed"));
		} finally {
			setIsLoading(false);
		}
	};

	const handleStatusChange = async (id: string, nextStatus: MessageStatus) => {
		setIsMutating(true);
		setErrorMsg(null);
		try {
			const res = await updateMessageStatus({ id, status: nextStatus });
			if (res.success) {
				const updated = res.data;
				setMessages((prev) => {
					const nextList = prev.map((m) => (m.id === id ? updated : m));
					setCounts(computeCounts(nextList));
					return nextList;
				});
				setSelectedMessage((prev) => (prev && prev.id === id ? updated : prev));
				router.refresh();
			} else {
				setErrorMsg(res.error ?? t("errors.updateFailed"));
			}
		} catch (err) {
			console.error("[MessagesManager] Status update error:", err);
			setErrorMsg(t("errors.updateFailed"));
		} finally {
			setIsMutating(false);
		}
	};

	const handleOpenMessage = (msg: AdminMessage) => {
		setSelectedMessage(msg);
		if (msg.status === "unread") {
			void handleStatusChange(msg.id, "read");
		}
	};

	const handleMarkAllRead = async () => {
		if (counts.unread === 0 || isMutating) return;
		setIsMutating(true);
		setErrorMsg(null);
		try {
			const res = await markAllMessagesRead();
			if (res.success) {
				const nowIso = new Date().toISOString();
				setMessages((prev) => {
					const nextList = prev.map((m) =>
						m.status === "unread" ? { ...m, status: "read" as const, read_at: nowIso } : m,
					);
					setCounts(computeCounts(nextList));
					return nextList;
				});
				router.refresh();
			} else {
				setErrorMsg(res.error ?? t("errors.updateFailed"));
			}
		} catch (err) {
			console.error("[MessagesManager] Mark all read error:", err);
			setErrorMsg(t("errors.updateFailed"));
		} finally {
			setIsMutating(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!deletingId || isMutating) return;
		setIsMutating(true);
		setErrorMsg(null);
		try {
			const res = await deleteMessage({ id: deletingId });
			if (res.success) {
				setMessages((prev) => {
					const nextList = prev.filter((m) => m.id !== deletingId);
					setCounts(computeCounts(nextList));
					return nextList;
				});
				if (selectedMessage?.id === deletingId) setSelectedMessage(null);
				router.refresh();
			} else {
				setErrorMsg(res.error ?? t("errors.deleteFailed"));
			}
		} catch (err) {
			console.error("[MessagesManager] Delete error:", err);
			setErrorMsg(t("errors.deleteFailed"));
		} finally {
			setIsMutating(false);
			setDeletingId(null);
		}
	};

	const handleCopy = async (value: string, key: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedKey(key);
			setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1800);
		} catch (err) {
			console.error("[MessagesManager] Clipboard copy failed:", err);
		}
	};

	return (
		<div className="space-y-6">
			<MessagesToolbar
				counts={counts}
				statusFilter={statusFilter}
				searchQuery={searchQuery}
				isLoading={isLoading}
				isMutating={isMutating}
				errorMsg={errorMsg}
				onRefresh={refreshMessages}
				onMarkAllRead={handleMarkAllRead}
				onDismissError={() => setErrorMsg(null)}
				onStatusFilterChange={setStatusFilter}
				onSearchQueryChange={setSearchQuery}
			/>

			{filteredMessages.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 py-14 text-center">
					<Inbox className="mb-3 size-10 text-neutral-600" />
					<p className="text-sm text-neutral-500">{t("empty")}</p>
				</div>
			) : (
				<div className="space-y-3">
					{filteredMessages.map((msg) => (
						<MessageCard
							key={msg.id}
							message={msg}
							dateLocale={dateLocale}
							copiedKey={copiedKey}
							isMutating={isMutating}
							t={t}
							onOpen={handleOpenMessage}
							onCopy={handleCopy}
							onStatusChange={handleStatusChange}
							onRequestDelete={(id) => setDeletingId(id)}
						/>
					))}
				</div>
			)}

			<MessageDetailModal
				message={selectedMessage}
				isUpdating={isMutating}
				onClose={() => setSelectedMessage(null)}
				onStatusChange={handleStatusChange}
				onRequestDelete={(id) => setDeletingId(id)}
			/>

			<ConfirmModal
				isOpen={Boolean(deletingId)}
				title={t("deleteConfirm.title")}
				description={t("deleteConfirm.description")}
				confirmText={tConfirm("confirm")}
				cancelText={tConfirm("cancel")}
				variant="danger"
				isLoading={isMutating}
				onConfirm={handleConfirmDelete}
				onClose={() => setDeletingId(null)}
			/>
		</div>
	);
};
