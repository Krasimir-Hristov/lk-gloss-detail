"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { routing } from "@/i18n/routing";

export const LanguageSwitcher = () => {
	const t = useTranslations("LanguageSwitcher");
	const locale = useLocale();
	const [isNavigating, setIsNavigating] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		const handleMouseDown = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleMouseDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleMouseDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const handleChange = (nextLocale: string) => {
		setIsNavigating(true);
		setIsOpen(false);

		const url = new URL(window.location.href);
		const normalizedPath = url.pathname.replace(/^\/+|\/+$/g, "");
		const segments = normalizedPath ? normalizedPath.split("/") : [];

		if (segments.length > 0 && (routing.locales as readonly string[]).includes(segments[0])) {
			segments[0] = nextLocale;
		} else {
			segments.unshift(nextLocale);
		}

		url.pathname = `/${segments.join("/")}`;
		url.hash = "";
		window.location.assign(url.toString());
	};

	const currentName = t(`locales.${locale}.short`);

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-2.5 py-2 font-mono text-xs font-medium text-[#d5d0e3] transition-all hover:border-[#7b2dff]/50 hover:bg-white/8 hover:text-white sm:gap-2 sm:px-3"
				aria-label={t("label")}
				aria-expanded={isOpen}
			>
				<Globe className="size-3.5 text-[#d1bcff]" />
				<span className="font-bold tracking-wider">{currentName}</span>
				<ChevronDown className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
			</button>

			<AnimatePresence>
				{isOpen ? (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.98 }}
						transition={{ duration: 0.15 }}
						className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0d0d14]/95 p-1 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
					>
						{routing.locales.map((loc) => {
							const isActive = loc === locale;
							const name = t(`locales.${loc}.full`);
							return (
								<button
									type="button"
									key={loc}
									onClick={() => handleChange(loc)}
									disabled={isNavigating || isActive}
									className={`block w-full cursor-pointer rounded-lg px-3 py-2 text-left font-mono text-xs transition-colors ${
										isActive
											? "bg-linear-to-r from-[#7b2dff] to-[#a855f7] font-bold text-white"
											: "text-[#ccc3d9] hover:bg-white/6 hover:text-white"
									} disabled:cursor-not-allowed disabled:opacity-75`}
									title={name}
									aria-label={name}
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
