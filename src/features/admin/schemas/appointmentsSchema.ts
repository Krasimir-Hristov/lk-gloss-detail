import { z } from "zod";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;
const MAX_BLOCK_RANGE_DAYS = 60;

const parseUtcDateMs = (isoDate: string): number | null => {
	if (!ISO_DATE_REGEX.test(isoDate)) return null;
	const [yearStr, monthStr, dayStr] = isoDate.split("-");
	const year = Number(yearStr);
	const month = Number(monthStr);
	const day = Number(dayStr);
	const ms = Date.UTC(year, month - 1, day);
	const d = new Date(ms);
	if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
		return null;
	}
	return ms;
};

export const AppointmentStatusEnum = z.enum(["pending", "confirmed", "completed", "cancelled"]);

export const UpdateStatusSchema = z.object({
	id: z.string().uuid(),
	status: AppointmentStatusEnum,
});

export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

export const BlockDateSchema = z.object({
	blocked_date: z.string().regex(ISO_DATE_REGEX, "Invalid date format (YYYY-MM-DD)"),
	reason: z.string().optional(),
});

export type BlockDateInput = z.infer<typeof BlockDateSchema>;

export const BlockDateRangeSchema = z
	.object({
		start_date: z.string().regex(ISO_DATE_REGEX, "Invalid start date format (YYYY-MM-DD)"),
		end_date: z.string().regex(ISO_DATE_REGEX, "Invalid end date format (YYYY-MM-DD)"),
		reason: z.string().trim().max(300).optional(),
		allow_conflict: z.boolean().optional(),
	})
	.refine(
		(data) => {
			const startMs = parseUtcDateMs(data.start_date);
			const endMs = parseUtcDateMs(data.end_date);
			return startMs !== null && endMs !== null && startMs <= endMs;
		},
		{
			message: "Start date must be on or before end date",
			path: ["end_date"],
		},
	)
	.refine(
		(data) => {
			const startMs = parseUtcDateMs(data.start_date);
			const endMs = parseUtcDateMs(data.end_date);
			if (startMs === null || endMs === null) return false;
			const inclusiveDays = Math.round((endMs - startMs) / MS_PER_DAY) + 1;
			return inclusiveDays <= MAX_BLOCK_RANGE_DAYS;
		},
		{
			message: "Date range cannot exceed 60 days inclusive",
			path: ["end_date"],
		},
	);

export type BlockDateRangeInput = z.infer<typeof BlockDateRangeSchema>;

export const DeleteAppointmentSchema = z.object({
	id: z.string().uuid(),
});

export type DeleteAppointmentInput = z.infer<typeof DeleteAppointmentSchema>;

export const EditAppointmentSchema = z.object({
	id: z.string().uuid(),
	first_name: z.string().min(1, "First name is required"),
	last_name: z.string().min(1, "Last name is required"),
	email: z.string().email("Invalid email address"),
	phone: z.string().min(6, "Phone number is too short"),
	car_description: z.string().nullable().optional(),
	booking_date: z.string().regex(ISO_DATE_REGEX, "Invalid date format (YYYY-MM-DD)"),
	status: AppointmentStatusEnum,
	service_ids: z.array(z.string().uuid()).min(1, "At least one service is required"),
});

export type EditAppointmentInput = z.infer<typeof EditAppointmentSchema>;
