import type { AdminAppointment } from "@/features/admin/types/appointmentsTypes";
import type { AdminMessage } from "@/features/admin/types/messagesTypes";

export interface DashboardMetrics {
	pendingCount: number;
	unreadMessagesCount: number;
	todayCount: number;
	upcomingCount: number;
}

export interface AdminSidebarCounts {
	pendingAppointments: number;
	unreadMessages: number;
}

export interface DashboardOverview {
	todaysAppointments: AdminAppointment[];
	upcomingAppointments: AdminAppointment[];
	recentUnreadMessages: AdminMessage[];
	metrics: DashboardMetrics;
}
