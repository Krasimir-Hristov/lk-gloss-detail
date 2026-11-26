"use server";

import { revalidatePath } from "next/cache";

import {
	DeleteAppointmentSchema,
	EditAppointmentSchema,
	UpdateStatusSchema,
	type EditAppointmentInput,
	type UpdateStatusInput,
} from "@/features/admin/schemas/appointmentsSchema";
import { routing } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import type { ActionResult } from "@/features/admin/actions/dashboard";

const revalidateAppointmentPaths = (): void => {
	for (const loc of routing.locales) {
		try {
			revalidatePath(`/${loc}/admin`);
			revalidatePath(`/${loc}/admin/appointments`);
			revalidatePath(`/${loc}/booking`);
		} catch {
			// Ignore if outside request context
		}
	}
};

/**
 * Updates the status of an appointment.
 */
export const updateAppointmentStatus = async (
	input: UpdateStatusInput,
): Promise<ActionResult<null>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsed = UpdateStatusSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "Invalid parameters" };
		}

		const { error } = await auth.supabase
			.from("appointments")
			.update({ status: parsed.data.status })
			.eq("id", parsed.data.id);

		if (error) {
			console.error("[updateAppointmentStatus] Supabase error:", error.message);
			if (error.code === "23505") {
				return {
					success: false,
					error: "Another active appointment already exists on this date",
				};
			}
			return { success: false, error: "Failed to update appointment status" };
		}

		revalidateAppointmentPaths();
		return { success: true, data: null };
	} catch (err: unknown) {
		console.error("[updateAppointmentStatus] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

/**
 * Deletes an appointment by ID.
 */
export const deleteAppointment = async (id: string): Promise<ActionResult<null>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsed = DeleteAppointmentSchema.safeParse({ id });
		if (!parsed.success) {
			return { success: false, error: "Invalid appointment ID" };
		}

		const { error } = await auth.supabase.from("appointments").delete().eq("id", parsed.data.id);

		if (error) {
			console.error("[deleteAppointment] Supabase error:", error.message);
			return { success: false, error: "Failed to delete appointment" };
		}

		revalidateAppointmentPaths();
		return { success: true, data: null };
	} catch (err: unknown) {
		console.error("[deleteAppointment] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

interface UpdateAppointmentRpcArgs {
	p_id: string;
	p_first_name: string;
	p_last_name: string;
	p_email: string;
	p_phone: string;
	p_car_description: string | null;
	p_booking_date: string;
	p_status: string;
	p_service_ids: string[];
}

interface AppointmentRpcClient {
	rpc: (
		fn: "update_appointment_with_services",
		args: UpdateAppointmentRpcArgs,
	) => Promise<{ error: { message: string; code?: string } | null }>;
}

/**
 * Updates full appointment details and re-assigns services in a single DB transaction.
 */
export const editAppointment = async (input: EditAppointmentInput): Promise<ActionResult<null>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsed = EditAppointmentSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "Validation failed" };
		}

		const {
			id,
			first_name,
			last_name,
			email,
			phone,
			car_description,
			booking_date,
			status,
			service_ids,
		} = parsed.data;

		const uniqueServiceIds = Array.from(new Set(service_ids));
		const rpcClient = auth.supabase as unknown as AppointmentRpcClient;

		const { error } = await rpcClient.rpc("update_appointment_with_services", {
			p_id: id,
			p_first_name: first_name,
			p_last_name: last_name,
			p_email: email,
			p_phone: phone,
			p_car_description: car_description || null,
			p_booking_date: booking_date,
			p_status: status,
			p_service_ids: uniqueServiceIds,
		});

		if (error) {
			console.error("[editAppointment] RPC error:", error.message);
			if (error.code === "23505") {
				return {
					success: false,
					error: "Another active appointment already exists on this date",
				};
			}
			if (error.code === "P0002" || error.message.includes("APPOINTMENT_NOT_FOUND")) {
				return { success: false, error: "Appointment not found" };
			}
			if (error.code === "23503") {
				return { success: false, error: "One or more selected services no longer exist" };
			}
			return { success: false, error: "Failed to update appointment details" };
		}

		revalidateAppointmentPaths();
		return { success: true, data: null };
	} catch (err: unknown) {
		console.error("[editAppointment] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};
