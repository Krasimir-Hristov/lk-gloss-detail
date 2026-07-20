"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/routing";

const LoginSchema = z.object({
	email: z.string().email({ message: "invalidEmail" }),
	password: z.string().min(6, { message: "passwordTooShort" }),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

type PageProps = {
	params: Promise<{ locale: string }>;
};

const AdminLoginPage: React.FC<PageProps> = ({ params }) => {
	const { locale } = React.use(params);
	const t = useTranslations("Admin");
	const router = useRouter();

	const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
	const [isPending, startTransition] = React.useTransition();

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

	const onSubmit = (values: LoginFormValues) => {
		setErrorMsg(null);
		startTransition(async () => {
			try {
				const res = await login({
					email: values.email,
					password: values.password,
					locale,
				});

				if (res.success) {
					router.push("/admin");
					router.refresh();
				} else {
					if (res.error === "INVALID_CREDENTIALS" || res.error === "NOT_ADMIN") {
						setErrorMsg(t("invalidCredentials"));
					} else {
						setErrorMsg(t("unexpectedError"));
					}
				}
			} catch (err) {
				console.error("[login_page] Submission error:", err);
				setErrorMsg(t("unexpectedError"));
			}
		});
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
							LK Gloss & Detail Administration
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							{errorMsg ? (
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-center text-sm font-semibold"
								>
									{errorMsg}
								</motion.div>
							) : null}

							<div className="space-y-2">
								<Label htmlFor="email" className="text-sm font-semibold text-[#e5e2e1]">
									{t("email")}
								</Label>
								<Input
									id="email"
									type="email"
									placeholder="admin@lkglossanddetail.de"
									{...register("email")}
									disabled={isPending}
									className="border-white/10 bg-black/50 text-[#e5e2e1] placeholder-white/20 transition-all focus:border-[#7b2dff] focus:ring-2 focus:ring-[#7b2dff]/20"
								/>
								{errors.email ? (
									<p className="text-destructive text-xs">
										{errors.email.message === "invalidEmail"
											? "Bitte geben Sie eine gültige E-Mail-Adresse ein."
											: errors.email.message}
									</p>
								) : null}
							</div>

							<div className="space-y-2">
								<Label htmlFor="password" className="text-sm font-semibold text-[#e5e2e1]">
									{t("password")}
								</Label>
								<Input
									id="password"
									type="password"
									placeholder="••••••••"
									{...register("password")}
									disabled={isPending}
									className="border-white/10 bg-black/50 text-[#e5e2e1] placeholder-white/20 transition-all focus:border-[#7b2dff] focus:ring-2 focus:ring-[#7b2dff]/20"
								/>
								{errors.password ? (
									<p className="text-destructive text-xs">
										{errors.password.message === "passwordTooShort"
											? "Das Passwort muss mindestens 6 Zeichen lang sein."
											: errors.password.message}
									</p>
								) : null}
							</div>

							<Button
								type="submit"
								disabled={isPending}
								className="w-full bg-linear-to-r from-[#7B2DFF] to-[#C026FF] py-6 font-bold text-white shadow-[0px_0px_15px_rgba(192,38,255,0.4)] transition-all hover:shadow-[0px_0px_25px_rgba(192,38,255,0.6)] active:scale-98 disabled:opacity-50"
							>
								{isPending ? t("signingIn") : t("signIn")}
							</Button>
						</form>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
};

export default AdminLoginPage;
