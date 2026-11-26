import { redirect } from "next/navigation";
import React from "react";

import { getAdminAppointments, getAvailableServices } from "@/features/admin/actions/appointments";
import { getBlockedDates } from "@/features/admin/actions/blockedDates";
import { AppointmentsManager } from "@/features/admin/components/appointments/AppointmentsManager";
import { AppointmentStatusEnum } from "@/features/admin/schemas/appointmentsSchema";
import { getCachedAdminSession } from "@/lib/auth/requireAdmin";

import type { AppointmentStatus } from "@/features/admin/types/appointmentsTypes";

export const dynamic = "force-dynamic";

interface AdminAppointmentsPageProps {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ status?: string; action?: string }>;
}

const AdminAppointmentsPage: React.FC<AdminAppointmentsPageProps> = async ({
	params,
	searchParams,
}) => {
	const [{ locale }, resolvedSearch] = await Promise.all([params, searchParams]);
	const session = await getCachedAdminSession();

	if (!session) {
		redirect(`/${locale}/admin/login`);
	}

	const [appointmentsRes, blockedDatesRes, servicesRes] = await Promise.all([
		getAdminAppointments(),
		getBlockedDates(),
		getAvailableServices(),
	]);

	const parsedStatus = AppointmentStatusEnum.safeParse(resolvedSearch.status);
	const initialStatus: AppointmentStatus | "all" = parsedStatus.success ? parsedStatus.data : "all";

	const initialAppointments = appointmentsRes.success ? appointmentsRes.data : [];
	const initialBlockedDates = blockedDatesRes.success ? blockedDatesRes.data : [];
	const initialServices = servicesRes.success ? servicesRes.data : [];

	return (
		<AppointmentsManager
			initialAppointments={initialAppointments}
			initialBlockedDates={initialBlockedDates}
			initialServices={initialServices}
			initialStatus={initialStatus}
		/>
	);
};

export default AdminAppointmentsPage;
