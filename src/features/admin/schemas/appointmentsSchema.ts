import { z } from "zod";

export const AppointmentStatusEnum = z.enum(["pending", "confirmed", "completed", "cancelled"]);

export const UpdateStatusSchema = z.object({
	id: z.string().uuid(),
	status: AppointmentStatusEnum,
});

export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

export const BlockDateSchema = z.object({
	blocked_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
	reason: z.string().optional(),
});

export type BlockDateInput = z.infer<typeof BlockDateSchema>;

export const EditAppointmentSchema = z.object({
	id: z.string().uuid(),
	first_name: z.string().min(1, "First name is required"),
	last_name: z.string().min(1, "Last name is required"),
	email: z.string().email("Invalid email address"),
	phone: z.string().min(6, "Phone number is too short"),
	car_description: z.string().nullable().optional(),
	booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
	status: AppointmentStatusEnum,
	service_ids: z.array(z.string().uuid()).min(1, "At least one service is required"),
});

export type EditAppointmentInput = z.infer<typeof EditAppointmentSchema>;
