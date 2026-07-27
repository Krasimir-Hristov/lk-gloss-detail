import { getTranslations } from "next-intl/server";
import React from "react";

import { getDashboardOverviewAction } from "@/features/admin/actions/dashboard";
import { DashboardMetricsGrid } from "@/features/admin/components/dashboard/DashboardMetricsGrid";
import { QuickActionsBar } from "@/features/admin/components/dashboard/QuickActionsBar";
import { TodaysAppointmentsWidget } from "@/features/admin/components/dashboard/TodaysAppointmentsWidget";
import { UpcomingAppointmentsWidget } from "@/features/admin/components/dashboard/UpcomingAppointmentsWidget";

interface DashboardPageProps {
	params: Promise<{ locale: string }>;
}

const DashboardPage: React.FC<DashboardPageProps> = async ({ params }) => {
	const { locale } = await params;
	const t = await getTranslations("Admin");
	const result = await getDashboardOverviewAction();

	if (!result.success || !result.data) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="Montserrat text-3xl font-extrabold tracking-tight text-white">
						{t("dashboard.welcome")}
					</h1>
					<p className="mt-2 text-sm text-neutral-400">{t("dashboard.subtitle")}</p>
				</div>
				<div className="rounded-lg border border-red-500/30 bg-red-950/20 p-6 text-red-400">
					<h2 className="Montserrat mb-2 text-lg font-bold">{t("dashboard.error.title")}</h2>
					<p className="text-sm">{t("dashboard.error.message")}</p>
				</div>
			</div>
		);
	}

	const { todaysAppointments, upcomingAppointments, metrics } = result.data;
	const dt = (key: string) => t(`dashboard.${key}`);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="Montserrat text-3xl font-extrabold tracking-tight text-white">
					{t("dashboard.welcome")}
				</h1>
				<p className="mt-2 text-sm text-neutral-400">{t("dashboard.subtitle")}</p>
			</div>

			{/* Metrics Grid */}
			<DashboardMetricsGrid
				totalAppointments={metrics.totalAppointments}
				todayCount={metrics.todayCount}
				upcomingCount={metrics.upcomingCount}
				pendingCount={metrics.pendingCount}
				monthlySubmissions={metrics.monthlySubmissions}
				activeServices={metrics.activeServices}
				knowledgeChunks={metrics.knowledgeChunks}
				t={dt}
			/>

			{/* Quick Actions */}
			<QuickActionsBar t={dt} />

			{/* Appointments Widgets */}
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<TodaysAppointmentsWidget appointments={todaysAppointments} locale={locale} t={dt} />
				<UpcomingAppointmentsWidget appointments={upcomingAppointments} locale={locale} t={dt} />
			</div>
		</div>
	);
};

export default DashboardPage;
