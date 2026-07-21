import React from "react";

import { getAdminAppointments } from "@/features/admin/actions/appointments";
import { getBlockedDates } from "@/features/admin/actions/blocked-dates";
import { AppointmentsManager } from "@/features/admin/components/appointments/AppointmentsManager";

const AdminAppointmentsPage: React.FC = async () => {
	const [appointmentsRes, blockedDatesRes] = await Promise.all([
		getAdminAppointments(),
		getBlockedDates(),
	]);

	const initialAppointments = appointmentsRes.success ? appointmentsRes.data : [];
	const initialBlockedDates = blockedDatesRes.success ? blockedDatesRes.data : [];

	return (
		<AppointmentsManager
			initialAppointments={initialAppointments}
			initialBlockedDates={initialBlockedDates}
		/>
	);
};

export default AdminAppointmentsPage;
