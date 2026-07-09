import { z } from "zod";

export const BookingClientInfoSchema = z.object({
	firstName: z.string().min(1, "firstNameRequired"),
	lastName: z.string().min(1, "lastNameRequired"),
	email: z.string().email("invalidEmail"),
	phone: z.string().min(6, "invalidPhone"),
	carDescription: z.string().optional(),
	gdprAccepted: z.boolean().refine((value) => value === true, {
		message: "gdprRequired",
	}),
});

export const BookingServicesSchema = z.object({
	selectedServiceIds: z.array(z.string().uuid()).min(1, "selectMinServices"),
});

export const BookingDateSchema = z.object({
	bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate"),
});

export const BookingFormSchema =
	BookingClientInfoSchema.merge(BookingServicesSchema).merge(BookingDateSchema);

export type BookingClientInfo = z.infer<typeof BookingClientInfoSchema>;
export type BookingServices = z.infer<typeof BookingServicesSchema>;
export type BookingDate = z.infer<typeof BookingDateSchema>;
export type BookingFormData = z.infer<typeof BookingFormSchema>;
