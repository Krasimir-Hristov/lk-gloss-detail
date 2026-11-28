"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import * as React from "react";

export const CookieConsentBanner: React.FC = () => {
	const t = useTranslations("CookieConsent");
	const locale = useLocale();
	const [isVisible, setIsVisible] = React.useState<boolean>(false);

	React.useEffect(() => {
		const consent = localStorage.getItem("cookie-consent");
		if (!consent) {
			const timer = setTimeout(() => {
				setIsVisible(true);
			}, 0);
			return () => clearTimeout(timer);
		}
	}, []);

	const handleAccept = () => {
		localStorage.setItem("cookie-consent", "accepted");
		setIsVisible(false);
	};

	const handleDecline = () => {
		localStorage.setItem("cookie-consent", "declined");
		setIsVisible(false);
	};

	if (!isVisible) {
		return null;
	}

	return (
		<div className="fixed right-3 bottom-3 left-3 z-60 mx-auto max-w-4xl rounded-2xl border border-white/15 bg-[#101018]/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:right-4 sm:bottom-4 sm:left-4 sm:p-5 md:bottom-6 md:p-6">
			<div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between md:gap-4">
				{/* Message */}
				<div className="flex-1 text-xs leading-relaxed text-[#ccc3d9] sm:text-sm">
					<p>
						{t("message")}{" "}
						<Link href={`/${locale}/privacy`} className="text-[#d1bcff] underline hover:text-white">
							{t("privacy")}
						</Link>
						.
					</p>
				</div>

				{/* Buttons */}
				<div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
					<button
						type="button"
						onClick={handleDecline}
						className="flex-1 cursor-pointer rounded-xl border border-white/15 bg-white/3 px-4 py-2.5 text-xs font-semibold text-[#ccc3d9] transition-all hover:border-white/30 hover:bg-white/8 hover:text-white sm:flex-none"
						aria-label={t("decline")}
					>
						{t("decline")}
					</button>
					<button
						type="button"
						onClick={handleAccept}
						className="flex-1 cursor-pointer rounded-xl bg-linear-to-r from-[#7b2dff] to-[#c026ff] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_24px_-6px_rgba(123,45,255,0.55)] transition-all hover:brightness-110 sm:flex-none"
						aria-label={t("accept")}
					>
						{t("accept")}
					</button>
				</div>
			</div>
		</div>
	);
};
