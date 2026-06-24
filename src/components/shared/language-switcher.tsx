"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

const localeNames: Record<string, string> = {
	de: "DE",
	en: "EN",
	el: "ΕΛ",
};

const localeFullNames: Record<string, string> = {
	de: "Deutsch",
	en: "English",
	el: "Ελληνικά",
};

export function LanguageSwitcher() {
	const locale = useLocale();
	const pathname = usePathname();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleChange(nextLocale: string) {
		startTransition(() => {
			router.replace(pathname, { locale: nextLocale });
		});
	}

	return (
		<div className="relative inline-flex min-w-[8rem] items-center gap-1 rounded-lg border border-[#353534] bg-[#201f1f] p-0.5">
			{routing.locales.map((loc) => {
				const isActive = loc === locale;
				return (
					<button
						key={loc}
						onClick={() => handleChange(loc)}
						disabled={isPending || isActive}
						className={`inline-flex min-h-[2rem] min-w-[2.5rem] touch-manipulation items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-all select-none ${
							isActive
								? "bg-[#7b2dff] text-white shadow-sm"
								: "text-[#ccc3d9] hover:bg-[#2a2a2a] hover:text-[#e5e2e1] active:bg-[#353534]"
						} disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0 sm:min-w-0 sm:px-2.5 sm:py-1`}
						title={localeFullNames[loc]}
						aria-label={localeFullNames[loc]}
					>
						{localeNames[loc]}
					</button>
				);
			})}
		</div>
	);
}
