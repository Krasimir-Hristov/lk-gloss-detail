"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { loginAdmin } from "@/features/admin/actions/auth";
import {
	LoginSchema,
	type AuthErrorType,
	type LoginFormValues,
} from "@/features/admin/schemas/auth.schema";

const LoginPage: React.FC = () => {
	const t = useTranslations("Admin");
	const router = useRouter();
	const params = useParams();
	const locale = (params?.locale as string) || "de";

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [serverError, setServerError] = useState<AuthErrorType | null>(null);

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
				router.push(`/${locale}/admin`);
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
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 text-white">
			{/* Decorative background glows */}
			<div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl"></div>
			<div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-3xl"></div>

			<div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800/80 bg-neutral-900/80 p-8 shadow-2xl backdrop-blur-md">
				{/* Top branding */}
				<div className="mb-8 text-center">
					<h1 className="Montserrat bg-linear-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-2xl font-black tracking-widest text-transparent uppercase">
						LK GLOSS & DETAIL
					</h1>
					<p className="mt-2 text-xs font-medium tracking-wide text-neutral-400">
						{t("loginSubtitle")}
					</p>
				</div>

				{/* Error Alerts */}
				{serverError ? (
					<div className="mb-6 flex flex-col gap-1 rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400 transition-all duration-200">
						<span className="font-semibold">Error</span>
						<span>{t(`errors.${serverError}`)}</span>
					</div>
				) : null}

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div>
						<label
							htmlFor="email"
							className="mb-2 block text-xs font-bold tracking-wider text-neutral-400 uppercase"
						>
							{t("emailLabel")}
						</label>
						<input
							id="email"
							type="email"
							placeholder={t("emailPlaceholder")}
							{...register("email")}
							className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 transition-all duration-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
							disabled={isSubmitting}
						/>
						{errors.email?.message ? (
							<p className="mt-2 text-xs font-medium text-red-400">
								{t(`errors.${errors.email.message}`)}
							</p>
						) : null}
					</div>

					<div>
						<label
							htmlFor="password"
							className="mb-2 block text-xs font-bold tracking-wider text-neutral-400 uppercase"
						>
							{t("passwordLabel")}
						</label>
						<input
							id="password"
							type="password"
							placeholder={t("passwordPlaceholder")}
							{...register("password")}
							className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 transition-all duration-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
							disabled={isSubmitting}
						/>
						{errors.password?.message ? (
							<p className="mt-2 text-xs font-medium text-red-400">
								{t(`errors.${errors.password.message}`)}
							</p>
						) : null}
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 py-3 text-sm font-bold tracking-wide shadow-lg shadow-purple-950/20 transition-all duration-250 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/10 active:scale-[0.98] disabled:opacity-50"
					>
						{isSubmitting ? t("loggingIn") : t("submitButton")}
					</button>
				</form>
			</div>
		</div>
	);
};

const LoginPageWithBoundary: React.FC = () => {
	return (
		<ErrorBoundary>
			<LoginPage />
		</ErrorBoundary>
	);
};

export default LoginPageWithBoundary;
