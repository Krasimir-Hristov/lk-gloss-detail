"use client";

import { X, Sparkles, FileText, CheckCircle2, AlertTriangle, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { z } from "zod";

import { aiAgentProcessAction, saveBatchKnowledgeAction } from "@/features/admin/actions/knowledge";
import { formatTextValue } from "@/features/admin/utils/format";

import type { SupportedLocale } from "@/features/admin/schemas/knowledge";
import type { AiKnowledgeStructure } from "@/features/admin/types/knowledge";

interface AiKnowledgeWizardProps {
	onClose: () => void;
	onSuccess: () => void;
}

type TabMode = "form" | "company";

const ServiceInputFormSchema = z.object({
	serviceTitle: z.string().trim().min(1, "errTitle"),
	servicePrice: z.string().trim().min(1, "errPrice"),
	serviceDuration: z.string().trim().min(1, "errDuration"),
	description: z.string().trim().min(1, "errDescription"),
	requirements: z.string().optional(),
	category: z.string(),
});

const CompanyInfoFormSchema = z.object({
	companyInfoText: z.string().trim().min(1, "errCompanyInfo"),
});

export const AiKnowledgeWizard: React.FC<AiKnowledgeWizardProps> = ({ onClose, onSuccess }) => {
	const t = useTranslations("Admin.chatbotKb.wizard");
	const tCategories = useTranslations("Admin.chatbotKb.categories");
	const [activeTab, setActiveTab] = useState<TabMode>("form");

	// Service Form Inputs
	const [serviceTitle, setServiceTitle] = useState("");
	const [category, setCategory] = useState("interior");
	const [servicePrice, setServicePrice] = useState("");
	const [serviceDuration, setServiceDuration] = useState("");
	const [description, setDescription] = useState("");
	const [requirements, setRequirements] = useState("");

	// Company Info / Policy Input
	const [companyInfoText, setCompanyInfoText] = useState("");

	// Loading state & Errors
	const [isProcessing, setIsProcessing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Step 2: Result Data
	const [generatedStructure, setGeneratedStructure] = useState<AiKnowledgeStructure | null>(null);
	const [reviewLocale, setReviewLocale] = useState<SupportedLocale>("de");

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	const handleProcessWithAgent = async () => {
		setError(null);
		setIsProcessing(true);

		try {
			let combinedPrompt = "";

			if (activeTab === "form") {
				const parseResult = ServiceInputFormSchema.safeParse({
					serviceTitle,
					servicePrice,
					serviceDuration,
					description,
					requirements,
					category,
				});

				if (!parseResult.success) {
					const firstErrorKey = parseResult.error.issues[0]?.message;
					throw new Error(firstErrorKey ? t(firstErrorKey as "errTitle") : t("genericError"));
				}

				const data = parseResult.data;
				combinedPrompt = `
NEW SERVICE DETAILS:
- Service Name: ${data.serviceTitle}
- Category: ${data.category}
- Price: ${data.servicePrice}
- Working Duration: ${data.serviceDuration}
- Detailed Description & Included Steps: ${data.description}
${data.requirements ? `- Special Rules & Conditions: ${data.requirements}` : ""}
`.trim();
			} else {
				const parseResult = CompanyInfoFormSchema.safeParse({ companyInfoText });
				if (!parseResult.success) {
					const firstErrorKey = parseResult.error.issues[0]?.message;
					throw new Error(firstErrorKey ? t(firstErrorKey as "errCompanyInfo") : t("genericError"));
				}

				combinedPrompt = `
COMPANY GENERAL INFORMATION / POLICY:
Category: company_policy
Details: ${parseResult.data.companyInfoText}
`.trim();
			}

			const res = await aiAgentProcessAction({ mode: "free_form", inputText: combinedPrompt });
			if (!res.success) throw new Error(res.error);

			setGeneratedStructure(res.data as AiKnowledgeStructure);
		} catch (err: unknown) {
			setError((err as Error).message || t("genericError"));
		} finally {
			setIsProcessing(false);
		}
	};

	const handleSave = async () => {
		if (!generatedStructure) return;
		setIsSaving(true);
		setError(null);
		try {
			const res = await saveBatchKnowledgeAction(generatedStructure);
			if (res.success) {
				onSuccess();
			} else {
				throw new Error(res.error);
			}
		} catch (err: unknown) {
			setError((err as Error).message || t("genericError"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="ai-wizard-title"
			onClick={onClose}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl"
			>
				{/* Header */}
				<div className="flex shrink-0 items-center justify-between border-b border-neutral-800 p-4">
					<div className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-purple-400" />
						<h3 id="ai-wizard-title" className="text-lg font-semibold text-white">
							{t("title")}
						</h3>
					</div>
					<button
						onClick={onClose}
						aria-label="Close modal"
						className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="flex flex-1 overflow-hidden">
					{/* Left Panel: Inputs (Hide if generated) */}
					{!generatedStructure ? (
						<div className="w-full flex-col overflow-y-auto p-6">
							{/* Mode Tabs */}
							<div className="mb-6 flex space-x-1 rounded-lg bg-neutral-900/50 p-1">
								<button
									onClick={() => setActiveTab("form")}
									className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${
										activeTab === "form"
											? "bg-purple-600 text-white shadow"
											: "text-neutral-400 hover:text-white"
									}`}
								>
									<FileText className="h-4 w-4" />
									{t("serviceForm")}
								</button>
								<button
									onClick={() => setActiveTab("company")}
									className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${
										activeTab === "company"
											? "bg-purple-600 text-white shadow"
											: "text-neutral-400 hover:text-white"
									}`}
								>
									<Building2 className="h-4 w-4" />
									{t("companyInfo")}
								</button>
							</div>

							<div className="space-y-4">
								{activeTab === "form" ? (
									<div className="space-y-4">
										{/* Row 1: Title & Category */}
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<div>
												<label className="mb-1 block text-sm font-medium text-neutral-300">
													{t("serviceTitleLabel")} <span className="text-red-400">*</span>
												</label>
												<input
													type="text"
													value={serviceTitle}
													onChange={(e) => setServiceTitle(e.target.value)}
													className="w-full rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none focus:border-purple-500"
													placeholder={t("serviceTitlePlaceholder")}
												/>
											</div>

											<div>
												<label className="mb-1 block text-sm font-medium text-neutral-300">
													{t("categoryLabel")}
												</label>
												<select
													value={category}
													onChange={(e) => setCategory(e.target.value)}
													className="w-full rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none focus:border-purple-500"
												>
													<option value="interior">{tCategories("interior")}</option>
													<option value="exterior">{tCategories("exterior")}</option>
													<option value="paint_correction">
														{tCategories("paint_correction")}
													</option>
													<option value="headlights_special">
														{tCategories("headlights_special")}
													</option>
												</select>
											</div>
										</div>

										{/* Row 2: Price & Duration (Mandatory) */}
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<div>
												<label className="mb-1 block text-sm font-medium text-neutral-300">
													{t("priceLabel")} <span className="text-red-400">*</span>
												</label>
												<input
													type="text"
													value={servicePrice}
													onChange={(e) => setServicePrice(e.target.value)}
													className="w-full rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none focus:border-purple-500"
													placeholder={t("pricePlaceholder")}
												/>
											</div>

											<div>
												<label className="mb-1 block text-sm font-medium text-neutral-300">
													{t("durationLabel")} <span className="text-red-400">*</span>
												</label>
												<input
													type="text"
													value={serviceDuration}
													onChange={(e) => setServiceDuration(e.target.value)}
													className="w-full rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none focus:border-purple-500"
													placeholder={t("durationPlaceholder")}
												/>
											</div>
										</div>

										{/* Row 3: Description */}
										<div>
											<label className="mb-1 block text-sm font-medium text-neutral-300">
												{t("descriptionLabel")} <span className="text-red-400">*</span>
											</label>
											<textarea
												value={description}
												onChange={(e) => setDescription(e.target.value)}
												rows={4}
												className="w-full rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none focus:border-purple-500"
												placeholder={t("descriptionPlaceholder")}
											/>
										</div>

										{/* Row 4: Requirements */}
										<div>
											<label className="mb-1 block text-sm font-medium text-neutral-300">
												{t("requirementsLabel")}
											</label>
											<textarea
												value={requirements}
												onChange={(e) => setRequirements(e.target.value)}
												rows={3}
												className="w-full rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none focus:border-purple-500"
												placeholder={t("requirementsPlaceholder")}
											/>
										</div>
									</div>
								) : null}

								{activeTab === "company" ? (
									<div>
										<label className="mb-2 block text-sm font-medium text-neutral-300">
											{t("companyInfoLabel")}
										</label>
										<textarea
											value={companyInfoText}
											onChange={(e) => setCompanyInfoText(e.target.value)}
											rows={8}
											className="w-full rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none focus:border-purple-500"
											placeholder={t("companyInfoPlaceholder")}
										/>
									</div>
								) : null}

								{error ? (
									<div className="rounded-md border border-red-500/20 bg-red-950/30 p-3 text-sm text-red-400">
										{error}
									</div>
								) : null}

								<button
									onClick={handleProcessWithAgent}
									disabled={isProcessing}
									className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-purple-500 disabled:opacity-50"
								>
									{isProcessing ? (
										<>
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
											{t("formatting")}
										</>
									) : (
										<>
											<Sparkles className="h-4 w-4" />
											{t("formatButton")}
										</>
									)}
								</button>
							</div>
						</div>
					) : null}

					{/* Right Panel: Review & Save */}
					{generatedStructure ? (
						<div className="flex w-full flex-col p-6">
							<div className="mb-4 flex items-center justify-between">
								<div>
									<h4 className="text-lg font-bold text-white">{t("reviewTitle")}</h4>
									<div className="mt-1 flex items-center gap-2">
										<span className="rounded bg-purple-950/30 px-2 py-0.5 text-xs font-medium text-purple-400">
											Category: {formatTextValue(generatedStructure.category)}
										</span>
									</div>
								</div>
								<button
									onClick={() => setGeneratedStructure(null)}
									className="text-sm font-medium text-neutral-400 hover:text-white"
								>
									{t("backToInput")}
								</button>
							</div>

							{generatedStructure.missingInfoPrompt ? (
								<div className="mb-4 flex gap-3 rounded-md border border-amber-500/20 bg-amber-950/30 p-4 text-sm text-amber-200">
									<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
									<div>
										<p className="font-semibold text-amber-500">{t("aiClarification")}</p>
										<p className="mt-1">{generatedStructure.missingInfoPrompt}</p>
									</div>
								</div>
							) : null}

							{/* Locale Tabs */}
							<div className="mb-4 flex gap-2 border-b border-neutral-800 pb-2">
								{(["de", "el", "en"] as SupportedLocale[]).map((loc) => (
									<button
										key={loc}
										onClick={() => setReviewLocale(loc)}
										className={`rounded-md px-4 py-2 text-sm font-medium uppercase transition-colors ${
											reviewLocale === loc
												? "bg-purple-600 text-white"
												: "text-neutral-500 hover:text-white"
										}`}
									>
										{loc}
									</button>
								))}
							</div>

							{/* Tab Content */}
							<div className="flex-1 space-y-4 overflow-y-auto">
								<div>
									<label className="mb-1 block text-xs font-medium text-neutral-400">
										{t("titleLabel")}
									</label>
									<input
										type="text"
										readOnly
										value={generatedStructure.entries[reviewLocale].title}
										className="w-full rounded-md border border-neutral-800 bg-neutral-900/50 p-3 text-sm text-white outline-none"
									/>
								</div>
								<div>
									<label className="mb-1 block text-xs font-medium text-neutral-400">
										{t("contentLabel")}
									</label>
									<textarea
										readOnly
										value={generatedStructure.entries[reviewLocale].content}
										rows={8}
										className="w-full rounded-md border border-neutral-800 bg-neutral-900/50 p-3 text-sm text-white outline-none"
									/>
								</div>
								<div>
									<label className="mb-1 block text-xs font-medium text-neutral-400">
										{t("keywordsLabel")}
									</label>
									<div className="flex flex-wrap gap-2">
										{generatedStructure.entries[reviewLocale].keywords.map(
											(kw: string, idx: number) => (
												<span
													key={idx}
													className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300"
												>
													{kw}
												</span>
											),
										)}
									</div>
								</div>
							</div>

							<div className="mt-6 flex gap-4 border-t border-neutral-800 pt-4">
								{error ? (
									<div className="flex-1 rounded-md border border-red-500/20 bg-red-950/30 p-3 text-sm text-red-400">
										{error}
									</div>
								) : null}
								<button
									onClick={handleSave}
									disabled={isSaving}
									className="ml-auto flex shrink-0 items-center gap-2 rounded-md bg-purple-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
								>
									{isSaving ? (
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
									) : (
										<CheckCircle2 className="h-4 w-4" />
									)}
									{t("saveButton")}
								</button>
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
};
