import { HelpCircle, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { Link } from "@/i18n/routing";

const NotFoundPage: React.FC = () => {
	const t = useTranslations("Errors.notFound");

	return (
		<section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
			<div className="relative mx-auto flex max-w-lg flex-col items-center gap-6 rounded-2xl border border-[#353534] bg-[#201f1f] p-8 shadow-xl sm:p-12">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7b2dff]/15 text-[#d1bcff]">
					<HelpCircle className="h-8 w-8" aria-hidden="true" />
				</div>

				<h1 className="font-['Montserrat'] text-2xl font-bold text-white sm:text-3xl">
					{t("title")}
				</h1>

				<p className="text-sm leading-relaxed text-[#ccc3d9] sm:text-base">{t("description")}</p>

				<Link
					href="/"
					aria-label={t("backHome")}
					className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] to-[#b303f2] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#7b2dff]/25 transition-all hover:bg-[#7b2dff]/90 active:scale-95"
				>
					<Home className="h-4 w-4" aria-hidden="true" />
					<span>{t("backHome")}</span>
				</Link>
			</div>
		</section>
	);
};

export default NotFoundPage;
