import { MessageSquare, Phone, MessageCircle, ArrowRight } from "lucide-react";
import React from "react";

import { DATE_LOCALE_MAP, resolveAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/routing";

import type { AdminMessage } from "@/features/admin/types/messagesTypes";

interface RecentMessagesWidgetProps {
	messages: AdminMessage[];
	locale: string;
	t: (key: string) => string;
}

const sanitizeTel = (phone: string): string => phone.replace(/[^\d+]/g, "");

const toWhatsappUrl = (phone: string): string | null => {
	let digits = phone.replace(/\D/g, "");
	if (!digits) return null;
	if (digits.startsWith("00")) {
		digits = digits.slice(2);
	} else if (digits.startsWith("0")) {
		digits = `49${digits.slice(1)}`;
	}
	return `https://wa.me/${digits}`;
};

export const RecentMessagesWidget: React.FC<RecentMessagesWidgetProps> = ({
	messages,
	locale,
	t,
}) => {
	const visibleMessages = messages.slice(0, 5);
	const dateLocale = DATE_LOCALE_MAP[resolveAppLocale(locale)];

	return (
		<section
			className="rounded-xl border border-neutral-800 bg-neutral-900 p-6"
			aria-label={t("recentMessages.title")}
		>
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-purple-500/10 p-2">
						<MessageSquare className="h-5 w-5 text-purple-400" />
					</div>
					<div>
						<h2 className="Montserrat text-lg font-bold text-white">{t("recentMessages.title")}</h2>
						<p className="text-xs text-neutral-500">{t("recentMessages.subtitle")}</p>
					</div>
				</div>

				<Link
					href="/admin/messages"
					aria-label={t("recentMessages.viewAll")}
					className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-purple-300 transition-colors hover:border-purple-500/40 hover:text-white"
				>
					<span>{t("recentMessages.viewAll")}</span>
					<ArrowRight className="h-3.5 w-3.5" />
				</Link>
			</div>

			{visibleMessages.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-700 py-10 text-center">
					<MessageSquare className="mb-3 h-10 w-10 text-neutral-600" />
					<p className="text-sm text-neutral-500">{t("recentMessages.empty")}</p>
				</div>
			) : (
				<div className="space-y-3">
					{visibleMessages.map((msg) => {
						const telTarget = sanitizeTel(msg.phone);
						const waUrl = toWhatsappUrl(msg.phone);
						const dateLabel = new Date(msg.created_at).toLocaleDateString(dateLocale, {
							day: "2-digit",
							month: "short",
							hour: "2-digit",
							minute: "2-digit",
						});

						return (
							<div
								key={msg.id}
								className="flex flex-col gap-3 rounded-lg border border-purple-500/20 bg-neutral-950 p-4 transition-colors hover:border-purple-500/40 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="min-w-0 flex-1 space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<span className="inline-block h-2 w-2 rounded-full bg-purple-400" />
										<p className="text-sm font-semibold text-white">{msg.name}</p>
										<span className="text-xs text-neutral-500">• {dateLabel}</span>
									</div>
									<p className="line-clamp-2 text-xs text-neutral-400">{msg.message}</p>
								</div>

								<div className="flex shrink-0 flex-wrap items-center gap-2">
									{telTarget ? (
										<a
											href={`tel:${telTarget}`}
											aria-label={`${t("actions.call")} ${msg.name}`}
											className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:border-emerald-500/45 hover:bg-emerald-500/20"
										>
											<Phone className="h-3.5 w-3.5" />
											<span>{t("actions.call")}</span>
										</a>
									) : null}
									{waUrl ? (
										<a
											href={waUrl}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={`${t("actions.whatsapp")} ${msg.name}`}
											className="inline-flex items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#25D366] transition-colors hover:border-[#25D366]/50 hover:bg-[#25D366]/20"
										>
											<MessageCircle className="h-3.5 w-3.5" />
											<span>WhatsApp</span>
										</a>
									) : null}
									<Link
										href="/admin/messages"
										aria-label={`${t("recentMessages.openInbox")}: ${msg.name}`}
										className="inline-flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors hover:border-purple-500/40 hover:text-white"
									>
										<span>{t("recentMessages.openInbox")}</span>
									</Link>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
};
