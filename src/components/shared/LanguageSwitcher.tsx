"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export const LanguageSwitcher = () => {
	const t = useTranslations("LanguageSwitcher");
	const locale = useLocale();
	const pathname = usePathname();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isOpen, setIsOpen] = useState(false);

	const handleChange = (nextLocale: string) => {
		startTransition(() => {
			router.replace(pathname, { locale: nextLocale });
			setIsOpen(false);
		});
	};

	const currentName = t(`locales.${locale}.short`);

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#201f1f] px-3 py-2 text-sm font-medium text-[#ccc3d9] transition-colors hover:text-[#e5e2e1]"
				aria-label={t("label")}
				aria-expanded={isOpen}
			>
				<Globe className="size-4" />
				<span className="font-bold">{currentName}</span>
				<ChevronDown className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
			</button>

			<AnimatePresence>
				{isOpen ? (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.15 }}
						className="absolute right-0 mt-2 w-32 overflow-hidden rounded-lg border border-white/10 bg-[#201f1f] shadow-lg"
					>
						{routing.locales.map((loc) => {
							const isActive = loc === locale;
							const name = t(`locales.${loc}.full`);
							return (
								<button
									type="button"
									key={loc}
									onClick={() => handleChange(loc)}
									disabled={isPending || isActive}
									className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
										isActive
											? "bg-[#7b2dff] text-white"
											: "text-[#ccc3d9] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]"
									} disabled:cursor-not-allowed disabled:opacity-60`}
									title={name}
								>
									{t(`locales.${loc}.short`)} — {name}
								</button>
							);
						})}
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	);
};
