"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import type { MessagesPageMeta } from "@/features/admin/types/messagesTypes";

interface MessagesPaginationProps {
	pagination: MessagesPageMeta;
	isLoading: boolean;
	onPageChange: (nextPage: number) => void;
}

export const MessagesPagination: React.FC<MessagesPaginationProps> = ({
	pagination,
	isLoading,
	onPageChange,
}) => {
	const t = useTranslations("Admin.messages");

	if (pagination.totalPages <= 1) return null;

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 text-xs text-neutral-400">
			<span>
				{t("pagination.showing", {
					page: pagination.page,
					totalPages: pagination.totalPages,
					total: pagination.totalFiltered,
				})}
			</span>
			<div className="flex items-center gap-2">
				<button
					type="button"
					disabled={isLoading || pagination.page <= 1}
					onClick={() => onPageChange(pagination.page - 1)}
					aria-label={t("pagination.prev")}
					className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 font-semibold text-neutral-300 transition-colors hover:border-purple-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
				>
					<ChevronLeft className="size-3.5" />
					{t("pagination.prev")}
				</button>
				<button
					type="button"
					disabled={isLoading || pagination.page >= pagination.totalPages}
					onClick={() => onPageChange(pagination.page + 1)}
					aria-label={t("pagination.next")}
					className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 font-semibold text-neutral-300 transition-colors hover:border-purple-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
				>
					{t("pagination.next")}
					<ChevronRight className="size-3.5" />
				</button>
			</div>
		</div>
	);
};
