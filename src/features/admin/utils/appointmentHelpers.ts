import { getLocalizedText } from "@/features/admin/types/services.types";

import type {
	AppointmentServiceItem,
	AppointmentStatus,
} from "@/features/admin/types/appointments.types";

export const statusColors: Record<AppointmentStatus, string> = {
	pending: "border-amber-500/30 bg-amber-500/10 text-amber-400",
	confirmed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
	completed: "border-blue-500/30 bg-blue-500/10 text-blue-400",
	cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
};

export function getAppointmentServiceNames(
	services: AppointmentServiceItem[],
	locale: string,
): string {
	if (!services || services.length === 0) return "—";
	return services.map((s) => getLocalizedText(s.name, locale)).join(", ");
}
