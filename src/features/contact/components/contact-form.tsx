"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactFormSchema } from "@/features/contact/schemas/contact.schema";

import type { ContactFormData } from "@/features/contact/schemas/contact.schema";

export const ContactForm: React.FC = () => {
	const t = useTranslations("Contact.form");
	const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
	const [errorMsg, setErrorMsg] = React.useState("");

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ContactFormData>({
		resolver: zodResolver(ContactFormSchema),
		defaultValues: { name: "", email: "", phone: "", message: "" },
	});

	const onSubmit = async (data: ContactFormData) => {
		setStatus("loading");
		setErrorMsg("");
		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			const result = (await response.json()) as { success: boolean; error?: string };
			if (result.success) {
				setStatus("success");
				reset();
			} else {
				setStatus("error");
				setErrorMsg(result.error || "Unknown error");
			}
		} catch (err) {
			setStatus("error");
			setErrorMsg(err instanceof Error ? err.message : "Unknown error");
		}
	};

	if (status === "success") {
		return (
			<div className="flex flex-col items-center gap-4 rounded-2xl border border-[#7b2dff]/30 bg-[#1a1a2e] p-8 text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7b2dff]/20">
					<svg
						className="h-7 w-7 text-[#7b2dff]"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<p className="text-lg font-semibold text-white">{t("submitSuccess")}</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
			<div className="space-y-2">
				<Label htmlFor="contact-name">{t("name")}</Label>
				<Controller
					name="name"
					control={control}
					render={({ field }) => (
						<Input
							id="contact-name"
							placeholder={t("namePlaceholder")}
							className="border-[#4a4456] bg-[#1a1a2e] text-white placeholder:text-[#888]"
							{...field}
						/>
					)}
				/>
				{errors.name ? (
					<p className="text-sm text-red-400">{t(errors.name.message as string)}</p>
				) : null}
			</div>

			<div className="space-y-2">
				<Label htmlFor="contact-email">{t("email")}</Label>
				<Controller
					name="email"
					control={control}
					render={({ field }) => (
						<Input
							id="contact-email"
							type="email"
							placeholder="name@example.com"
							className="border-[#4a4456] bg-[#1a1a2e] text-white placeholder:text-[#888]"
							{...field}
						/>
					)}
				/>
				{errors.email ? (
					<p className="text-sm text-red-400">{t(errors.email.message as string)}</p>
				) : null}
			</div>

			<div className="space-y-2">
				<Label htmlFor="contact-phone">{t("phone")}</Label>
				<Controller
					name="phone"
					control={control}
					render={({ field }) => (
						<Input
							id="contact-phone"
							type="tel"
							placeholder="+49 151 12345678"
							className="border-[#4a4456] bg-[#1a1a2e] text-white placeholder:text-[#888]"
							{...field}
						/>
					)}
				/>
				{errors.phone ? (
					<p className="text-sm text-red-400">{t(errors.phone.message as string)}</p>
				) : null}
			</div>

			<div className="space-y-2">
				<Label htmlFor="contact-message">{t("message")}</Label>
				<Controller
					name="message"
					control={control}
					render={({ field }) => (
						<textarea
							id="contact-message"
							rows={4}
							placeholder={t("messagePlaceholder")}
							className="w-full rounded-lg border border-[#4a4456] bg-[#1a1a2e] px-3 py-2 text-sm text-white outline-none placeholder:text-[#888] focus:border-[#7b2dff]/50"
							{...field}
						/>
					)}
				/>
				{errors.message ? (
					<p className="text-sm text-red-400">{t(errors.message.message as string)}</p>
				) : null}
			</div>

			{status === "error" ? (
				<p className="text-sm text-red-400">
					{t("submitError")}
					{errorMsg ? ` (${errorMsg})` : ""}
				</p>
			) : null}

			<Button
				type="submit"
				disabled={status === "loading"}
				className="mt-2 w-full bg-linear-to-r from-[#7b2dff] to-[#b303f2] py-6 text-lg font-bold text-white hover:shadow-[0_0_30px_rgba(123,45,255,0.5)]"
			>
				{status === "loading" ? t("submitting") : t("submit")}
			</Button>
		</form>
	);
};
