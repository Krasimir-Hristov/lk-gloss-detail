"use server";

import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";

const CreateBookingSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.email(),
	phone: z.string().min(6),
	carDescription: z.string().optional(),
	selectedServiceIds: z.array(z.uuid()).min(1),
	bookingDate: z.iso.date(),
});

type BookingResult =
	| { success: true; appointmentId: string }
	| { success: false; error: "DATE_TAKEN" | "INVALID_DATA" | "INTERNAL_ERROR" };

export const createBooking = async (
	data: z.infer<typeof CreateBookingSchema>,
): Promise<BookingResult> => {
	const parsed = CreateBookingSchema.safeParse(data);
	if (!parsed.success) {
		console.error(
			"[booking/create] Validation error:",
			parsed.error.issues.map(({ code, path }) => ({ code, path })),
		);
		return { success: false, error: "INVALID_DATA" };
	}

	const { firstName, lastName, email, phone, carDescription, selectedServiceIds, bookingDate } =
		parsed.data;

	const supabase = createServiceClient();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { data: appointmentId, error } = await (supabase.rpc as any)("create_booking", {
		p_first_name: firstName,
		p_last_name: lastName,
		p_email: email,
		p_phone: phone,
		p_car_description: carDescription ?? null,
		p_booking_date: bookingDate,
		p_service_ids: selectedServiceIds,
	});

	if (error) {
		if (error.message === "DATE_TAKEN") {
			return { success: false, error: "DATE_TAKEN" };
		}
		console.error("[booking/create] RPC error:", error.message);
		return { success: false, error: "INTERNAL_ERROR" };
	}

	return { success: true, appointmentId: appointmentId as string };
};

export const getUnavailableDates = async (): Promise<string[]> => {
	const supabase = createServiceClient();
	const today = new Date().toISOString().slice(0, 10);

	const [{ data: appointments }, { data: blockedDates }] = await Promise.all([
		supabase.from("appointments").select("booking_date").gte("booking_date", today),
		supabase.from("blocked_dates").select("blocked_date").gte("blocked_date", today),
	]);

	const appointmentDates = ((appointments ?? []) as { booking_date: string }[]).map(
		(a) => a.booking_date,
	);
	const blocked = ((blockedDates ?? []) as { blocked_date: string }[]).map((b) => b.blocked_date);

	return Array.from(new Set([...appointmentDates, ...blocked]));
};
