"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from "react";

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
import { DATE_LOCALE_MAP, resolveAppLocale } from "@/i18n/locales";

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

const ADMIN_MESSAGES_QUERY_KEY = "admin-messages";

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
	const queryClient = useQueryClient();

	const [statusFilter, setStatusFilter] = useState<MessageStatus | "all">(initialStatus);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [page, setPage] = useState(initialPagination.page);
	const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const [isMutating, setIsMutating] = useState(false);
	const [mutationError, setMutationError] = useState<string | null>(null);
	const [initialErrorDismissed, setInitialErrorDismissed] = useState(false);
	const [dismissedQueryError, setDismissedQueryError] = useState<Error | null>(null);

	const searchMountedRef = useRef(false);
	const pageSize = initialPagination.pageSize;
	const dateLocale = DATE_LOCALE_MAP[resolveAppLocale(locale)];
	const trimmedSearch = debouncedSearch.trim();
	const isInitialQuery =
		statusFilter === initialStatus &&
		trimmedSearch === "" &&
		page === initialPagination.page &&
		!initialError;

	const activeQueryRef = useRef({ status: statusFilter, search: trimmedSearch, page });
	useEffect(() => {
		activeQueryRef.current = { status: statusFilter, search: trimmedSearch, page };
	}, [statusFilter, trimmedSearch, page]);

	useEffect(() => {
		if (!searchMountedRef.current) {
			searchMountedRef.current = true;
			return;
		}
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
			setPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	const {
		data,
		error: queryError,
		isFetching,
		isPlaceholderData,
		isSuccess,
		refetch,
	} = useQuery({
		queryKey: [ADMIN_MESSAGES_QUERY_KEY, statusFilter, trimmedSearch, page, pageSize],
		queryFn: async () => {
			const reqStatus = statusFilter;
			const reqSearch = trimmedSearch;
			const reqPage = page;
			const res = await getAdminMessages({
				status: reqStatus,
				search: reqSearch.length > 0 ? reqSearch : undefined,
				page: reqPage,
				pageSize,
			});
			if (!res.success) {
				throw new Error(t("errors.loadFailed"));
			}
			const clampedPage = res.data.pagination.page;
			if (clampedPage !== reqPage) {
				const active = activeQueryRef.current;
				if (active.status === reqStatus && active.search === reqSearch && active.page === reqPage) {
					queryClient.setQueryData(
						[ADMIN_MESSAGES_QUERY_KEY, reqStatus, reqSearch, clampedPage, pageSize],
						res.data,
					);
					setPage(clampedPage);
				}
			}
			return res.data;
		},
		initialData: isInitialQuery
			? { messages: initialMessages, counts: initialCounts, pagination: initialPagination }
			: undefined,
		placeholderData: keepPreviousData,
		staleTime: 10_000,
	});

	const messages = data?.messages ?? (isInitialQuery ? initialMessages : []);
	const counts = data?.counts ?? initialCounts;
	const pagination = data?.pagination ?? initialPagination;
	const hasRecoveredLoad = isSuccess && !isPlaceholderData;
	const activeInitialError =
		initialError && !initialErrorDismissed && !hasRecoveredLoad ? t("errors.loadFailed") : null;
	const activeQueryError =
		queryError instanceof Error && queryError !== dismissedQueryError ? queryError.message : null;
	const errorMsg = mutationError ?? activeQueryError ?? activeInitialError;

	const invalidateMessages = async () => {
		await queryClient.invalidateQueries({ queryKey: [ADMIN_MESSAGES_QUERY_KEY] });
		router.refresh();
	};

	const handleStatusFilterChange = (nextStatus: MessageStatus | "all") => {
		setStatusFilter(nextStatus);
		setPage(1);
	};

	const handleStatusChange = async (id: string, nextStatus: MessageStatus) => {
		setIsMutating(true);
		setMutationError(null);
		try {
			const res = await updateMessageStatus({ id, status: nextStatus });
			if (res.success) {
				setSelectedMessage((prev) => (prev && prev.id === id ? res.data : prev));
				await invalidateMessages();
			} else {
				setMutationError(t("errors.updateFailed"));
			}
		} catch (err) {
			console.error("[MessagesManager] Status update error:", err);
			setMutationError(t("errors.updateFailed"));
		} finally {
			setIsMutating(false);
		}
	};

	const handleOpenMessage = (msg: AdminMessage) => {
		setSelectedMessage(msg);
		if (msg.status === "unread") void handleStatusChange(msg.id, "read");
	};

	const handleMarkAllRead = async () => {
		if (counts.unread === 0 || isMutating) return;
		setIsMutating(true);
		setMutationError(null);
		try {
			const res = await markAllMessagesRead();
			if (res.success) await invalidateMessages();
			else setMutationError(t("errors.updateFailed"));
		} catch (err) {
			console.error("[MessagesManager] Mark all read error:", err);
			setMutationError(t("errors.updateFailed"));
		} finally {
			setIsMutating(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!deletingId || isMutating) return;
		setIsMutating(true);
		setMutationError(null);
		try {
			const res = await deleteMessage({ id: deletingId });
			if (res.success) {
				if (selectedMessage?.id === deletingId) setSelectedMessage(null);
				await invalidateMessages();
			} else {
				setMutationError(t("errors.deleteFailed"));
			}
		} catch (err) {
			console.error("[MessagesManager] Delete error:", err);
			setMutationError(t("errors.deleteFailed"));
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
				isLoading={isFetching}
				isMutating={isMutating}
				errorMsg={errorMsg}
				onRefresh={() => {
					setMutationError(null);
					setDismissedQueryError(null);
					void refetch();
					router.refresh();
				}}
				onMarkAllRead={handleMarkAllRead}
				onDismissError={() => {
					setMutationError(null);
					setInitialErrorDismissed(true);
					if (queryError instanceof Error) setDismissedQueryError(queryError);
				}}
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
				isLoading={isFetching}
				onPageChange={(nextPage) => setPage(nextPage)}
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
