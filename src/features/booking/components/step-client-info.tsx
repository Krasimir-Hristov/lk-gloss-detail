"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookingClientInfoSchema } from "@/features/booking/schemas/booking.schema";
import { useBookingStore } from "@/features/booking/stores/booking-store";

import type { BookingClientInfo } from "@/features/booking/schemas/booking.schema";

export const StepClientInfo = () => {
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
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="firstName">{t("firstName")}</Label>
					<Input id="firstName" {...register("firstName")} placeholder={t("firstName")} />
					{errors.firstName ? (
						<p className="text-sm text-red-400">{t(errors.firstName.message as string)}</p>
					) : null}
				</div>

				<div className="space-y-2">
					<Label htmlFor="lastName">{t("lastName")}</Label>
					<Input id="lastName" {...register("lastName")} placeholder={t("lastName")} />
					{errors.lastName ? (
						<p className="text-sm text-red-400">{t(errors.lastName.message as string)}</p>
					) : null}
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="email">{t("email")}</Label>
				<Input id="email" type="email" {...register("email")} placeholder="name@example.com" />
				{errors.email ? (
					<p className="text-sm text-red-400">{t(errors.email.message as string)}</p>
				) : null}
			</div>

			<div className="space-y-2">
				<Label htmlFor="phone">{t("phone")}</Label>
				<Input id="phone" type="tel" {...register("phone")} placeholder="+49 151 12345678" />
				{errors.phone ? (
					<p className="text-sm text-red-400">{t(errors.phone.message as string)}</p>
				) : null}
			</div>

			<div className="space-y-2">
				<Label htmlFor="carDescription">{t("carDescription")}</Label>
				<Textarea
					id="carDescription"
					{...register("carDescription")}
					placeholder={t("carDescriptionHint")}
					rows={4}
				/>
			</div>

			<div className="flex items-start gap-3">
				<Checkbox
					id="gdpr"
					checked={gdprValue}
					onCheckedChange={(checked) =>
						setValue("gdprAccepted", checked === true, { shouldValidate: true })
					}
				/>
				<div className="grid gap-1.5 leading-none">
					<Label htmlFor="gdpr" className="text-sm font-normal">
						{t("gdpr")}
					</Label>
					{errors.gdprAccepted ? (
						<p className="text-sm text-red-400">{t(errors.gdprAccepted.message as string)}</p>
					) : null}
				</div>
			</div>

			<Button
				type="submit"
				className="mt-2 w-full bg-linear-to-r from-[#7b2dff] to-[#b303f2] py-6 text-lg font-bold text-white hover:shadow-[0_0_30px_rgba(123,45,255,0.5)]"
			>
				{t("next")}
			</Button>
		</form>
	);
};
