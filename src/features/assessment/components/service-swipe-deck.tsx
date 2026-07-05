"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { ServiceSwipeCard } from "@/features/assessment/components/service-swipe-card";
import { ASSESSMENT_SERVICES } from "@/features/assessment/data/assessment-services";
import { useAssessmentStore } from "@/features/assessment/stores/assessment-store";

import type { ServiceSelection } from "@/features/assessment/schemas/assessment.schema";

export const ServiceSwipeDeck = () => {
	const t = useTranslations("Assessment.services");
	const { acceptService, rejectService, setServices } = useAssessmentStore();

	const [currentIndex, setCurrentIndex] = useState(0);
	const [isComplete, setIsComplete] = useState(false);

	const totalCards = ASSESSMENT_SERVICES.length;

	// Keep currentIndex in a ref so callbacks always see the latest value
	const currentIndexRef = useRef(0);
	useEffect(() => {
		currentIndexRef.current = currentIndex;
	}, [currentIndex]);

	// Initialize services in store (useEffect — must not call setState during render)
	const initializedRef = useRef(false);
	useEffect(() => {
		if (initializedRef.current) return;
		initializedRef.current = true;

		const services: ServiceSelection[] = ASSESSMENT_SERVICES.map((s) => ({
			serviceId: s.id,
			name: s.id,
			description: "",
			icon: "",
			priceHint: "",
			accepted: false,
		}));
		setServices(services);
		console.log(
			"[ServiceSwipeDeck] ✅ Initialized services in store:",
			services.length,
			"services",
		);
	}, [setServices]);

	// ── Log final assessment state ──────────────────────────────────────────

	const logFinalState = useCallback(() => {
		const state = useAssessmentStore.getState();

		console.log(
			"\n%c══════════════════════════════════════════════",
			"color: #d1bcff; font-weight: bold;",
		);
		console.log(
			"%c🚗 LK Gloss & Detail — Final Assessment State",
			"color: #7b2dff; font-size: 16px; font-weight: bold;",
		);
		console.log(
			"%c══════════════════════════════════════════════",
			"color: #d1bcff; font-weight: bold;",
		);

		console.log("\n%c📸 PHOTOS (%d):", "color: #ebb2ff; font-weight: bold;", state.photos.length);
		if (state.photos.length === 0) {
			console.log("  ⚠️ No photos uploaded");
		} else {
			console.table(
				state.photos.map((p) => ({
					angle: p.angle,
					status: p.validationStatus,
					carSize: p.carSize ?? "—",
					dirtLevel: p.dirtLevel ?? "—",
					carDescription: p.carDescription ?? "—",
					uploadedUrl: p.uploadedUrl ? "✅" : "❌",
				})),
			);
		}

		const accepted = state.services.filter((s) => s.accepted);
		const rejected = state.services.filter((s) => !s.accepted);

		console.log(
			"\n%c🛠️ SERVICES (%d total, %d accepted, %d rejected):",
			"color: #ebb2ff; font-weight: bold;",
			state.services.length,
			accepted.length,
			rejected.length,
		);

		if (accepted.length > 0) {
			console.log("%c  ✅ Accepted:", "color: #4ade80; font-weight: bold;");
			accepted.forEach((s) => console.log(`     • ${s.serviceId}`));
		}

		if (rejected.length > 0) {
			console.log("%c  ❌ Rejected:", "color: #f87171; font-weight: bold;");
			rejected.forEach((s) => console.log(`     • ${s.serviceId}`));
		}

		if (accepted.length === 0 && rejected.length === 0) {
			console.log("  ⚠️ No services in store");
		}

		// Edge case: client rejects all services
		if (accepted.length === 0) {
			console.log(
				"\n%c⚠️ EDGE CASE: Client selected ZERO services — app should handle gracefully",
				"color: #fbbf24; font-weight: bold;",
			);
		}

		console.log(
			"\n%c══════════════════════════════════════════════\n",
			"color: #d1bcff; font-weight: bold;",
		);
	}, []);

	// ── Advance card and manage state ───────────────────────────────────────

	const advanceCard = useCallback(() => {
		const nextIndex = currentIndexRef.current + 1;
		if (nextIndex >= totalCards) {
			setIsComplete(true);
			console.log("[ServiceSwipeDeck] 🏁 All cards swiped. Logging final state...");
			// Small delay to let Zustand finish updating
			setTimeout(() => {
				logFinalState();
			}, 150);
		} else {
			setCurrentIndex(nextIndex);
		}
	}, [totalCards, logFinalState]);

	const handleAccept = useCallback(
		(serviceId: string) => {
			console.log("[ServiceSwipeDeck] ✅ Swipe RIGHT — accepted:", serviceId);
			acceptService(serviceId);
			advanceCard();
		},
		[acceptService, advanceCard],
	);

	const handleReject = useCallback(
		(serviceId: string) => {
			console.log("[ServiceSwipeDeck] ❌ Swipe LEFT — rejected:", serviceId);
			rejectService(serviceId);
			advanceCard();
		},
		[rejectService, advanceCard],
	);

	// Get services data from i18n
	const getServiceData = (serviceKey: string) => {
		const rawData = t.raw(serviceKey) as {
			title: string;
			subtitle: string;
			features: string[];
			tag: string;
			duration: string;
		};
		return rawData;
	};

	return (
		<div className="flex flex-col items-center">
			{/* Heading */}
			<div className="mb-8 text-center">
				<span className="mb-4 block text-[12px] font-bold tracking-widest text-[#d1bcff] uppercase">
					{t("headingTag")}
				</span>
				<h2 className="text-2xl font-bold text-white md:text-3xl">{t("headingTitle")}</h2>
				<p className="mt-2 text-sm text-[#ccc3d9]">{t("headingDescription")}</p>
			</div>

			{/* Card stack container */}
			{!isComplete ? (
				<>
					<div className="relative mx-auto h-130 w-full max-w-95">
						{ASSESSMENT_SERVICES.map((service, index) => {
							const isBehind = index < currentIndex;
							if (isBehind) return null;

							const isTop = index === currentIndex;
							const stackIndex = index - currentIndex;

							return (
								<ServiceSwipeCard
									key={service.id}
									service={service}
									serviceData={getServiceData(service.key)}
									onAccept={handleAccept}
									onReject={handleReject}
									isTop={isTop}
									stackIndex={stackIndex}
								/>
							);
						})}
					</div>

					{/* Progress indicator */}
					<div className="mt-24 flex items-center gap-2">
						{ASSESSMENT_SERVICES.map((_, index) => (
							<div
								key={index}
								className={`h-1.5 rounded-full transition-all duration-300 ${
									index < currentIndex
										? "w-6 bg-[#7b2dff]"
										: index === currentIndex
											? "w-8 bg-[#d1bcff]"
											: "w-1.5 bg-[#353534]"
								}`}
							/>
						))}
						<span className="ml-3 text-xs text-[#ccc3d9]">
							{currentIndex + 1} / {totalCards}
						</span>
					</div>
				</>
			) : (
				/* Completion state */
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="rounded-2xl border border-[#7b2dff]/20 bg-[#201f1f] p-8 text-center"
				>
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#7b2dff] to-[#b303f2]">
						<span
							className="material-symbols-outlined text-3xl text-white"
							style={{ fontVariationSettings: "'FILL' 1" }}
						>
							check
						</span>
					</div>
					<h3 className="mb-2 text-xl font-bold text-white">{t("completeTitle")}</h3>
					<p className="text-sm text-[#ccc3d9]">{t("completeDescription")}</p>
				</motion.div>
			)}
		</div>
	);
};
