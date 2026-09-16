"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";

interface LocaleErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

const LocaleError: React.FC<LocaleErrorProps> = ({ error, reset }) => {
	const t = useTranslations("Errors.global");

	useEffect(() => {
		// Log error for internal monitoring
		console.error("[LocaleError Boundary caught error]:", error);
	}, [error]);

	return (
		<section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
			<div className="relative mx-auto flex max-w-lg flex-col items-center gap-6 rounded-2xl border border-[#7b2dff]/30 bg-linear-to-b from-[#201f1f] to-[#141414] p-8 shadow-2xl sm:p-12">
				{/* Glowing indicator */}
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
					<AlertTriangle className="h-8 w-8" aria-hidden="true" />
				</div>

				<h1 className="font-['Montserrat'] text-2xl font-bold text-white sm:text-3xl">
					{t("title")}
				</h1>

				<p className="text-sm leading-relaxed text-[#ccc3d9] sm:text-base">{t("description")}</p>

				<div className="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
					<Button
						type="button"
						onClick={reset}
						aria-label={t("retry")}
						className="inline-flex items-center justify-center gap-2 bg-linear-to-r from-[#7b2dff] to-[#b303f2] px-6 py-5 text-base font-bold text-white hover:shadow-[0_0_25px_rgba(123,45,255,0.4)] active:scale-95"
					>
						<RefreshCw className="h-4 w-4" aria-hidden="true" />
						<span>{t("retry")}</span>
					</Button>

					<Link
						href="/"
						aria-label={t("backHome")}
						className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 active:scale-95"
					>
						<Home className="h-4 w-4 text-[#d1bcff]" aria-hidden="true" />
						<span>{t("backHome")}</span>
					</Link>
				</div>
			</div>
		</section>
	);
};

export default LocaleError;
