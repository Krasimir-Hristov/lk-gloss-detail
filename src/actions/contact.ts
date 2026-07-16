"use server";

import { ContactFormSchema } from "@/features/contact/schemas/contact.schema";
import { getResend } from "@/lib/resend";
import { createServiceClient } from "@/lib/supabase/service";

import type { ContactFormData } from "@/features/contact/schemas/contact.schema";

type ContactResult =
	| { success: true }
	| { success: false; error: "INVALID_DATA" | "INTERNAL_ERROR" };

export const submitContact = async (data: ContactFormData): Promise<ContactResult> => {
	try {
		const parsed = ContactFormSchema.safeParse(data);
		if (!parsed.success) {
			console.error(
				"[contact/submit] Validation error:",
				parsed.error.issues.map(({ code, path }) => ({ code, path })),
			);
			return { success: false, error: "INVALID_DATA" };
		}

		const { name, email, phone, message } = parsed.data;

		const supabase = createServiceClient();

		const { error: dbError } = await (
			supabase.from("contact_submissions") as unknown as {
				insert: (data: {
					name: string;
					email: string;
					phone: string;
					message: string;
				}) => Promise<{ error: { message: string } | null }>;
			}
		).insert({
			name,
			email,
			phone,
			message,
		});

		if (dbError) {
			console.error("[contact/submit] DB insert error:", dbError.message);
			return { success: false, error: "INTERNAL_ERROR" };
		}

		const contactEmail = process.env.CONTACT_EMAIL;
		console.warn("[contact/submit] CONTACT_EMAIL:", contactEmail);
		if (contactEmail) {
			try {
				const resend = getResend();
				console.warn("[contact/submit] Sending email via Resend...");
				const { data: emailData, error: emailError } = await resend.emails.send({
					from: "LK Gloss & Detail <onboarding@resend.dev>",
					to: contactEmail,
					subject: `Neue Kontaktanfrage von ${name}`,
					text: `Name: ${name}\nE-Mail: ${email}\nTelefon: ${phone}\nNachricht: ${message}\n\nDiese Nachricht wurde über das Kontaktformular auf lkglossanddetail.de gesendet.`,
				});
				if (emailError) {
					console.error("[contact/submit] Resend error:", JSON.stringify(emailError));
				} else {
					console.warn("[contact/submit] Email sent, ID:", emailData?.id);
				}
			} catch (emailError) {
				console.error(
					"[contact/submit] Email send exception:",
					emailError instanceof Error ? emailError.message : emailError,
				);
			}
		} else {
			console.warn("[contact/submit] CONTACT_EMAIL is not set!");
		}

		return { success: true };
	} catch (err: unknown) {
		const errMsg = err instanceof Error ? err.message : "Unknown error";
		console.error("[contact/submit] Unexpected action error:", errMsg);
		return { success: false, error: "INTERNAL_ERROR" };
	}
};
