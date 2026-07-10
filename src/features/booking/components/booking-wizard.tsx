"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect } from "react";

import { BookingProgress } from "@/features/booking/components/booking-progress";
import { StepClientInfo } from "@/features/booking/components/step-client-info";
import { StepDatePicker } from "@/features/booking/components/step-date-picker";
import { StepServices } from "@/features/booking/components/step-services";
import { StepSummary } from "@/features/booking/components/step-summary";
import { useBookingStore } from "@/features/booking/stores/booking-store";

const BookingWizardContent = () => {
	const t = useTranslations("Booking");
	const searchParams = useSearchParams();
	const { step, setPreselectedServices } = useBookingStore();

	useEffect(() => {
		const servicesParam = searchParams.get("services");
		if (servicesParam) {
			const serviceIds = servicesParam.split(",").filter(Boolean);
			setPreselectedServices(serviceIds);
		}
	}, [searchParams, setPreselectedServices]);

	const stepComponents = {
		1: <StepClientInfo />,
		2: <StepServices />,
		3: <StepDatePicker />,
		4: <StepSummary />,
	};

	return (
		<div className="mx-auto w-full max-w-2xl px-4 py-8">
			<div className="mb-6 text-center">
				<h1 className="font-['Montserrat'] text-3xl font-bold text-white sm:text-4xl">
					{t("title")}
				</h1>
				<p className="mt-2 text-white/60">{t("subtitle")}</p>
			</div>

			<BookingProgress currentStep={step} />

			<AnimatePresence mode="wait">
				<motion.div
					key={step}
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -20 }}
					transition={{ duration: 0.25 }}
				>
					{stepComponents[step]}
				</motion.div>
			</AnimatePresence>
		</div>
	);
};

export const BookingWizard = () => {
	return (
		<Suspense fallback={<div className="py-12 text-center text-white/70">Loading...</div>}>
			<BookingWizardContent />
		</Suspense>
	);
};
