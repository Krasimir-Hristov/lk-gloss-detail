"use client";

import { Trash2, Search, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";

import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
	getKnowledgeEntriesAction,
	deleteKnowledgeEntryAction,
} from "@/features/admin/actions/knowledge";
import { AiKnowledgeWizard } from "@/features/admin/components/knowledge/ai-knowledge-wizard";
import { SemanticSearchTestModal } from "@/features/admin/components/knowledge/semantic-search-test-modal";
import { formatTextValue } from "@/features/admin/utils/format";

import type { ChatbotKnowledgeEntry, SupportedLocale } from "@/features/admin/types/knowledge";

export const KnowledgeList: React.FC = () => {
	const t = useTranslations("Admin.chatbotKb");
	const [entries, setEntries] = useState<ChatbotKnowledgeEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [localeFilter, setLocaleFilter] = useState<SupportedLocale | "all">("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [isWizardOpen, setIsWizardOpen] = useState(false);
	const [isSearchTestOpen, setIsSearchTestOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

	const fetchEntries = async () => {
		try {
			setLoading(true);
			setFetchError(null);
			const result = await getKnowledgeEntriesAction(localeFilter, categoryFilter);
			if (result.success && result.data) {
				setEntries(result.data);
			} else {
				setFetchError(result.error || "Failed to load entries");
			}
		} catch (err: unknown) {
			setFetchError((err as Error).message || "Failed to load entries");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		let isCurrent = true;

		getKnowledgeEntriesAction(localeFilter, categoryFilter)
			.then((result) => {
				if (!isCurrent) return;
				if (result.success && result.data) {
					setEntries(result.data);
				} else {
					setFetchError(result.error || "Failed to load entries");
				}
			})
			.catch((err: unknown) => {
				if (!isCurrent) return;
				setFetchError((err as Error).message || "Failed to load entries");
			})
			.finally(() => {
				if (isCurrent) {
					setLoading(false);
				}
			});

		return () => {
			isCurrent = false;
		};
	}, [localeFilter, categoryFilter]);

	const handleDelete = async (id: string) => {
		setIsDeleting(id);
		try {
			const result = await deleteKnowledgeEntryAction(id);
			if (result.success) {
				await fetchEntries();
			} else {
				alert(result.error || t("deleteError"));
			}
		} catch (err: unknown) {
			alert((err as Error).message || t("deleteError"));
		} finally {
			setIsDeleting(null);
			setDeleteConfirmId(null);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header actions */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex gap-2">
					<select
						value={localeFilter}
						onChange={(e) => setLocaleFilter(e.target.value as SupportedLocale | "all")}
						className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 outline-none focus:border-purple-500"
					>
						<option value="all">{t("allLanguages")}</option>
						<option value="de">German (de)</option>
						<option value="el">Greek (el)</option>
						<option value="en">English (en)</option>
					</select>
					<select
						value={categoryFilter}
						onChange={(e) => setCategoryFilter(e.target.value)}
						className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 outline-none focus:border-purple-500"
					>
						<option value="all">{t("categories.all")}</option>
						<option value="interior">{t("categories.interior")}</option>
						<option value="exterior">{t("categories.exterior")}</option>
						<option value="paint_correction">{t("categories.paint_correction")}</option>
						<option value="headlights_special">{t("categories.headlights_special")}</option>
						<option value="company_policy">{t("categories.company_policy")}</option>
					</select>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => setIsSearchTestOpen(true)}
						className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
					>
						<Search className="h-4 w-4" />
						{t("testSearch")}
					</button>

					<button
						onClick={() => setIsWizardOpen(true)}
						className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
					>
						<Plus className="h-4 w-4" />
						{t("addAiKnowledge")}
					</button>
				</div>
			</div>

			{/* Knowledge List / Table */}
			<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-xl">
				{loading ? (
					<div className="py-12 text-center text-sm text-neutral-400">{t("loading")}</div>
				) : fetchError ? (
					<div className="py-8 text-center text-sm text-red-400">{fetchError}</div>
				) : entries.length === 0 ? (
					<div className="py-12 text-center text-sm text-neutral-500">{t("empty")}</div>
				) : (
					<div className="divide-y divide-neutral-800/60">
						{entries.map((entry) => (
							<div
								key={entry.id}
								className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-start"
							>
								<div className="flex-1 space-y-1.5">
									<div className="flex flex-wrap items-center gap-2">
										<span className="rounded border border-purple-800/30 bg-purple-950/40 px-2 py-0.5 text-xs font-semibold text-purple-400">
											{t(`categories.${entry.metadata?.category || "general"}`)}
										</span>
										<span className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300 uppercase">
											{entry.language}
										</span>
										<h4 className="text-base font-semibold text-white">
											{formatTextValue(entry.metadata?.title, entry.language)}
										</h4>
									</div>
									<p className="line-clamp-3 text-sm leading-relaxed text-neutral-300">
										{formatTextValue(entry.content, entry.language)}
									</p>
									{entry.metadata?.keywords && Array.isArray(entry.metadata.keywords) ? (
										<div className="flex flex-wrap gap-1.5 pt-1">
											{entry.metadata.keywords.map((kw: string, idx: number) => (
												<span
													key={idx}
													className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[11px] text-neutral-400"
												>
													#{kw}
												</span>
											))}
										</div>
									) : null}
								</div>

								<div className="flex items-center gap-2 self-end sm:self-start">
									<button
										onClick={() => setDeleteConfirmId(entry.id)}
										disabled={isDeleting === entry.id}
										className="rounded-md p-2 text-neutral-400 transition-colors hover:bg-red-950/40 hover:text-red-400 disabled:opacity-50"
										title="Delete entry"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{isWizardOpen ? (
				<AiKnowledgeWizard
					onClose={() => setIsWizardOpen(false)}
					onSuccess={() => {
						setIsWizardOpen(false);
						fetchEntries();
					}}
				/>
			) : null}

			{isSearchTestOpen ? (
				<SemanticSearchTestModal onClose={() => setIsSearchTestOpen(false)} />
			) : null}

			<ConfirmModal
				isOpen={!!deleteConfirmId}
				onClose={() => setDeleteConfirmId(null)}
				onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
				title={t("deleteConfirmTitle")}
				description={t("deleteConfirmDesc")}
				confirmText="Delete"
				variant="danger"
			/>
		</div>
	);
};
