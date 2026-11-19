"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Check, Clock, Sparkles, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { createElement, useRef, useState } from "react";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { getLocalizedText } from "@/features/admin/types/servicesTypes";
import { getIcon } from "@/lib/iconMap";

import type { AssessmentService } from "@/features/assessment/types/assessmentService";

type ServiceSwipeCardProps = {
	service: AssessmentService;
	onAcceptAction: (serviceId: string) => void;
	onRejectAction: (serviceId: string) => void;
	isTop: boolean;
	stackIndex: number;
};

export const ServiceSwipeCard: React.FC<ServiceSwipeCardProps> = ({
	service,
	onAcceptAction,
	onRejectAction,
	isTop,
	stackIndex,
}) => {
	const t = useTranslations("Assessment.services");
	const tSwipe = useTranslations("Assessment.swipe");
	const locale = useLocale();
	const [isExiting, setIsExiting] = useState<"left" | "right" | null>(null);
	const cardRef = useRef<HTMLDivElement>(null);

	const x = useMotionValue(0);
	const rotate = useTransform(x, [-250, 0, 250], [-20, 0, 20]);

	const acceptBorderOpacity = useTransform(x, [0, 90, 220], [0, 0.55, 1]);
	const rejectBorderOpacity = useTransform(x, [-220, -90, 0], [1, 0.55, 0]);

	const iconComponent = getIcon(service.icon);

	const handleDragEnd = (_: unknown, info: PanInfo) => {
		const threshold = 120;
		if (info.offset.x > threshold) {
			setIsExiting("right");
			setTimeout(() => onAcceptAction(service.id), 300);
		} else if (info.offset.x < -threshold) {
			setIsExiting("left");
			setTimeout(() => onRejectAction(service.id), 300);
		}
	};

	const handleAccept = () => {
		if (isExiting) return;
		setIsExiting("right");
		setTimeout(() => onAcceptAction(service.id), 300);
	};

	const handleReject = () => {
		if (isExiting) return;
		setIsExiting("left");
		setTimeout(() => onRejectAction(service.id), 300);
	};

	// Stack depth offset for background cards
	const yOffset = isTop ? 0 : Math.min(stackIndex, 3) * 10;
	const scaleValue = isTop ? 1 : Math.max(0.88, 1 - stackIndex * 0.045);

	const durationText = `${service.duration_hours}h`;
	const priceText = `€${service.price_small} – €${service.price_suv}`;

	const localizedName = getLocalizedText(service.name, locale);
	const localizedDesc = getLocalizedText(service.short_description, locale);

	let displayName: string | undefined;
	let displayDescription: string | undefined;
	let displayCategory: string | undefined;

	try {
		if (typeof service.name === "string") {
			displayName = t.raw(`cards.${service.name}.title`) as string | undefined;
			displayDescription = t.raw(`cards.${service.name}.description`) as string | undefined;
			displayCategory = t.raw(`cards.${service.name}.tag`) as string | undefined;
		}
	} catch {
		// Fallback to localized DB strings
	}

	displayName = displayName || localizedName;
	displayDescription = displayDescription || localizedDesc;

	return (
		<motion.div
			ref={cardRef}
			drag={isTop && !isExiting ? "x" : false}
			dragConstraints={{ left: 0, right: 0 }}
			dragElastic={0.8}
			onDragEnd={handleDragEnd}
			style={{
				x,
				rotate,
				position: "absolute",
				inset: 0,
				zIndex: Math.max(1, 10 - stackIndex),
				y: yOffset,
				touchAction: isTop ? "pan-y" : undefined,
			}}
			animate={
				isExiting
					? {
							x: isExiting === "right" ? 560 : -560,
							rotate: isExiting === "right" ? 26 : -26,
							opacity: 0,
						}
					: {
							scale: scaleValue,
							opacity: isTop ? 1 : Math.max(0.55, 1 - stackIndex * 0.18),
						}
			}
			transition={{
				x: isExiting
					? { duration: 0.38, ease: "easeOut" }
					: { type: "spring", stiffness: 300, damping: 26 },
				opacity: { duration: 0.28 },
			}}
			className={
				isTop
					? "obsidian-card carbon-pattern cursor-grab rounded-3xl p-1.5 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)] active:cursor-grabbing"
					: "obsidian-card pointer-events-none rounded-3xl p-1.5"
			}
		>
			{/* Specular top light hairline */}
			<div className="pointer-events-none absolute top-0 right-10 left-10 z-20 h-px bg-linear-to-r from-transparent via-[#c026ff]/65 to-transparent" />

			{/* Dynamic Accept Glow Border */}
			<motion.div
				className="pointer-events-none absolute inset-0 z-20 rounded-3xl border-2 border-emerald-400 shadow-[inset_0_0_32px_rgba(16,185,129,0.3)]"
				style={{ opacity: acceptBorderOpacity }}
			/>

			{/* Dynamic Reject Glow Border */}
			<motion.div
				className="pointer-events-none absolute inset-0 z-20 rounded-3xl border-2 border-rose-500 shadow-[inset_0_0_32px_rgba(244,63,94,0.3)]"
				style={{ opacity: rejectBorderOpacity }}
			/>

			<div className="flex h-full w-full flex-col overflow-hidden rounded-[1.25rem] bg-[#0e0e14]">
				{/* Top Hero Media */}
				<div className="relative h-[48%] w-full shrink-0 overflow-hidden bg-[#0a0a0f] sm:h-[54%]">
					{service.image_url ? (
						<ImageWithFallback
							src={service.image_url}
							alt={displayName ?? "Service image"}
							fill
							sizes="(max-width: 420px) 100vw, 420px"
							className="object-cover"
							priority={isTop}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#161026] to-[#0a0a0f]">
							{createElement(iconComponent, { className: "h-16 w-16 text-[#7b2dff]/45" })}
						</div>
					)}
					<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0e0e14] via-[#0e0e14]/25 to-black/25" />

					{/* Category Badge top-left */}
					<span className="absolute top-3 left-3 z-10 inline-flex items-center rounded-full border border-[#a855f7]/45 bg-black/70 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] text-[#e9d5ff] uppercase backdrop-blur-md sm:top-3.5 sm:left-3.5 sm:px-3 sm:tracking-[0.14em]">
						{displayCategory ?? service.category}
					</span>

					{/* Floating Icon Badge bottom-left */}
					{isTop ? (
						<motion.div
							initial={{ opacity: 0, scale: 0.75 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.12, duration: 0.25 }}
							className="absolute bottom-3 left-3.5 flex h-11 w-11 items-center justify-center rounded-xl border border-[#a855f7]/45 bg-black/75 shadow-[0_0_24px_rgba(123,45,255,0.35)] backdrop-blur-md sm:bottom-3.5 sm:left-4 sm:h-12 sm:w-12"
						>
							{createElement(iconComponent, { className: "h-5 w-5 text-[#d8b4fe] sm:h-6 sm:w-6" })}
						</motion.div>
					) : null}
				</div>

				{/* Card Body */}
				<div className="relative z-10 flex flex-1 flex-col justify-between px-4 pt-3.5 pb-4 sm:px-5 sm:pt-4 sm:pb-5">
					<div>
						<h3 className="font-display line-clamp-2 text-lg leading-snug font-extrabold tracking-tight text-white sm:text-2xl">
							{displayName}
						</h3>
						<p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[#b8b2c7] sm:mt-1.5 sm:text-sm">
							{displayDescription}
						</p>
					</div>

					{/* Price & Duration Telemetry Pills */}
					<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3 sm:mt-4 sm:pt-3.5">
						<span className="font-display text-base font-black tracking-tight text-white sm:text-lg">
							{priceText}
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs font-semibold text-[#d1bcff] sm:px-3">
							<Clock className="h-3.5 w-3.5 text-[#a855f7]" aria-hidden="true" />
							<span>{durationText}</span>
						</span>
					</div>
				</div>
			</div>

			{/* Drag Stamp Indicators */}
			{isTop && !isExiting ? (
				<>
					<motion.div
						className="pointer-events-none absolute top-14 right-5 z-30 -rotate-12 rounded-xl border-2 border-emerald-400 bg-emerald-950/85 px-3.5 py-1.5 backdrop-blur-md"
						style={{ opacity: acceptBorderOpacity }}
					>
						<span className="font-display inline-flex items-center gap-1.5 text-sm font-black tracking-wider text-emerald-300 uppercase">
							<Sparkles className="h-4 w-4" aria-hidden="true" />
							{tSwipe("accept")}
						</span>
					</motion.div>

					<motion.div
						className="pointer-events-none absolute top-14 left-5 z-30 rotate-12 rounded-xl border-2 border-rose-500 bg-rose-950/85 px-3.5 py-1.5 backdrop-blur-md"
						style={{ opacity: rejectBorderOpacity }}
					>
						<span className="font-display inline-flex items-center gap-1.5 text-sm font-black tracking-wider text-rose-300 uppercase">
							<X className="h-4 w-4" aria-hidden="true" />
							{tSwipe("reject")}
						</span>
					</motion.div>
				</>
			) : null}

			{/* Tactile Decline & Accept Buttons below the card */}
			{isTop && !isExiting ? (
				<div className="absolute -bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-7">
					<button
						type="button"
						onClick={handleReject}
						aria-label={`${tSwipe("reject")}: ${displayName ?? ""}`}
						className="group flex cursor-pointer flex-col items-center gap-1.5"
					>
						<div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-[#12121a] text-[#b8b2c7] shadow-lg transition-all duration-200 group-hover:scale-105 group-hover:border-rose-500/70 group-hover:bg-rose-500/15 group-hover:text-rose-400 group-active:scale-95">
							<X className="h-6 w-6" aria-hidden="true" />
						</div>
						<span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#9b93ad] uppercase transition-colors group-hover:text-rose-300">
							{tSwipe("reject")}
						</span>
					</button>

					<button
						type="button"
						onClick={handleAccept}
						aria-label={`${tSwipe("accept")}: ${displayName ?? ""}`}
						className="group flex cursor-pointer flex-col items-center gap-1.5"
					>
						<div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d8b4fe]/45 bg-linear-to-br from-[#7b2dff] via-[#9c2bff] to-[#c026ff] text-white shadow-[0_0_28px_rgba(192,38,255,0.5)] transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_0_38px_rgba(192,38,255,0.75)] group-active:scale-95">
							<Check className="h-7 w-7 stroke-[2.5]" aria-hidden="true" />
						</div>
						<span className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#d8b4fe] uppercase transition-colors group-hover:text-white">
							{tSwipe("accept")}
						</span>
					</button>
				</div>
			) : null}
		</motion.div>
	);
};
