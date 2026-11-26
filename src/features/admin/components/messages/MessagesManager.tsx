"use client";

import { Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
	deleteMessage,
	getAdminMessages,
	markAllMessagesRead,
	updateMessageStatus,
} from "@/features/admin/actions/messages";
import { MessageCard } from "@/features/admin/components/messages/MessageCard";
import { MessageDetailModal } from "@/features/admin/components/messages/MessageDetailModal";
import { MessagesPagination } from "@/features/admin/components/messages/MessagesPagination";
import { MessagesToolbar } from "@/features/admin/components/messages/MessagesToolbar";

import type {
	AdminMessage,
	MessageCounts,
	MessagesPageMeta,
	MessageStatus,
} from "@/features/admin/types/messagesTypes";

interface MessagesManagerProps {
	initialMessages: AdminMessage[];
	initialCounts: MessageCounts;
	initialPagination: MessagesPageMeta;
	initialStatus?: MessageStatus | "all";
	initialError?: string | null;
}

const localeMap: Record<string, string> = {
	de: "de-DE",
	en: "en-US",
	el: "el-GR",
};

export const MessagesManager: React.FC<MessagesManagerProps> = ({
	initialMessages,
	initialCounts,
	initialPagination,
	initialStatus = "all",
	initialError = null,
}) => {
	const t = useTranslations("Admin.messages");
	const tConfirm = useTranslations("ConfirmModal");
	const locale = useLocale();
	const router = useRouter();

	const [messages, setMessages] = useState<AdminMessage[]>(initialMessages);
	const [counts, setCounts] = useState<MessageCounts>(initialCounts);
	const [pagination, setPagination] = useState<MessagesPageMeta>(initialPagination);
	const [statusFilter, setStatusFilter] = useState<MessageStatus | "all">(initialStatus);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isMutating, setIsMutating] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

	const requestIdRef = useRef(0);
	const searchMountedRef = useRef(false);
	const pageSize = pagination.pageSize;
	const dateLocale = localeMap[locale] ?? "de-DE";

	const fetchServerMessages = useCallback(
		async (
			nextStatus: MessageStatus | "all",
			nextSearch: string,
			nextPage: number,
			refreshRouter: boolean,
		) => {
			const reqId = ++requestIdRef.current;
			setIsLoading(true);
			setErrorMsg(null);
			try {
				const trimmedSearch = nextSearch.trim();
				const searchParam = trimmedSearch.length > 0 ? trimmedSearch : undefined;
				let res = await getAdminMessages({
					status: nextStatus,
					search: searchParam,
					page: nextPage,
					pageSize,
				});
				if (reqId !== requestIdRef.current) return;
				if (!res.success) {
					setErrorMsg(res.error ?? t("errors.loadFailed"));
					return;
				}
				if (nextPage > res.data.pagination.totalPages) {
					res = await getAdminMessages({
						status: nextStatus,
						search: searchParam,
						page: res.data.pagination.totalPages,
						pageSize,
					});
					if (reqId !== requestIdRef.current) return;
					if (!res.success) {
						setErrorMsg(res.error ?? t("errors.loadFailed"));
						return;
					}
				}
				setMessages(res.data.messages);
				setCounts(res.data.counts);
				setPagination(res.data.pagination);
				if (refreshRouter) router.refresh();
			} catch (err) {
				if (reqId !== requestIdRef.current) return;
				console.error("[MessagesManager] Fetch error:", err);
				setErrorMsg(t("errors.loadFailed"));
			} finally {
				if (reqId === requestIdRef.current) setIsLoading(false);
			}
		},
		[pageSize, router, t],
	);

	useEffect(() => {
		if (!searchMountedRef.current) {
			searchMountedRef.current = true;
			return;
		}
		const timer = setTimeout(() => {
			void fetchServerMessages(statusFilter, searchQuery, 1, false);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery, statusFilter, fetchServerMessages]);

	const handleStatusFilterChange = (nextStatus: MessageStatus | "all") => {
		setStatusFilter(nextStatus);
		void fetchServerMessages(nextStatus, searchQuery, 1, false);
	};

	const handleStatusChange = async (id: string, nextStatus: MessageStatus) => {
		setIsMutating(true);
		setErrorMsg(null);
		try {
			const res = await updateMessageStatus({ id, status: nextStatus });
			if (res.success) {
				setSelectedMessage((prev) => (prev && prev.id === id ? res.data : prev));
				await fetchServerMessages(statusFilter, searchQuery, pagination.page, true);
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
				await fetchServerMessages(statusFilter, searchQuery, pagination.page, true);
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
				if (selectedMessage?.id === deletingId) setSelectedMessage(null);
				await fetchServerMessages(statusFilter, searchQuery, pagination.page, true);
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
				onRefresh={() => void fetchServerMessages(statusFilter, searchQuery, pagination.page, true)}
				onMarkAllRead={handleMarkAllRead}
				onDismissError={() => setErrorMsg(null)}
				onStatusFilterChange={handleStatusFilterChange}
				onSearchQueryChange={setSearchQuery}
			/>

			{messages.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 py-14 text-center">
					<Inbox className="mb-3 size-10 text-neutral-600" />
					<p className="text-sm text-neutral-500">{t("empty")}</p>
				</div>
			) : (
				<div className="space-y-3">
					{messages.map((msg) => (
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

			<MessagesPagination
				pagination={pagination}
				isLoading={isLoading}
				onPageChange={(nextPage) =>
					void fetchServerMessages(statusFilter, searchQuery, nextPage, false)
				}
			/>

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
