"use client";

import { Trash2, Search, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { AiKnowledgeWizard } from "@/features/admin/components/knowledge/AiKnowledgeWizard";
import { SemanticSearchTestModal } from "@/features/admin/components/knowledge/SemanticSearchTestModal";

import { getKnowledgeEntriesAction, deleteKnowledgeEntryAction } from "../../actions/knowledge";

import type { ChatbotKnowledgeEntry, SupportedLocale } from "../../types/knowledge";
function formatTextValue(val: unknown, currentLocale: string = "de"): string {
	if (val === null || val === undefined) return "";
	if (typeof val === "string") {
		const trimmed = val.trim();
		if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
			try {
				const parsed = JSON.parse(trimmed);
				return formatTextValue(parsed, currentLocale);
			} catch {
				return val;
			}
		}
		return val;
	}
	if (typeof val === "number" || typeof val === "boolean") return String(val);
	if (typeof val === "object" && val !== null) {
		const obj = val as Record<string, unknown>;
		if (obj[currentLocale] && typeof obj[currentLocale] === "string") return obj[currentLocale];
		if (obj.de && typeof obj.de === "string") return obj.de;
		if (obj.el && typeof obj.el === "string") return obj.el;
		if (obj.en && typeof obj.en === "string") return obj.en;
		if (obj.title && typeof obj.title === "string") return obj.title;
		if (obj.topic && typeof obj.topic === "string") return obj.topic;
		if (obj.category && typeof obj.category === "string") return obj.category;
		return JSON.stringify(obj);
	}
	return String(val);
}

export function KnowledgeList() {
	const t = useTranslations("Admin.chatbotKb");
	const [entries, setEntries] = useState<ChatbotKnowledgeEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [localeFilter, setLocaleFilter] = useState<SupportedLocale | "all">("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [isWizardOpen, setIsWizardOpen] = useState(false);
	const [isSearchTestOpen, setIsSearchTestOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

	const fetchEntries = async () => {
		const result = await getKnowledgeEntriesAction(localeFilter, categoryFilter);
		if (result.success && result.data) {
			setEntries(result.data);
		}
		setLoading(false);
	};

	useEffect(() => {
		let isMounted = true;
		getKnowledgeEntriesAction(localeFilter, categoryFilter).then((result) => {
			if (isMounted) {
				if (result.success && result.data) {
					setEntries(result.data);
				}
				setLoading(false);
			}
		});
		return () => {
			isMounted = false;
		};
	}, [localeFilter, categoryFilter]);

	const handleDelete = async (id: string) => {
		setIsDeleting(id);
		const result = await deleteKnowledgeEntryAction(id);
		if (result.success) {
			await fetchEntries();
		} else {
			alert(result.error || t("deleteError"));
		}
		setIsDeleting(null);
		setDeleteConfirmId(null);
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
						<option value="general">{t("categories.general")}</option>
					</select>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => setIsSearchTestOpen(true)}
						className="flex items-center gap-2 rounded-md border border-purple-500/30 bg-purple-950/20 px-4 py-2 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-950/40"
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

			{/* List */}
			<div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
				{loading ? (
					<div className="py-8 text-center text-sm text-neutral-500">{t("loading")}</div>
				) : entries.length === 0 ? (
					<div className="py-8 text-center text-sm text-neutral-500">{t("empty")}</div>
				) : (
					<div className="divide-y divide-neutral-800">
						{entries.map((entry) => (
							<div
								key={entry.id}
								className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between"
							>
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<span className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300 uppercase">
											{formatTextValue(entry.language, localeFilter)}
										</span>
										<span className="rounded bg-purple-950/30 px-2 py-0.5 text-xs font-medium text-purple-400">
											{formatTextValue(
												entry.metadata?.category || entry.metadata?.topic || "general",
												localeFilter,
											)}
										</span>
										<h4 className="text-sm font-semibold text-white">
											{formatTextValue(
												entry.metadata?.title || entry.metadata?.topic || entry.metadata?.name,
												localeFilter,
											)}
										</h4>
									</div>
									<p className="line-clamp-2 text-sm text-neutral-400">
										{formatTextValue(entry.content, localeFilter)}
									</p>
								</div>
								<div className="flex shrink-0 gap-2">
									<button
										onClick={() => setDeleteConfirmId(entry.id)}
										disabled={isDeleting === entry.id}
										className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-red-950/30 hover:text-red-400 disabled:opacity-50"
										title="Delete"
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
				title={t("deleteConfirmTitle")}
				description={t("deleteConfirmDesc")}
				onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
				onClose={() => setDeleteConfirmId(null)}
				isLoading={isDeleting !== null}
				variant="danger"
			/>
		</div>
	);
}
