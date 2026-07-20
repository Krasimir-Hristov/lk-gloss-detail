"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm } from "react-hook-form";

import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAdmin } from "@/features/admin/actions/auth";
import {
	LoginSchema,
	type AuthErrorType,
	type LoginFormValues,
} from "@/features/admin/schemas/auth.schema";

const AdminLoginPage: React.FC = () => {
	const t = useTranslations("Admin");
	const router = useRouter();

	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [serverError, setServerError] = React.useState<AuthErrorType | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormValues>({
		resolver: zodResolver(LoginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (values: LoginFormValues) => {
		setIsSubmitting(true);
		setServerError(null);

		try {
			const result = await loginAdmin(values);

			if (result.success) {
				router.push("/admin");
				router.refresh();
			} else {
				setServerError(result.error);
			}
		} catch (error) {
			console.error("[login/submit] Unexpected login error:", error);
			setServerError("server_error");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-[80vh] items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
				className="w-full max-w-md"
			>
				<Card className="border border-[#7b2dff]/20 bg-[#121212]/90 shadow-[0px_0px_50px_rgba(123,45,255,0.15)] backdrop-blur-xl">
					<CardHeader className="space-y-1 text-center">
						<CardTitle className="bg-linear-to-r from-[#d8b4fe] via-[#a855f7] to-[#7b2dff] bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
							{t("loginTitle")}
						</CardTitle>
						<CardDescription className="text-sm text-[#ccc3d9]">
							{t("loginSubtitle")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							{serverError ? (
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-center text-sm font-semibold"
								>
									{t(`errors.${serverError}`)}
								</motion.div>
							) : null}

							<div className="space-y-2">
								<Label htmlFor="email" className="text-sm font-semibold text-[#e5e2e1]">
									{t("emailLabel")}
								</Label>
								<Input
									id="email"
									type="email"
									placeholder={t("emailPlaceholder")}
									{...register("email")}
									disabled={isSubmitting}
									className="border-white/10 bg-black/50 text-[#e5e2e1] placeholder-white/20 transition-all focus:border-[#7b2dff] focus:ring-2 focus:ring-[#7b2dff]/20"
								/>
								{errors.email?.message ? (
									<p className="text-destructive text-xs">{t(`errors.${errors.email.message}`)}</p>
								) : null}
							</div>

							<div className="space-y-2">
								<Label htmlFor="password" className="text-sm font-semibold text-[#e5e2e1]">
									{t("passwordLabel")}
								</Label>
								<Input
									id="password"
									type="password"
									placeholder={t("passwordPlaceholder")}
									{...register("password")}
									disabled={isSubmitting}
									className="border-white/10 bg-black/50 text-[#e5e2e1] placeholder-white/20 transition-all focus:border-[#7b2dff] focus:ring-2 focus:ring-[#7b2dff]/20"
								/>
								{errors.password?.message ? (
									<p className="text-destructive text-xs">
										{t(`errors.${errors.password.message}`)}
									</p>
								) : null}
							</div>

							<Button
								type="submit"
								disabled={isSubmitting}
								className="w-full cursor-pointer bg-linear-to-r from-[#7B2DFF] to-[#C026FF] py-6 font-bold text-white shadow-[0px_0px_15px_rgba(192,38,255,0.4)] transition-all hover:shadow-[0px_0px_25px_rgba(192,38,255,0.6)] active:scale-98 disabled:opacity-50"
							>
								{isSubmitting ? t("loggingIn") : t("submitButton")}
							</Button>
						</form>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
};

const LoginPageWithBoundary: React.FC = () => {
	return (
		<ErrorBoundary>
			<AdminLoginPage />
		</ErrorBoundary>
	);
};

export default LoginPageWithBoundary;
