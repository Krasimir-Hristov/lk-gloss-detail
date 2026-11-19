"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { Suspense, useEffect, useRef } from "react";

import { BookingDossier } from "@/features/booking/components/BookingDossier";
import { BookingProgress } from "@/features/booking/components/BookingProgress";
import { StepClientInfo } from "@/features/booking/components/StepClientInfo";
import { StepDatePicker } from "@/features/booking/components/StepDatePicker";
import { StepServices } from "@/features/booking/components/StepServices";
import { StepSummary } from "@/features/booking/components/StepSummary";
import { useBookingStore } from "@/features/booking/stores/bookingStore";

const STEP_META = {
	1: { icon: UserCheck, titleKey: "step1.title" },
	2: { icon: Sparkles, titleKey: "step2.title" },
	3: { icon: CalendarDays, titleKey: "step3.title" },
	4: { icon: ShieldCheck, titleKey: "step4.title" },
} as const;

const BookingWizardSkeleton: React.FC = () => {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 md:px-12">
			<div className="mb-10 flex flex-col items-center gap-4">
				<div className="h-7 w-56 animate-pulse rounded-full bg-white/[0.06]" />
				<div className="h-12 w-72 animate-pulse rounded-xl bg-white/[0.08]" />
				<div className="h-5 w-80 max-w-full animate-pulse rounded-lg bg-white/[0.05]" />
			</div>
			<div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
				<div className="space-y-6 lg:col-span-7">
					<div className="h-24 animate-pulse rounded-2xl bg-white/[0.05]" />
					<div className="h-112 animate-pulse rounded-3xl bg-white/[0.05]" />
				</div>
				<div className="lg:col-span-5">
					<div className="h-128 animate-pulse rounded-3xl bg-white/[0.05]" />
				</div>
			</div>
		</div>
	);
};

const BookingWizardContent: React.FC = () => {
	const t = useTranslations("Booking");
	const searchParams = useSearchParams();
	const { step, setStep, setPreselectedServices } = useBookingStore();
	const stageRef = useRef<HTMLDivElement>(null);
	const isFirstRender = useRef(true);

	useEffect(() => {
		const servicesParam = searchParams.get("services");
		if (servicesParam) {
			const serviceIds = servicesParam.split(",").filter(Boolean);
			setPreselectedServices(serviceIds);
		}
	}, [searchParams, setPreselectedServices]);

	// Keep the active step cleanly visible when transitioning between steps
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		if (stageRef.current) {
			const top = stageRef.current.getBoundingClientRect().top + window.scrollY - 108;
			window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
		}
	}, [step]);

	const stepComponents = {
		1: <StepClientInfo />,
		2: <StepServices />,
		3: <StepDatePicker />,
		4: <StepSummary />,
	};

	const activeMeta = STEP_META[step];
	const ActiveStepIcon = activeMeta.icon;

	return (
		<div data-testid="booking-wizard" className="relative mx-auto w-full max-w-7xl px-4 md:px-12">
			{/* Editorial Studio Header */}
			<header className="mb-8 flex flex-col items-start gap-4 sm:mb-10 lg:mb-12">
				<div className="inline-flex items-center gap-2.5 rounded-full border border-[#7b2dff]/35 bg-[#7b2dff]/10 px-4 py-1.5 backdrop-blur-md">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c026ff] opacity-75" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-[#d8b4fe]" />
					</span>
					<span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#e5d4ff] uppercase">
						{t("badge")}
					</span>
				</div>

				<div className="space-y-2.5">
					<h1 className="font-display text-3xl leading-[1.06] font-black tracking-[-0.03em] sm:text-5xl lg:text-[3.25rem]">
						<span className="metallic-text">{t("title")}</span>
					</h1>
					<p className="max-w-2xl text-base leading-relaxed text-[#b8b2c7] sm:text-lg">
						{t("subtitle")}
					</p>
				</div>
			</header>

			{/* 12-Column Split-Screen Concierge Layout */}
			<div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-12 xl:gap-9">
				{/* Left Main Stage: Progress Rail + Active Step Obsidian Card */}
				<div ref={stageRef} className="lg:col-span-7">
					<BookingProgress currentStep={step} onStepSelect={setStep} />

					<div className="obsidian-card relative overflow-hidden rounded-3xl p-5 sm:p-7 md:p-8">
						{/* Specular Top Hairline & Ambient Corner Aura */}
						<div className="pointer-events-none absolute top-0 right-10 left-10 h-px bg-linear-to-r from-transparent via-[#c026ff]/75 to-transparent" />
						<div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#7b2dff]/12 blur-[90px]" />

						{/* Active Step Card Header */}
						<div className="relative mb-6 flex items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
							<div className="flex items-center gap-3.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#a855f7]/45 bg-[#7b2dff]/15 text-[#e9d5ff] shadow-[0_0_20px_rgba(123,45,255,0.28)]">
									<ActiveStepIcon className="h-5 w-5" aria-hidden="true" />
								</div>
								<div>
									<p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[#b996ff] uppercase">
										{t("stepCounter", { current: step, total: 4 })}
									</p>
									<h2 className="font-display mt-0.5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
										{t(activeMeta.titleKey)}
									</h2>
								</div>
							</div>

							<span className="hidden rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs font-bold tracking-widest text-[#9b93ad] sm:inline-flex">
								0{step} / 04
							</span>
						</div>

						{/* Animated Step Viewport */}
						<div className="relative">
							<AnimatePresence mode="wait">
								<motion.div
									key={step}
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
								>
									{stepComponents[step]}
								</motion.div>
							</AnimatePresence>
						</div>
					</div>
				</div>

				{/* Right Sticky Live Booking Dossier */}
				<div className="lg:sticky lg:top-24 lg:col-span-5">
					<BookingDossier />
				</div>
			</div>
		</div>
	);
};

export const BookingWizard: React.FC = () => {
	return (
		<Suspense fallback={<BookingWizardSkeleton />}>
			<BookingWizardContent />
		</Suspense>
	);
};
