"use client";

import { AlertCircle, CheckCheck, RefreshCw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import type { MessageCounts, MessageStatus } from "@/features/admin/types/messagesTypes";

interface MessagesToolbarProps {
	counts: MessageCounts;
	statusFilter: MessageStatus | "all";
	searchQuery: string;
	isLoading: boolean;
	isMutating: boolean;
	errorMsg: string | null;
	onRefresh: () => void;
	onMarkAllRead: () => void;
	onDismissError: () => void;
	onStatusFilterChange: (status: MessageStatus | "all") => void;
	onSearchQueryChange: (query: string) => void;
}

export const MessagesToolbar: React.FC<MessagesToolbarProps> = ({
	counts,
	statusFilter,
	searchQuery,
	isLoading,
	isMutating,
	errorMsg,
	onRefresh,
	onMarkAllRead,
	onDismissError,
	onStatusFilterChange,
	onSearchQueryChange,
}) => {
	const t = useTranslations("Admin.messages");

	const tabs: Array<{ key: MessageStatus | "all"; count: number }> = [
		{ key: "all", count: counts.all },
		{ key: "unread", count: counts.unread },
		{ key: "read", count: counts.read },
		{ key: "archived", count: counts.archived },
	];

	return (
		<>
			<div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="Montserrat text-3xl font-extrabold tracking-tight text-white">
						{t("title")}
					</h1>
					<p className="mt-1 text-sm text-neutral-400">{t("subtitle")}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<button
						type="button"
						onClick={onRefresh}
						disabled={isLoading}
						aria-label={t("actions.refresh")}
						className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors hover:border-purple-500/40 hover:text-white disabled:opacity-50"
					>
						<RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
						{t("actions.refresh")}
					</button>
					<button
						type="button"
						onClick={onMarkAllRead}
						disabled={counts.unread === 0 || isMutating}
						aria-label={t("actions.markAllRead")}
						className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-600/20 px-3.5 py-2 text-xs font-bold text-purple-200 transition-colors hover:bg-purple-600/30 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<CheckCheck className="size-4" />
						{t("actions.markAllRead")}
					</button>
				</div>
			</div>

			{errorMsg ? (
				<div className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-950/20 p-3.5 text-xs text-rose-400">
					<div className="flex items-center gap-2">
						<AlertCircle className="size-4 shrink-0" />
						<span>{errorMsg}</span>
					</div>
					<button
						type="button"
						onClick={onDismissError}
						aria-label={t("modal.close")}
						className="cursor-pointer font-bold hover:underline"
					>
						×
					</button>
				</div>
			) : null}

			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-wrap gap-2" role="tablist" aria-label={t("title")}>
					{tabs.map((tab) => {
						const active = statusFilter === tab.key;
						return (
							<button
								key={tab.key}
								type="button"
								role="tab"
								aria-selected={active}
								onClick={() => onStatusFilterChange(tab.key)}
								className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
									active
										? "border-purple-500/50 bg-purple-600/25 text-purple-200"
										: "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
								}`}
							>
								<span>{t(`tabs.${tab.key}`)}</span>
								<span className="rounded-full bg-neutral-800 px-1.5 py-0.5 text-[11px] text-neutral-300">
									{tab.count}
								</span>
							</button>
						);
					})}
				</div>

				<div className="relative w-full lg:max-w-sm">
					<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => onSearchQueryChange(e.target.value)}
						placeholder={t("searchPlaceholder")}
						aria-label={t("searchPlaceholder")}
						className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 pr-4 pl-9 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
					/>
				</div>
			</div>
		</>
	);
};
