"use client";

import { X, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { z } from "zod";

import { testSemanticSearchAction } from "@/features/admin/actions/knowledge";
import { SupportedLocaleSchema } from "@/features/admin/schemas/knowledge";
import { formatTextValue } from "@/features/admin/utils/format";

import type { SupportedLocale, VectorSearchResult } from "@/features/admin/types/knowledge";

interface SemanticSearchTestModalProps {
	onClose: () => void;
}

const SemanticSearchQuerySchema = z.object({
	query: z.string().trim().min(1),
	locale: SupportedLocaleSchema,
});

export const SemanticSearchTestModal: React.FC<SemanticSearchTestModalProps> = ({ onClose }) => {
	const t = useTranslations("Admin.chatbotKb.testModal");
	const [query, setQuery] = useState("");
	const [locale, setLocale] = useState<SupportedLocale>("de");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<VectorSearchResult[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		const parseResult = SemanticSearchQuerySchema.safeParse({ query, locale });
		if (!parseResult.success) return;

		setLoading(true);
		setError(null);

		try {
			const res = await testSemanticSearchAction(parseResult.data.query, parseResult.data.locale);
			if (res.success && res.data) {
				setResults(res.data);
			} else {
				setError(res.error || t("searchFailed"));
			}
		} catch (err: unknown) {
			setError((err as Error).message || t("searchFailed"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="semantic-search-test-title"
			onClick={onClose}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl"
			>
				{/* Header */}
				<div className="flex shrink-0 items-center justify-between border-b border-neutral-800 p-4">
					<h3 id="semantic-search-test-title" className="text-lg font-semibold text-white">
						{t("title")}
					</h3>
					<button
						onClick={onClose}
						aria-label="Close modal"
						className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Scrollable Body */}
				<div className="flex-1 space-y-4 overflow-y-auto p-6">
					<form onSubmit={handleSearch} className="flex gap-2">
						<select
							value={locale}
							onChange={(e) => setLocale(e.target.value as SupportedLocale)}
							className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
						>
							<option value="de">German (de)</option>
							<option value="el">Greek (el)</option>
							<option value="en">English (en)</option>
						</select>
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={t("placeholder")}
							className="flex-1 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
						/>
						<button
							type="submit"
							disabled={loading || !query.trim()}
							className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
						>
							{loading ? (
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
							) : (
								<Search className="h-4 w-4" />
							)}
							{t("searchButton")}
						</button>
					</form>

					{error ? (
						<div className="rounded-md border border-red-500/20 bg-red-950/30 p-3 text-sm text-red-400">
							{error}
						</div>
					) : null}

					<div className="space-y-4">
						{results.length > 0 ? (
							<h4 className="text-sm font-medium text-neutral-400">{t("topMatches")}</h4>
						) : null}

						{results.length === 0 && !loading && !error && query ? (
							<div className="py-8 text-center text-sm text-neutral-500">{t("noMatches")}</div>
						) : null}

						<div className="space-y-3">
							{results.map((r, i) => (
								<div
									key={r.id}
									className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
								>
									<div className="mb-2 flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-xs font-medium text-neutral-400">
												{i + 1}
											</span>
											<span className="text-sm font-medium text-white">
												{formatTextValue(r.metadata?.title || r.metadata?.topic, locale)}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300 uppercase">
												{r.language}
											</span>
											<span
												className={`rounded px-2 py-0.5 text-xs font-medium ${
													r.similarity > 0.8
														? "bg-green-950/30 text-green-400"
														: r.similarity > 0.7
															? "bg-yellow-950/30 text-yellow-400"
															: "bg-red-950/30 text-red-400"
												}`}
											>
												Sim: {r.similarity.toFixed(3)}
											</span>
										</div>
									</div>
									<p className="text-sm text-neutral-400">{formatTextValue(r.content, locale)}</p>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex shrink-0 items-center justify-end border-t border-neutral-800 bg-neutral-950 p-4">
					<button
						onClick={onClose}
						className="rounded-md border border-neutral-800 bg-neutral-900 px-5 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
					>
						{t("closeButton")}
					</button>
				</div>
			</div>
		</div>
	);
};
