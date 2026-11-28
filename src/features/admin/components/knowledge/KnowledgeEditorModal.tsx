"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Globe2, Loader2, Save, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { saveKnowledgeEntryAction } from "@/features/admin/actions/knowledge";
import {
	KnowledgeCategorySchema,
	SaveKnowledgeEntrySchema,
	type ChatbotKnowledgeListItem,
	type KnowledgeCategory,
} from "@/features/admin/types/knowledge";
import { formatTextValue } from "@/features/admin/utils/format";

interface KnowledgeEditorModalProps {
	isOpen: boolean;
	entry: ChatbotKnowledgeListItem | null;
	onClose: () => void;
	onSaved: (saved: ChatbotKnowledgeListItem) => void;
}

interface KnowledgeEditorDialogProps {
	entry: ChatbotKnowledgeListItem | null;
	onClose: () => void;
	onSaved: (saved: ChatbotKnowledgeListItem) => void;
}

const CATEGORIES: readonly KnowledgeCategory[] = KnowledgeCategorySchema.options;

const KnowledgeEditorDialog: React.FC<KnowledgeEditorDialogProps> = ({
	entry,
	onClose,
	onSaved,
}) => {
	const t = useTranslations("Admin.chatbotKb");
	const locale = useLocale();

	const [title, setTitle] = useState(() =>
		entry ? formatTextValue(entry.metadata?.title, locale) : "",
	);
	const [category, setCategory] = useState<KnowledgeCategory>(
		() => entry?.metadata?.category ?? "company_policy",
	);
	const [content, setContent] = useState(() =>
		entry ? formatTextValue(entry.content, locale) : "",
	);
	const [keywordsInput, setKeywordsInput] = useState(() =>
		entry && Array.isArray(entry.metadata?.keywords) ? entry.metadata.keywords.join(", ") : "",
	);
	const [isSaving, setIsSaving] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !isSaving) onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isSaving, onClose]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSaving) return;

		const keywords = keywordsInput
			.split(",")
			.map((k) => k.trim())
			.filter((k) => k.length > 0)
			.slice(0, 20);

		const parsed = SaveKnowledgeEntrySchema.safeParse({
			id: entry?.id,
			title,
			category,
			content,
			keywords,
		});

		if (!parsed.success) {
			setErrorMsg(parsed.error.issues[0]?.message ?? t("editor.saveError"));
			return;
		}

		setIsSaving(true);
		setErrorMsg(null);

		try {
			const res = await saveKnowledgeEntryAction(parsed.data);
			if (res.success) {
				onSaved(res.data);
			} else {
				setErrorMsg(res.error ?? t("editor.saveError"));
			}
		} catch (err) {
			console.error("[KnowledgeEditorModal] Save error:", err);
			setErrorMsg(t("editor.saveError"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="knowledge-editor-title"
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
					disabled={isSaving}
					aria-label={t("editor.cancel")}
					className="absolute top-4 right-4 cursor-pointer rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-50"
				>
					<X className="size-5" />
				</button>

				<div className="mb-5 border-b border-neutral-800 pr-8 pb-4">
					<h2 id="knowledge-editor-title" className="Montserrat text-xl font-bold text-white">
						{entry ? t("editor.editTitle") : t("editor.addTitle")}
					</h2>
					<div className="mt-2 flex items-center gap-2 rounded-lg border border-purple-500/25 bg-purple-950/25 px-3 py-2 text-xs text-purple-200">
						<Globe2 className="size-4 shrink-0 text-purple-400" />
						<span>{t("editor.autoReplyHint")}</span>
					</div>
				</div>

				{errorMsg ? (
					<div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-400">
						<AlertCircle className="size-4 shrink-0" />
						<span>{errorMsg}</span>
					</div>
				) : null}

				<form onSubmit={handleSubmit} className="space-y-4 text-sm">
					<div>
						<label htmlFor="kb-title" className="mb-1 block text-xs font-semibold text-neutral-300">
							{t("editor.titleLabel")}
						</label>
						<input
							id="kb-title"
							type="text"
							required
							minLength={2}
							maxLength={160}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t("editor.titlePlaceholder")}
							className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="kb-category"
							className="mb-1 block text-xs font-semibold text-neutral-300"
						>
							{t("editor.categoryLabel")}
						</label>
						<select
							id="kb-category"
							value={category}
							onChange={(e) => setCategory(e.target.value as KnowledgeCategory)}
							aria-label={t("editor.categoryLabel")}
							className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
						>
							{CATEGORIES.map((cat) => (
								<option key={cat} value={cat}>
									{t(`categories.${cat}`)}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor="kb-content"
							className="mb-1 block text-xs font-semibold text-neutral-300"
						>
							{t("editor.contentLabel")}
						</label>
						<textarea
							id="kb-content"
							required
							minLength={10}
							maxLength={4000}
							rows={5}
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder={t("editor.contentPlaceholder")}
							className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="kb-keywords"
							className="mb-1 block text-xs font-semibold text-neutral-300"
						>
							{t("editor.keywordsLabel")}
						</label>
						<input
							id="kb-keywords"
							type="text"
							value={keywordsInput}
							onChange={(e) => setKeywordsInput(e.target.value)}
							placeholder={t("editor.keywordsPlaceholder")}
							className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
						/>
					</div>

					<div className="flex items-center justify-end gap-3 border-t border-neutral-800 pt-4">
						<button
							type="button"
							onClick={onClose}
							disabled={isSaving}
							aria-label={t("editor.cancel")}
							className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800 px-4 py-2 text-xs font-medium text-neutral-200 transition-colors hover:bg-neutral-700 disabled:opacity-50"
						>
							{t("editor.cancel")}
						</button>
						<button
							type="submit"
							disabled={isSaving}
							aria-label={t("editor.saveButton")}
							className="flex cursor-pointer items-center gap-2 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
						>
							{isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
							<span>{isSaving ? t("editor.saving") : t("editor.saveButton")}</span>
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
};

export const KnowledgeEditorModal: React.FC<KnowledgeEditorModalProps> = ({
	isOpen,
	entry,
	onClose,
	onSaved,
}) => (
	<AnimatePresence>
		{isOpen ? (
			<KnowledgeEditorDialog
				key={entry?.id ?? "new"}
				entry={entry}
				onClose={onClose}
				onSaved={onSaved}
			/>
		) : null}
	</AnimatePresence>
);
