"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Car, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { BookingClientInfoSchema } from "@/features/booking/schemas/bookingSchema";
import { useBookingStore } from "@/features/booking/stores/bookingStore";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import type { BookingClientInfo } from "@/features/booking/schemas/bookingSchema";

const INPUT_CLASS =
	"h-12 rounded-xl border-white/[0.1] bg-[#0b0b11]/90 pl-11 pr-4 text-base text-white placeholder:text-[#6f6882] transition-all duration-200 hover:border-white/[0.18] focus-visible:border-[#a855f7]/75 focus-visible:bg-[#10101a] focus-visible:ring-2 focus-visible:ring-[#7b2dff]/30 aria-invalid:border-rose-500/60 aria-invalid:ring-rose-500/20 sm:text-sm";

export const StepClientInfo: React.FC = () => {
	const t = useTranslations("Booking.step1");
	const {
		firstName,
		lastName,
		email,
		phone,
		carDescription,
		gdprAccepted,
		setClientInfo,
		nextStep,
	} = useBookingStore();

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<BookingClientInfo>({
		resolver: zodResolver(BookingClientInfoSchema),
		defaultValues: {
			firstName,
			lastName,
			email,
			phone,
			carDescription,
			gdprAccepted,
		},
	});

	const gdprValue = watch("gdprAccepted");

	const onSubmit = (data: BookingClientInfo) => {
		setClientInfo(data);
		nextStep();
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
			{/* Name Row */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<div className="space-y-2">
					<Label
						htmlFor="firstName"
						className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#b8b2c7] uppercase"
					>
						{t("firstName")} *
					</Label>
					<div className="group relative">
						<User
							className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7a738c] transition-colors group-focus-within:text-[#d8b4fe]"
							aria-hidden="true"
						/>
						<Input
							id="firstName"
							autoComplete="given-name"
							aria-invalid={Boolean(errors.firstName)}
							{...register("firstName")}
							placeholder={t("firstName")}
							className={INPUT_CLASS}
						/>
					</div>
					{errors.firstName ? (
						<p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
							<AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
							<span>{t(errors.firstName.message as string)}</span>
						</p>
					) : null}
				</div>

				<div className="space-y-2">
					<Label
						htmlFor="lastName"
						className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#b8b2c7] uppercase"
					>
						{t("lastName")} *
					</Label>
					<div className="group relative">
						<User
							className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7a738c] transition-colors group-focus-within:text-[#d8b4fe]"
							aria-hidden="true"
						/>
						<Input
							id="lastName"
							autoComplete="family-name"
							aria-invalid={Boolean(errors.lastName)}
							{...register("lastName")}
							placeholder={t("lastName")}
							className={INPUT_CLASS}
						/>
					</div>
					{errors.lastName ? (
						<p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
							<AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
							<span>{t(errors.lastName.message as string)}</span>
						</p>
					) : null}
				</div>
			</div>

			{/* Email & Phone Row */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<div className="space-y-2">
					<Label
						htmlFor="email"
						className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#b8b2c7] uppercase"
					>
						{t("email")} *
					</Label>
					<div className="group relative">
						<Mail
							className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7a738c] transition-colors group-focus-within:text-[#d8b4fe]"
							aria-hidden="true"
						/>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							aria-invalid={Boolean(errors.email)}
							{...register("email")}
							placeholder="name@example.com"
							className={INPUT_CLASS}
						/>
					</div>
					{errors.email ? (
						<p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
							<AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
							<span>{t(errors.email.message as string)}</span>
						</p>
					) : null}
				</div>

				<div className="space-y-2">
					<Label
						htmlFor="phone"
						className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#b8b2c7] uppercase"
					>
						{t("phone")} *
					</Label>
					<div className="group relative">
						<Phone
							className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7a738c] transition-colors group-focus-within:text-[#d8b4fe]"
							aria-hidden="true"
						/>
						<Input
							id="phone"
							type="tel"
							autoComplete="tel"
							aria-invalid={Boolean(errors.phone)}
							{...register("phone")}
							placeholder="+49 151 12345678"
							className={INPUT_CLASS}
						/>
					</div>
					{errors.phone ? (
						<p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
							<AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
							<span>{t(errors.phone.message as string)}</span>
						</p>
					) : null}
				</div>
			</div>

			{/* Vehicle Description */}
			<div className="space-y-2">
				<Label
					htmlFor="carDescription"
					className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-[#b8b2c7] uppercase"
				>
					<Car className="h-3.5 w-3.5 text-[#a855f7]" aria-hidden="true" />
					<span>{t("carDescription")}</span>
				</Label>
				<Textarea
					id="carDescription"
					{...register("carDescription")}
					placeholder={t("carDescriptionHint")}
					rows={4}
					className="min-h-28 rounded-xl border-white/[0.1] bg-[#0b0b11]/90 px-4 py-3 text-base leading-relaxed text-white transition-all duration-200 placeholder:text-[#6f6882] hover:border-white/[0.18] focus-visible:border-[#a855f7]/75 focus-visible:bg-[#10101a] focus-visible:ring-2 focus-visible:ring-[#7b2dff]/30 sm:text-sm"
				/>
			</div>

			{/* Sculpted GDPR Consent Card */}
			<div
				className={cn(
					"rounded-2xl border p-4 transition-all duration-200",
					gdprValue
						? "border-[#7b2dff]/45 bg-[#7b2dff]/[0.09]"
						: errors.gdprAccepted
							? "border-rose-500/45 bg-rose-500/[0.06]"
							: "border-white/[0.08] bg-white/[0.025] hover:border-white/[0.15]",
				)}
			>
				<div className="flex items-start gap-3.5">
					<Checkbox
						id="gdpr"
						checked={gdprValue}
						aria-label={t("gdpr")}
						className="mt-0.5 size-5 rounded-md border-white/25 data-checked:border-[#a855f7] data-checked:bg-[#7b2dff]"
						onCheckedChange={(checked) =>
							setValue("gdprAccepted", checked === true, { shouldValidate: true })
						}
					/>
					<div className="flex-1 space-y-1.5">
						<Label
							htmlFor="gdpr"
							className="block cursor-pointer text-sm leading-relaxed font-normal text-[#ded8ec]"
						>
							{t("gdpr")}
						</Label>
						<div className="flex flex-wrap items-center gap-2">
							<ShieldCheck className="h-3.5 w-3.5 text-[#a855f7]" aria-hidden="true" />
							<Link
								href="/privacy"
								target="_blank"
								className="font-mono text-[11px] font-semibold tracking-wider text-[#d1bcff] underline underline-offset-4 transition-colors hover:text-white"
							>
								{t("privacyLink")}
							</Link>
						</div>
						{errors.gdprAccepted ? (
							<p
								role="alert"
								className="flex items-center gap-1.5 pt-1 text-xs font-medium text-rose-400"
							>
								<AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
								<span>{t(errors.gdprAccepted.message as string)}</span>
							</p>
						) : null}
					</div>
				</div>
			</div>

			{/* Primary Gradient CTA */}
			<div className="pt-1">
				<Button
					type="submit"
					aria-label={t("next")}
					className="group font-display h-13 w-full cursor-pointer gap-2.5 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-7 text-base font-bold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_14px_38px_-8px_rgba(123,45,255,0.6)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_18px_46px_-6px_rgba(192,38,255,0.68)] hover:brightness-110 active:scale-[0.99]"
				>
					<span>{t("next")}</span>
					<ArrowRight
						className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
						aria-hidden="true"
					/>
				</Button>
			</div>
		</form>
	);
};
