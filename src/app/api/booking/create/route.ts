import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const CreateBookingSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email(),
	phone: z.string().min(6),
	carDescription: z.string().optional(),
	selectedServiceIds: z.array(z.string().uuid()).min(1),
	bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const POST = async (request: Request) => {
	try {
		const body = await request.json();
		const parsed = CreateBookingSchema.safeParse(body);

		if (!parsed.success) {
			console.error("[booking/create] Validation error:", parsed.error.issues);
			return NextResponse.json({ error: "Invalid booking data" }, { status: 400 });
		}

		const { firstName, lastName, email, phone, carDescription, selectedServiceIds, bookingDate } =
			parsed.data;

		const supabase = await createClient();

		// Check if date is blocked or already booked (pre-check)
		const [{ data: existingAppointments }, { data: blockedDates }] = await Promise.all([
			supabase.from("appointments").select("id").eq("booking_date", bookingDate),
			supabase.from("blocked_dates").select("id").eq("blocked_date", bookingDate),
		]);

		if ((existingAppointments ?? []).length > 0 || (blockedDates ?? []).length > 0) {
			return NextResponse.json({ error: "DATE_TAKEN" }, { status: 409 });
		}

		// Insert appointment
		const { data: appointment, error: appointmentError } = await supabase
			.from("appointments")
			.insert({
				first_name: firstName,
				last_name: lastName,
				email,
				phone,
				car_description: carDescription,
				booking_date: bookingDate,
				status: "pending",
			})
			.select("id")
			.single();

		if (appointmentError) {
			// Race condition: another booking took the date
			if (appointmentError.code === "23505") {
				return NextResponse.json({ error: "DATE_TAKEN" }, { status: 409 });
			}
			console.error("[booking/create] Appointment insert error:", appointmentError.message);
			return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
		}

		// Insert junction records
		const junctionRecords = selectedServiceIds.map((serviceId) => ({
			appointment_id: appointment.id,
			service_id: serviceId,
		}));

		const { error: junctionError } = await supabase
			.from("appointment_services")
			.insert(junctionRecords);

		if (junctionError) {
			console.error("[booking/create] Junction insert error:", junctionError.message);
			return NextResponse.json({ error: "Failed to link services" }, { status: 500 });
		}

		return NextResponse.json({ success: true, appointmentId: appointment.id }, { status: 201 });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Internal Server Error";
		console.error("[booking/create] Error:", message);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
};
