"use client";

import { motion } from "framer-motion";
import { AlertCircle, Check, RotateCcw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { ServiceSwipeCard } from "@/features/assessment/components/ServiceSwipeCard";
import { useAssessmentStore } from "@/features/assessment/stores/assessmentStore";

import type { ServiceSelection } from "@/features/assessment/schemas/assessmentSchema";
import type { AssessmentService } from "@/features/assessment/types/assessmentService";

type ServiceSwipeDeckProps = {
	onCompleteAction: () => void;
};

export const ServiceSwipeDeck: React.FC<ServiceSwipeDeckProps> = ({ onCompleteAction }) => {
	const t = useTranslations("Assessment.services");
	const tSwipe = useTranslations("Assessment.swipe");
	const tErrors = useTranslations("Errors");

	const acceptService = useAssessmentStore((s) => s.acceptService);
	const rejectService = useAssessmentStore((s) => s.rejectService);
	const setServices = useAssessmentStore((s) => s.setServices);
	const storeServices = useAssessmentStore((s) => s.services);

	const [dbServices, setDbServices] = useState<AssessmentService[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isComplete, setIsComplete] = useState(false);
	const [retryTrigger, setRetryTrigger] = useState(0);

	const totalCards = dbServices.length;
	const acceptedCount = storeServices.filter((s) => s.accepted).length;

	// Keep currentIndex in a ref so callbacks always see the latest value
	const currentIndexRef = useRef(0);
	useEffect(() => {
		currentIndexRef.current = currentIndex;
	}, [currentIndex]);

	// Fetch active services from DB
	useEffect(() => {
		let isCancelled = false;
		const loadServices = async () => {
			try {
				const res = await fetch("/api/services");
				if (!res.ok) throw new Error("Failed to fetch services");
				const data = (await res.json()) as AssessmentService[];
				if (isCancelled) return;
				setDbServices(data);

				const selections: ServiceSelection[] = data.map((s) => ({
					serviceId: s.id,
					accepted: false,
				}));
				setServices(selections);

				if (data.length === 0) {
					setIsComplete(true);
				}
			} catch (err: unknown) {
				if (isCancelled) return;
				const errorMsg = err instanceof Error ? err.message : "Failed to load services";
				console.error("[ServiceSwipeDeck] Failed to load services:", errorMsg);
				setFetchError(errorMsg);
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		};

		loadServices();
		return () => {
			isCancelled = true;
		};
	}, [setServices, retryTrigger]);

	const handleRetry = () => {
		setIsLoading(true);
		setFetchError(null);
		setIsComplete(false);
		setCurrentIndex(0);
		setRetryTrigger((prev) => prev + 1);
	};

	const advanceCard = useCallback(() => {
		const nextIndex = currentIndexRef.current + 1;
		if (nextIndex >= totalCards) {
			setIsComplete(true);
			onCompleteAction();
		} else {
			setCurrentIndex(nextIndex);
		}
	}, [totalCards, onCompleteAction]);

	const handleAccept = useCallback(
		(serviceId: string) => {
			acceptService(serviceId);
			advanceCard();
		},
		[acceptService, advanceCard],
	);

	const handleReject = useCallback(
		(serviceId: string) => {
			rejectService(serviceId);
			advanceCard();
		},
		[rejectService, advanceCard],
	);

	// ── Error state ───────────────────────────────────────────────────────
	if (fetchError) {
		return (
			<div
				role="alert"
				aria-live="assertive"
				className="flex flex-col items-center justify-center rounded-2xl border border-amber-400/35 bg-amber-500/[0.06] p-8 text-center"
			>
				<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/15 text-amber-300">
					<AlertCircle className="h-6 w-6" aria-hidden="true" />
				</div>
				<p className="font-display mb-2 text-lg font-bold text-white">
					{tErrors("servicesUnavailable.title")}
				</p>
				<p className="mb-6 max-w-md text-sm text-[#b8b2c7]">
					{tErrors("servicesUnavailable.description")}
				</p>
				<button
					type="button"
					onClick={handleRetry}
					aria-label={t("retry")}
					className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] to-[#c026ff] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_28px_-6px_rgba(123,45,255,0.5)] transition-all hover:brightness-110 active:scale-95"
				>
					<RotateCcw className="h-4 w-4" aria-hidden="true" />
					<span>{t("retry")}</span>
				</button>
			</div>
		);
	}

	// ── Loading state ───────────────────────────────────────────────────────
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<div className="h-[460px] w-full max-w-[390px] animate-pulse rounded-3xl border border-white/[0.08] bg-white/[0.04]" />
				<p className="mt-5 font-mono text-xs tracking-wider text-[#9b93ad] uppercase">
					{t("loading")}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center">
			{/* Sub-header & Live Selection Pill */}
			<div className="mb-6 flex w-full flex-col items-center gap-3 text-center">
				<div className="flex flex-wrap items-center justify-center gap-2">
					<span className="inline-flex items-center gap-1.5 rounded-full border border-[#a855f7]/40 bg-[#7b2dff]/15 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.16em] text-[#e9d5ff] uppercase">
						<Sparkles className="h-3 w-3" aria-hidden="true" />
						{t("headingTag")}
					</span>
					<span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] font-semibold text-[#d1bcff]">
						{tSwipe("selectedCount", { count: acceptedCount })}
					</span>
				</div>
				<p className="max-w-md text-sm leading-relaxed text-[#b8b2c7]">{t("headingDescription")}</p>
			</div>

			{/* Card stack container */}
			{!isComplete ? (
				<>
					<div className="relative mx-auto mb-26 h-[430px] w-full max-w-[390px] min-[390px]:h-[450px] sm:mb-28 sm:h-[490px]">
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

					{/* Progress Dots & Hint */}
					<div className="flex flex-col items-center gap-2.5 text-center">
						<div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
							{dbServices.map((service, index) => (
								<div
									key={service.id}
									className={`h-1.5 rounded-full transition-all duration-300 ${
										index < currentIndex
											? "w-5 bg-[#7b2dff]"
											: index === currentIndex
												? "w-8 bg-linear-to-r from-[#7b2dff] to-[#c026ff] shadow-[0_0_10px_rgba(192,38,255,0.7)]"
												: "w-1.5 bg-white/15"
									}`}
								/>
							))}
							<span className="ml-2.5 font-mono text-xs font-semibold text-[#9b93ad]">
								{currentIndex + 1} / {totalCards}
							</span>
						</div>
						<p className="text-xs text-[#7a738c]">{tSwipe("hint")}</p>
					</div>
				</>
			) : (
				/* Completion transition card */
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="w-full rounded-2xl border border-[#7b2dff]/35 bg-[#7b2dff]/10 p-8 text-center"
				>
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-[#7b2dff] to-[#c026ff] shadow-[0_0_32px_rgba(192,38,255,0.45)]">
						<Check className="h-8 w-8 stroke-[2.5] text-white" aria-hidden="true" />
					</div>
					<h3 className="font-display mb-2 text-xl font-extrabold text-white">
						{t("completeTitle")}
					</h3>
					<p className="text-sm text-[#b8b2c7]">{t("completeDescription")}</p>
				</motion.div>
			)}
		</div>
	);
};
