"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { createElement, useRef, useState } from "react";

import { getIcon } from "@/lib/icon-map";

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
};

// ── Props ──────────────────────────────────────────────────────────────────

type ServiceSwipeCardProps = {
	service: DbService;
	onAcceptAction: (serviceId: string) => void;
	onRejectAction: (serviceId: string) => void;
	isTop: boolean;
	stackIndex: number;
};

export const ServiceSwipeCard = ({
	service,
	onAcceptAction,
	onRejectAction,
	isTop,
	stackIndex,
}: ServiceSwipeCardProps) => {
	const t = useTranslations("Assessment.services");
	const [isExiting, setIsExiting] = useState<"left" | "right" | null>(null);
	const cardRef = useRef<HTMLDivElement>(null);

	const x = useMotionValue(0);
	const rotate = useTransform(x, [-250, 0, 250], [-25, 0, 25]);

	const acceptBorderOpacity = useTransform(x, [0, 100, 250], [0, 0.5, 1]);
	const rejectBorderOpacity = useTransform(x, [-250, -100, 0], [1, 0.5, 0]);

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
		setIsExiting("right");
		setTimeout(() => onAcceptAction(service.id), 300);
	};

	const handleReject = () => {
		setIsExiting("left");
		setTimeout(() => onRejectAction(service.id), 300);
	};

	// Stack effect: offset for non-top cards
	const yOffset = isTop ? 0 : stackIndex * 8;
	const scaleValue = isTop ? 1 : 1 - stackIndex * 0.05;

	// Format duration
	const durationText = `${service.duration_hours}h`;

	// Format price range
	const priceText = `€${service.price_small} – €${service.price_suv}`;

	// i18n display text (falls back to DB name if key missing)
	const displayName = t.raw(`cards.${service.name}.title`) as string | undefined;
	const displayDescription = t.raw(`cards.${service.name}.description`) as string | undefined;
	const displayCategory = t.raw(`cards.${service.name}.tag`) as string | undefined;

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
				zIndex: 3 - stackIndex,
				y: yOffset,
				backgroundColor: isTop ? "#1a1a1a" : "#131313",
			}}
			animate={
				isExiting
					? {
							x: isExiting === "right" ? 600 : -600,
							rotate: isExiting === "right" ? 30 : -30,
							opacity: 0,
						}
					: {
							scale: scaleValue,
							opacity: isTop ? 1 : 0.95,
						}
			}
			transition={{
				x: isExiting
					? { duration: 0.4, ease: "easeOut" }
					: { type: "spring", stiffness: 300, damping: 25 },
				opacity: { duration: 0.3 },
			}}
			className="glass-panel carbon-pattern rounded-[1.25rem] p-1 shadow-2xl"
		>
			{/* Accept overlay */}
			<motion.div
				className="pointer-events-none absolute inset-0 z-10 rounded-[1.25rem] border-4 border-green-500"
				style={{ opacity: acceptBorderOpacity }}
			/>
			{/* Reject overlay */}
			<motion.div
				className="pointer-events-none absolute inset-0 z-10 rounded-[1.25rem] border-4 border-red-500"
				style={{ opacity: rejectBorderOpacity }}
			/>

			<div className="h-full w-full overflow-hidden rounded-[1.2rem]">
				{/* Image */}
				<div className="relative h-[55%] w-full overflow-hidden">
					{service.image_url ? (
						<Image
							src={service.image_url}
							alt={service.name}
							fill
							sizes="(max-width: 420px) 100vw, 420px"
							className="object-cover"
							priority={isTop}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-[#201f1f]">
							{createElement(iconComponent, { className: "h-16 w-16 text-[#7b2dff]/30" })}
						</div>
					)}
					<div className="absolute inset-0 bg-linear-to-t from-[#131313] via-transparent to-transparent" />
					<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#131313]/80" />

					{/* Icon badge */}
					{isTop ? (
						<motion.div
							initial={{ opacity: 0, scale: 0.5 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.2, duration: 0.3 }}
							className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#7b2dff]/30 bg-[#131313]/80 backdrop-blur-sm"
						>
							{createElement(iconComponent, { className: "h-6 w-6 text-[#d1bcff]" })}
						</motion.div>
					) : null}
				</div>

				{/* Content */}
				<div className="relative z-10 flex flex-col px-6 pt-4 pb-6">
					{/* Category tag */}
					<span className="mb-2 inline-block w-fit rounded-full border border-[#7b2dff]/30 bg-[#7b2dff]/20 px-2 py-0.5 text-[10px] font-bold tracking-tighter text-[#d1bcff] uppercase">
						{displayCategory ?? service.category}
					</span>

					<h2 className="text-2xl font-bold text-white">{displayName ?? service.name}</h2>
					<p className="mt-1 text-sm text-[#d1bcff]">
						{displayDescription ?? service.short_description ?? ""}
					</p>

					{/* Price range */}
					<div className="mt-4 flex items-center gap-2">
						<span className="text-lg font-bold text-white">{priceText}</span>
					</div>

					{/* Duration badge */}
					<div className="mt-3 flex items-center gap-1 text-xs text-[#ccc3d9]">
						<span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
							<Clock className="h-3.5 w-3.5" />
							{durationText}
						</span>
					</div>
				</div>
			</div>

			{/* Bottom action overlay — Accept/Reject indicators */}
			{isTop && !isExiting ? (
				<>
					{/* ACCEPT label (green) */}
					<motion.div
						className="pointer-events-none absolute top-8 right-6 z-20 rounded-full border-3 border-green-500 px-4 py-1.5"
						style={{ opacity: acceptBorderOpacity }}
					>
						<span className="text-lg font-extrabold tracking-wider text-green-500 uppercase">
							<Sparkles className="mr-1 inline h-5 w-5" />
							Accept
						</span>
					</motion.div>

					{/* REJECT label (red) */}
					<motion.div
						className="pointer-events-none absolute top-8 left-6 z-20 rounded-full border-3 border-red-500 px-4 py-1.5"
						style={{ opacity: rejectBorderOpacity }}
					>
						<span className="text-lg font-extrabold tracking-wider text-red-500 uppercase">
							Reject
						</span>
					</motion.div>
				</>
			) : null}

			{/* Action buttons */}
			{isTop && !isExiting ? (
				<div className="absolute -bottom-20 left-1/2 z-30 flex -translate-x-1/2 gap-6">
					{/* Reject button */}
					<button
						onClick={handleReject}
						className="group flex flex-col items-center gap-1"
						aria-label="Reject service"
					>
						<div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#958da2] transition-all duration-300 group-hover:border-red-500 group-hover:bg-red-500/10">
							<span className="material-symbols-outlined text-2xl text-[#ccc3d9] group-hover:text-red-500">
								close
							</span>
						</div>
						<span className="text-[10px] font-bold tracking-widest text-[#ccc3d9] uppercase opacity-60 group-hover:opacity-100">
							Decline
						</span>
					</button>

					{/* Accept button */}
					<button
						onClick={handleAccept}
						className="group flex flex-col items-center gap-1"
						aria-label="Accept service"
					>
						<div className="neon-glow flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#7b2dff] to-[#b303f2] transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(123,45,255,0.5)] active:scale-90">
							<span
								className="material-symbols-outlined text-3xl text-white"
								style={{ fontVariationSettings: "'FILL' 1" }}
							>
								check
							</span>
						</div>
						<span className="text-[10px] font-bold tracking-widest text-[#d1bcff] uppercase">
							Accept
						</span>
					</button>
				</div>
			) : null}
		</motion.div>
	);
};
