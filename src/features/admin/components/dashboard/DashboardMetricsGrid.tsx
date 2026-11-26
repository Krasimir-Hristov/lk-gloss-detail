import { CalendarDays, Clock, MessageSquare, AlertCircle, ArrowUpRight } from "lucide-react";
import React from "react";

import { Link } from "@/i18n/routing";

interface MetricCardProps {
	href: string;
	title: string;
	value: number;
	description: string;
	accentBarClass: string;
	iconBgClass: string;
	icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
	href,
	title,
	value,
	description,
	accentBarClass,
	iconBgClass,
	icon,
}) => (
	<Link
		href={href}
		aria-label={`${title}: ${value}`}
		className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg transition-all duration-300 hover:border-purple-500/40 hover:bg-neutral-900/90 hover:shadow-xl"
	>
		<div className={`absolute top-0 left-0 h-full w-1 ${accentBarClass}`} />
		<div className="flex items-start justify-between gap-3">
			<div className="min-w-0">
				<h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
					<span className="truncate">{title}</span>
					<ArrowUpRight className="size-3.5 shrink-0 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-purple-400" />
				</h3>
				<p className="Montserrat mt-2.5 text-3xl font-extrabold text-white">{value}</p>
				<span className="mt-1.5 block truncate text-xs text-neutral-500">{description}</span>
			</div>
			<div
				className={`shrink-0 rounded-lg p-2.5 transition-opacity group-hover:opacity-100 ${iconBgClass}`}
			>
				{icon}
			</div>
		</div>
	</Link>
);

interface DashboardMetricsGridProps {
	pendingCount: number;
	unreadMessagesCount: number;
	todayCount: number;
	upcomingCount: number;
	t: (key: string) => string;
}

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({
	pendingCount,
	unreadMessagesCount,
	todayCount,
	upcomingCount,
	t,
}) => (
	<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<MetricCard
			href="/admin/appointments?status=pending"
			title={t("cards.pending.title")}
			value={pendingCount}
			description={t("cards.pending.desc")}
			accentBarClass="bg-linear-to-b from-amber-500 to-red-500"
			iconBgClass="bg-linear-to-br from-amber-500/15 to-red-500/15"
			icon={<AlertCircle className="h-5 w-5 text-amber-400" />}
		/>
		<MetricCard
			href="/admin/messages?status=unread"
			title={t("cards.unreadMessages.title")}
			value={unreadMessagesCount}
			description={t("cards.unreadMessages.desc")}
			accentBarClass="bg-linear-to-b from-purple-500 to-pink-500"
			iconBgClass="bg-linear-to-br from-purple-500/15 to-pink-500/15"
			icon={<MessageSquare className="h-5 w-5 text-purple-400" />}
		/>
		<MetricCard
			href="/admin/appointments"
			title={t("cards.today.title")}
			value={todayCount}
			description={t("cards.today.desc")}
			accentBarClass="bg-linear-to-b from-cyan-400 to-blue-500"
			iconBgClass="bg-linear-to-br from-cyan-400/15 to-blue-500/15"
			icon={<Clock className="h-5 w-5 text-cyan-400" />}
		/>
		<MetricCard
			href="/admin/appointments"
			title={t("cards.upcoming.title")}
			value={upcomingCount}
			description={t("cards.upcoming.desc")}
			accentBarClass="bg-linear-to-b from-emerald-500 to-cyan-500"
			iconBgClass="bg-linear-to-br from-emerald-500/15 to-cyan-500/15"
			icon={<CalendarDays className="h-5 w-5 text-emerald-400" />}
		/>
	</div>
);
