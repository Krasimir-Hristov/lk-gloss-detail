"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { ServiceSwipeCard } from "@/features/assessment/components/service-swipe-card";
import { useAssessmentStore } from "@/features/assessment/stores/assessment-store";

import type { ServiceSelection } from "@/features/assessment/schemas/assessment.schema";

// ── DB Service shape ────────────────────────────────────────────────────────

type DbService = {
	id: string;
	name: string;
	short_description: string | null;
	icon: string;
	image_url: string | null;
	category: string;
	price_small: number;
	price_medium: number;
	price_large: number;
	price_suv: number;
	duration_hours: number;
	sort_order: number;
};

// ── Dev-only logger (silent in production) ──────────────────────────────────

const isDev = process.env.NODE_ENV === "development";
const devLog = (...args: unknown[]) => {
	if (isDev) console.log(...args);
};

// ── Component ──────────────────────────────────────────────────────────────

type ServiceSwipeDeckProps = {
	onComplete: () => void;
};

export const ServiceSwipeDeck = ({ onComplete }: ServiceSwipeDeckProps) => {
	const t = useTranslations("Assessment.services");

	const acceptService = useAssessmentStore((s) => s.acceptService);
	const rejectService = useAssessmentStore((s) => s.rejectService);
	const setServices = useAssessmentStore((s) => s.setServices);

	const [dbServices, setDbServices] = useState<DbService[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isComplete, setIsComplete] = useState(false);

	const totalCards = dbServices.length;

	// Keep currentIndex in a ref so callbacks always see the latest value
	const currentIndexRef = useRef(0);
	useEffect(() => {
		currentIndexRef.current = currentIndex;
	}, [currentIndex]);

	// Fetch services from DB
	useEffect(() => {
		const fetchServices = async () => {
			try {
				const res = await fetch("/api/services");
				if (!res.ok) throw new Error("Failed to fetch services");
				const data = (await res.json()) as DbService[];
				setDbServices(data);

				// Initialize services in store
				const selections: ServiceSelection[] = data.map((s) => ({
					serviceId: s.id,
					accepted: false,
				}));
				setServices(selections);
				devLog("[ServiceSwipeDeck] ✅ Loaded", data.length, "services from DB");
			} catch (err) {
				console.error("[ServiceSwipeDeck] Failed to load services:", err);
			} finally {
				setIsLoading(false);
			}
		};
		fetchServices();
	}, [setServices]);

	// ── Log final assessment state ──────────────────────────────────────────

	const logFinalState = useCallback(() => {
		const state = useAssessmentStore.getState();

		devLog(
			"\n%c══════════════════════════════════════════════",
			"color: #d1bcff; font-weight: bold;",
		);
		devLog(
			"%c🚗 LK Gloss & Detail — Final Assessment State",
			"color: #7b2dff; font-size: 16px; font-weight: bold;",
		);
		devLog(
			"%c══════════════════════════════════════════════",
			"color: #d1bcff; font-weight: bold;",
		);

		devLog("\n%c📸 PHOTOS (%d):", "color: #ebb2ff; font-weight: bold;", state.photos.length);
		if (state.photos.length === 0) {
			devLog("  ⚠️ No photos uploaded");
		} else {
			console.table(
				state.photos.map((p) => ({
					angle: p.angle,
					status: p.validationStatus,
					carSize: p.carSize ?? "—",
					dirtLevel: p.dirtLevel ?? "—",
					carDescription: p.carDescription ?? "—",
				})),
			);
		}

		const accepted = state.services.filter((s) => s.accepted);
		const rejected = state.services.filter((s) => !s.accepted);

		devLog(
			"\n%c🛠️ SERVICES (%d total, %d accepted, %d rejected):",
			"color: #ebb2ff; font-weight: bold;",
			state.services.length,
			accepted.length,
			rejected.length,
		);

		if (accepted.length > 0) {
			devLog("%c  ✅ Accepted:", "color: #4ade80; font-weight: bold;");
			accepted.forEach((s) => devLog(`     • ${s.serviceId}`));
		}

		if (rejected.length > 0) {
			devLog("%c  ❌ Rejected:", "color: #f87171; font-weight: bold;");
			rejected.forEach((s) => devLog(`     • ${s.serviceId}`));
		}

		if (accepted.length === 0) {
			devLog(
				"\n%c⚠️ EDGE CASE: Client selected ZERO services — app should handle gracefully",
				"color: #fbbf24; font-weight: bold;",
			);
		}

		devLog(
			"\n%c══════════════════════════════════════════════\n",
			"color: #d1bcff; font-weight: bold;",
		);
	}, []);

	// ── Advance card and manage state ───────────────────────────────────────

	const advanceCard = useCallback(() => {
		const nextIndex = currentIndexRef.current + 1;
		if (nextIndex >= totalCards) {
			setIsComplete(true);
			devLog("[ServiceSwipeDeck] 🏁 All cards swiped. Logging final state...");
			setTimeout(() => {
				logFinalState();
				onComplete();
			}, 150);
		} else {
			setCurrentIndex(nextIndex);
		}
	}, [totalCards, logFinalState, onComplete]);

	const handleAccept = useCallback(
		(serviceId: string) => {
			devLog("[ServiceSwipeDeck] ✅ Swipe RIGHT — accepted:", serviceId);
			acceptService(serviceId);
			advanceCard();
		},
		[acceptService, advanceCard],
	);

	const handleReject = useCallback(
		(serviceId: string) => {
			devLog("[ServiceSwipeDeck] ❌ Swipe LEFT — rejected:", serviceId);
			rejectService(serviceId);
			advanceCard();
		},
		[rejectService, advanceCard],
	);

	// ── Loading state ───────────────────────────────────────────────────────

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7b2dff] border-t-transparent" />
				<p className="mt-4 text-sm text-[#ccc3d9]">{t("loading")}</p>
			</div>
		);
	}

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
						{dbServices.map((service, index) => {
							const isBehind = index < currentIndex;
							if (isBehind) return null;

							const isTop = index === currentIndex;
							const stackIndex = index - currentIndex;

							return (
								<ServiceSwipeCard
									key={service.id}
									service={service}
									onAcceptAction={handleAccept}
									onRejectAction={handleReject}
									isTop={isTop}
									stackIndex={stackIndex}
								/>
							);
						})}
					</div>

					{/* Progress indicator */}
					<div className="mt-24 flex items-center gap-2">
						{dbServices.map((_, index) => (
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
