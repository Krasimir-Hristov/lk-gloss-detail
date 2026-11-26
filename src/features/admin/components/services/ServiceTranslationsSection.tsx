"use client";

import { ChevronDown, ChevronUp, Languages } from "lucide-react";
import React from "react";

import type { ServiceLocale } from "@/features/admin/schemas/servicesSchema";

const SUPPORTED_LOCALES: readonly ServiceLocale[] = ["de", "en", "el"];

interface ServiceTranslationsSectionProps {
	isExpanded: boolean;
	nameOverrides: Record<ServiceLocale, string>;
	descOverrides: Record<ServiceLocale, string>;
	t: (key: string) => string;
	onToggle: () => void;
	onNameChange: (locale: ServiceLocale, value: string) => void;
	onDescChange: (locale: ServiceLocale, value: string) => void;
}

export const ServiceTranslationsSection: React.FC<ServiceTranslationsSectionProps> = ({
	isExpanded,
	nameOverrides,
	descOverrides,
	t,
	onToggle,
	onNameChange,
	onDescChange,
}) => (
	<div className="rounded-xl border border-neutral-800 bg-neutral-950/60">
		<button
			type="button"
			onClick={onToggle}
			aria-expanded={isExpanded}
			aria-label={t("form.translations.toggle")}
			className="flex w-full cursor-pointer items-center justify-between p-4 text-left text-xs font-semibold text-purple-300 transition-colors hover:text-purple-200"
		>
			<span className="flex items-center gap-2">
				<Languages className="h-4 w-4" />
				{t("form.translations.toggle")}
			</span>
			{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
		</button>
		{isExpanded ? (
			<div className="space-y-4 border-t border-neutral-800 p-4 text-xs">
				<p className="text-neutral-400">{t("form.translations.hint")}</p>
				{SUPPORTED_LOCALES.map((loc) => (
					<div
						key={loc}
						className="grid grid-cols-1 gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 sm:grid-cols-2"
					>
						<div>
							<label className="mb-1 block font-semibold text-neutral-300 uppercase">
								{t("form.translations.nameLabel")} ({loc})
							</label>
							<input
								type="text"
								value={nameOverrides[loc]}
								onChange={(e) => onNameChange(loc, e.target.value)}
								className="w-full rounded border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-white outline-hidden focus:border-purple-500"
							/>
						</div>
						<div>
							<label className="mb-1 block font-semibold text-neutral-300 uppercase">
								{t("form.translations.descLabel")} ({loc})
							</label>
							<input
								type="text"
								value={descOverrides[loc]}
								onChange={(e) => onDescChange(loc, e.target.value)}
								className="w-full rounded border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-white outline-hidden focus:border-purple-500"
							/>
						</div>
					</div>
				))}
			</div>
		) : null}
	</div>
);
