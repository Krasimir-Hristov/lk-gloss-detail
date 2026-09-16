import { z } from "zod";

export const ContactFormSchema = z.object({
	name: z.string().trim().min(1, "nameRequired").max(200, "nameRequired"),
	email: z.string().trim().email("invalidEmail").max(320, "invalidEmail"),
	phone: z.string().trim().min(6, "invalidPhone").max(30, "invalidPhone"),
	message: z.string().trim().min(1, "messageRequired").max(5000, "messageRequired"),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;
