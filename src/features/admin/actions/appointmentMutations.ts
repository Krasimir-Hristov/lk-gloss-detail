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

/**
 * Updates full appointment details and re-assigns services.
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

		const { supabase } = auth;

		// 1. Update main appointment record
		const { error: apptError } = await supabase
			.from("appointments")
			.update({
				first_name,
				last_name,
				email,
				phone,
				car_description: car_description || null,
				booking_date,
				status,
			})
			.eq("id", id);

		if (apptError) {
			console.error("[editAppointment] Error updating appointment:", apptError.message);
			if (apptError.code === "23505") {
				return {
					success: false,
					error: "Another active appointment already exists on this date",
				};
			}
			return { success: false, error: "Failed to update appointment details" };
		}

		// 2. Re-assign services in appointment_services
		const { error: deleteError } = await supabase
			.from("appointment_services")
			.delete()
			.eq("appointment_id", id);

		if (deleteError) {
			console.error("[editAppointment] Error clearing appointment services:", deleteError.message);
			return { success: false, error: "Failed to update services" };
		}

		const uniqueServiceIds = Array.from(new Set(service_ids));
		const newServiceRows = uniqueServiceIds.map((serviceId) => ({
			appointment_id: id,
			service_id: serviceId,
		}));

		const { error: insertError } = await supabase
			.from("appointment_services")
			.insert(newServiceRows);

		if (insertError) {
			console.error("[editAppointment] Error inserting appointment services:", insertError.message);
			return { success: false, error: "Failed to re-assign services" };
		}

		revalidateAppointmentPaths();
		return { success: true, data: null };
	} catch (err: unknown) {
		console.error("[editAppointment] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};
