"use client";

import { AlertCircle, Edit2, Plus, RefreshCw, Search, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";

import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
	deleteKnowledgeEntryAction,
	getKnowledgeEntriesAction,
} from "@/features/admin/actions/knowledge";
import { KnowledgeEditorModal } from "@/features/admin/components/knowledge/KnowledgeEditorModal";
import { SemanticSearchTestModal } from "@/features/admin/components/knowledge/SemanticSearchTestModal";
import {
	KnowledgeCategorySchema,
	type ChatbotKnowledgeListItem,
	type KnowledgeCategory,
} from "@/features/admin/types/knowledge";
import { formatTextValue } from "@/features/admin/utils/format";

interface KnowledgeListProps {
	initialEntries: ChatbotKnowledgeListItem[];
	initialError?: string | null;
}

const CATEGORIES: readonly KnowledgeCategory[] = KnowledgeCategorySchema.options;

export const KnowledgeList: React.FC<KnowledgeListProps> = ({
	initialEntries,
	initialError = null,
}) => {
	const t = useTranslations("Admin.chatbotKb");
	const tConfirm = useTranslations("ConfirmModal");
	const locale = useLocale();
	const router = useRouter();

	const [entries, setEntries] = useState<ChatbotKnowledgeListItem[]>(initialEntries);
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

	const [editorOpen, setEditorOpen] = useState(false);
	const [editingEntry, setEditingEntry] = useState<ChatbotKnowledgeListItem | null>(null);
	const [isSearchTestOpen, setIsSearchTestOpen] = useState(false);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const filteredEntries = useMemo(() => {
		if (categoryFilter === "all") return entries;
		return entries.filter((entry) => entry.metadata?.category === categoryFilter);
	}, [entries, categoryFilter]);

	const refreshEntries = async () => {
		setIsRefreshing(true);
		setErrorMsg(null);
		try {
			const res = await getKnowledgeEntriesAction();
			if (res.success) {
				setEntries(res.data);
				router.refresh();
			} else {
				setErrorMsg(res.error ?? t("loadError"));
			}
		} catch (err) {
			console.error("[KnowledgeList] Refresh error:", err);
			setErrorMsg(t("loadError"));
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleSaved = (saved: ChatbotKnowledgeListItem) => {
		setEntries((prev) => {
			const exists = prev.some((item) => item.id === saved.id);
			if (exists) {
				return prev.map((item) => (item.id === saved.id ? saved : item));
			}
			return [saved, ...prev];
		});
		setEditorOpen(false);
		setEditingEntry(null);
		router.refresh();
	};

	const handleConfirmDelete = async () => {
		if (!deleteConfirmId || isDeleting) return;
		setIsDeleting(true);
		setErrorMsg(null);
		try {
			const result = await deleteKnowledgeEntryAction(deleteConfirmId);
			if (result.success) {
				setEntries((prev) => prev.filter((item) => item.id !== deleteConfirmId));
				router.refresh();
			} else {
				setErrorMsg(result.error || t("deleteError"));
			}
		} catch (err) {
			console.error("[KnowledgeList] Delete error:", err);
			setErrorMsg(t("deleteError"));
		} finally {
			setIsDeleting(false);
			setDeleteConfirmId(null);
		}
	};

	return (
		<div className="space-y-5">
			{/* Auto-sync Services Banner */}
			<div className="flex items-start gap-2.5 rounded-xl border border-purple-500/25 bg-purple-950/20 px-4 py-3 text-xs text-purple-200">
				<Sparkles className="mt-0.5 size-4 shrink-0 text-purple-400" />
				<span>{t("servicesSyncBanner")}</span>
			</div>

			{errorMsg ? (
				<div className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-950/20 p-3.5 text-xs text-rose-400">
					<div className="flex items-center gap-2">
						<AlertCircle className="size-4 shrink-0" />
						<span>{errorMsg}</span>
					</div>
					<button
						type="button"
						onClick={() => setErrorMsg(null)}
						aria-label={t("editor.cancel")}
						className="cursor-pointer font-bold hover:underline"
					>
						×
					</button>
				</div>
			) : null}

			{/* Header actions */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap items-center gap-2">
					<select
						value={categoryFilter}
						onChange={(e) => setCategoryFilter(e.target.value)}
						aria-label={t("categories.all")}
						className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-purple-500"
					>
						<option value="all">{t("categories.all")}</option>
						{CATEGORIES.map((cat) => (
							<option key={cat} value={cat}>
								{t(`categories.${cat}`)}
							</option>
						))}
					</select>

					<button
						type="button"
						onClick={refreshEntries}
						disabled={isRefreshing}
						aria-label={t("refresh")}
						className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-purple-500/40 hover:text-white disabled:opacity-50"
					>
						<RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
						<span>{t("refresh")}</span>
					</button>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => setIsSearchTestOpen(true)}
						aria-label={t("testSearch")}
						className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-purple-500/40 hover:text-white"
					>
						<Search className="h-4 w-4" />
						{t("testSearch")}
					</button>

					<button
						type="button"
						onClick={() => {
							setEditingEntry(null);
							setEditorOpen(true);
						}}
						aria-label={t("addEntry")}
						className="flex cursor-pointer items-center gap-2 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
					>
						<Plus className="h-4 w-4" />
						{t("addEntry")}
					</button>
				</div>
			</div>

			{/* Knowledge List */}
			<div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
				{filteredEntries.length === 0 ? (
					<div className="py-12 text-center text-sm text-neutral-500">{t("empty")}</div>
				) : (
					<div className="divide-y divide-neutral-800/60">
						{filteredEntries.map((entry) => {
							const cat = entry.metadata?.category ?? "general";
							const titleText = formatTextValue(entry.metadata?.title, locale);

							return (
								<div
									key={entry.id}
									className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-start"
								>
									<div className="flex-1 space-y-1.5">
										<div className="flex flex-wrap items-center gap-2">
											<span className="rounded border border-purple-500/30 bg-purple-950/40 px-2 py-0.5 text-xs font-semibold text-purple-300">
												{t(`categories.${cat}`)}
											</span>
											<h4 className="text-base font-semibold text-white">{titleText || "—"}</h4>
										</div>
										<p className="line-clamp-3 text-sm leading-relaxed text-neutral-300">
											{formatTextValue(entry.content, locale)}
										</p>
										{Array.isArray(entry.metadata?.keywords) &&
										entry.metadata.keywords.length > 0 ? (
											<div className="flex flex-wrap gap-1.5 pt-1">
												{entry.metadata.keywords.map((kw, idx) => (
													<span
														key={`${entry.id}-kw-${idx}`}
														className="rounded border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-[11px] text-neutral-400"
													>
														#{kw}
													</span>
												))}
											</div>
										) : null}
									</div>

									<div className="flex items-center gap-1.5 self-end sm:self-start">
										<button
											type="button"
											onClick={() => {
												setEditingEntry(entry);
												setEditorOpen(true);
											}}
											aria-label={`${t("editEntry")}: ${titleText}`}
											className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-neutral-400 transition-colors hover:border-purple-500/40 hover:text-white"
										>
											<Edit2 className="h-4 w-4" />
										</button>
										<button
											type="button"
											onClick={() => setDeleteConfirmId(entry.id)}
											disabled={isDeleting}
											aria-label={`${t("deleteConfirmTitle")}: ${titleText}`}
											className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-rose-400 transition-colors hover:border-rose-500/40 hover:bg-rose-950/30 disabled:opacity-50"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<KnowledgeEditorModal
				isOpen={editorOpen}
				entry={editingEntry}
				onClose={() => {
					setEditorOpen(false);
					setEditingEntry(null);
				}}
				onSaved={handleSaved}
			/>

			{isSearchTestOpen ? (
				<SemanticSearchTestModal onClose={() => setIsSearchTestOpen(false)} />
			) : null}

			<ConfirmModal
				isOpen={Boolean(deleteConfirmId)}
				onClose={() => setDeleteConfirmId(null)}
				onConfirm={handleConfirmDelete}
				title={t("deleteConfirmTitle")}
				description={t("deleteConfirmDesc")}
				confirmText={tConfirm("confirm")}
				cancelText={tConfirm("cancel")}
				variant="danger"
				isLoading={isDeleting}
			/>
		</div>
	);
};
