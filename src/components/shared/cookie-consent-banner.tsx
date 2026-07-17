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
		<div className="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-4xl rounded-2xl border border-[#4a4456]/80 bg-[#1a1a2e]/90 p-5 shadow-2xl backdrop-blur-md md:bottom-6 md:p-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				{/* Message */}
				<div className="flex-1 text-sm text-[#ccc3d9]">
					<p>
						{t("message")}{" "}
						<Link href={`/${locale}/privacy`} className="text-[#d1bcff] underline hover:text-white">
							{t("privacy")}
						</Link>
						.
					</p>
				</div>

				{/* Buttons */}
				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={handleDecline}
						className="rounded-xl border border-[#4a4456] bg-transparent px-4 py-2 text-xs font-semibold text-[#ccc3d9] transition-all hover:bg-white/5 hover:text-white"
						aria-label={t("decline")}
					>
						{t("decline")}
					</button>
					<button
						type="button"
						onClick={handleAccept}
						className="rounded-xl bg-[#7b2dff] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#8c47ff] hover:shadow-lg hover:shadow-[#7b2dff]/25"
						aria-label={t("accept")}
					>
						{t("accept")}
					</button>
				</div>
			</div>
		</div>
	);
};
