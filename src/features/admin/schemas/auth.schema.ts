import { z } from "zod";

export const LoginSchema = z.object({
	email: z.string().trim().min(1, "emailRequired").email("invalidEmail"),
	password: z.string().min(6, "passwordTooShort"),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;

export type AuthErrorType =
	| "invalid_credentials"
	| "not_admin"
	| "server_error"
	| "validation_error"
	| "too_many_attempts";

export type AuthResult = { success: true } | { success: false; error: AuthErrorType };
