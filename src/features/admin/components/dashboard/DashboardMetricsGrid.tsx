import {
	CalendarDays,
	Clock,
	MessageSquare,
	Wrench,
	BrainCircuit,
	AlertCircle,
} from "lucide-react";
import React from "react";

interface MetricCardProps {
	title: string;
	value: number;
	description: string;
	gradientFrom: string;
	gradientTo: string;
	icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
	title,
	value,
	description,
	gradientFrom,
	gradientTo,
	icon,
}) => (
	<div className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg transition-all duration-300 hover:border-neutral-700 hover:shadow-xl">
		<div
			className="absolute top-0 left-0 h-full w-1"
			style={{
				background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
			}}
		/>
		<div className="flex items-start justify-between">
			<div>
				<h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">{title}</h3>
				<p className="Montserrat mt-3 text-4xl font-extrabold text-white">{value}</p>
				<span className="mt-2 block text-xs text-neutral-500">{description}</span>
			</div>
			<div
				className="rounded-lg p-2.5 opacity-60 transition-opacity group-hover:opacity-100"
				style={{
					background: `linear-gradient(135deg, ${gradientFrom}20, ${gradientTo}20)`,
				}}
			>
				{icon}
			</div>
		</div>
	</div>
);

interface DashboardMetricsGridProps {
	totalAppointments: number;
	todayCount: number;
	upcomingCount: number;
	pendingCount: number;
	monthlySubmissions: number;
	activeServices: number;
	knowledgeChunks: number;
	t: (key: string) => string;
}

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({
	totalAppointments,
	todayCount,
	upcomingCount,
	pendingCount,
	monthlySubmissions,
	activeServices,
	knowledgeChunks,
	t,
}) => (
	<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<MetricCard
			title={t("cards.appointments.title")}
			value={totalAppointments}
			description={t("cards.appointments.desc")}
			gradientFrom="#a855f7"
			gradientTo="#6366f1"
			icon={<CalendarDays className="h-5 w-5 text-purple-400" />}
		/>
		<MetricCard
			title={t("cards.today.title")}
			value={todayCount}
			description={t("cards.today.desc")}
			gradientFrom="#22d3ee"
			gradientTo="#3b82f6"
			icon={<Clock className="h-5 w-5 text-cyan-400" />}
		/>
		<MetricCard
			title={t("cards.pending.title")}
			value={pendingCount}
			description={t("cards.pending.desc")}
			gradientFrom="#f59e0b"
			gradientTo="#ef4444"
			icon={<AlertCircle className="h-5 w-5 text-amber-400" />}
		/>
		<MetricCard
			title={t("cards.upcoming.title")}
			value={upcomingCount}
			description={t("cards.upcoming.desc")}
			gradientFrom="#10b981"
			gradientTo="#06b6d4"
			icon={<CalendarDays className="h-5 w-5 text-emerald-400" />}
		/>
		<MetricCard
			title={t("cards.contact.title")}
			value={monthlySubmissions}
			description={t("cards.contact.desc")}
			gradientFrom="#ec4899"
			gradientTo="#f43f5e"
			icon={<MessageSquare className="h-5 w-5 text-pink-400" />}
		/>
		<MetricCard
			title={t("cards.services.title")}
			value={activeServices}
			description={t("cards.services.desc")}
			gradientFrom="#3b82f6"
			gradientTo="#06b6d4"
			icon={<Wrench className="h-5 w-5 text-blue-400" />}
		/>
		<MetricCard
			title={t("cards.chatbot.title")}
			value={knowledgeChunks}
			description={t("cards.chatbot.desc")}
			gradientFrom="#f59e0b"
			gradientTo="#eab308"
			icon={<BrainCircuit className="h-5 w-5 text-amber-400" />}
		/>
	</div>
);
