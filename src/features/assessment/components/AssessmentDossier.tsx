"use client";

import { useQuery } from "@tanstack/react-query";
import { Car, Gauge, Lock, MessageCircle, Phone, ScanLine, Sparkles } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { lkLogo, paintGlossMacro } from "@/assets";
import { CONTACT_INFO } from "@/constants/contact";
import { getLocalizedText } from "@/features/admin/types/servicesTypes";
import { DossierAngleGrid } from "@/features/assessment/components/DossierAngleGrid";
import { useAssessmentStore } from "@/features/assessment/stores/assessmentStore";
import {
	extractVehicleTelemetry,
	fetchAssessmentServices,
	type AssessmentService,
} from "@/features/assessment/types/assessmentService";
import { getIcon } from "@/lib/iconMap";

export const AssessmentDossier: React.FC = () => {
	const t = useTranslations("Assessment");
	const tDossier = useTranslations("Assessment.dossier");
	const locale = useLocale();

	const { currentStep, photos, services } = useAssessmentStore();

	const { data: catalogServices = [] } = useQuery<AssessmentService[]>({
		queryKey: ["services"],
		queryFn: fetchAssessmentServices,
	});

	const validPhotos = photos.filter((p) => p.validationStatus === "valid");
	const validatedCount = validPhotos.length;

	const hasTelemetry = validatedCount > 0;
	const hasObservedSize = validPhotos.some((p) => Boolean(p.carSize));
	const hasObservedDirt = validPhotos.some((p) => Boolean(p.dirtLevel));
	const telemetry = extractVehicleTelemetry(photos);
	const detectedVehicle = hasTelemetry ? telemetry.brand : null;
	const detectedSize = hasObservedSize ? telemetry.carSize : null;
	const detectedDirt = hasObservedDirt ? telemetry.dirtLevel : null;
	const visualFindings = hasTelemetry ? telemetry.visualFindings : [];

	const acceptedIds = services.filter((s) => s.accepted).map((s) => s.serviceId);
	const acceptedCatalogServices = catalogServices.filter((s) => acceptedIds.includes(s.id));

	const progressBadge = `${String(validatedCount).padStart(2, "0")} / 04`;

	return (
		<aside
			aria-label={tDossier("title")}
			className="obsidian-card relative overflow-hidden rounded-3xl"
		>
			{/* Top specular light strip */}
			<div className="pointer-events-none absolute top-0 right-8 left-8 z-20 h-px bg-linear-to-r from-transparent via-[#c026ff]/70 to-transparent" />

			{/* Rim-Lit Optical Scanner Header */}
			<div className="relative aspect-16/9 w-full overflow-hidden bg-[#0a0a0f]">
				<Image
					src={paintGlossMacro}
					alt="LK Gloss & Detail AI Paint Inspection"
					placeholder="blur"
					fill
					sizes="(max-width: 1024px) 100vw, 40vw"
					className="object-cover opacity-80"
				/>
				<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0e0e14] via-[#0e0e14]/50 to-black/40" />
				<div className="scanline-beam pointer-events-none absolute inset-x-0 top-0 h-1/2" />

				{/* Viewfinder corner reticles */}
				<span className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 border-t border-l border-[#d8b4fe]/60" />
				<span className="pointer-events-none absolute top-2.5 right-2.5 h-3.5 w-3.5 border-t border-r border-[#d8b4fe]/60" />

				{/* Top Brand & Live Status */}
				<div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-1.5 sm:top-3.5 sm:right-3.5 sm:left-3.5 sm:gap-2">
					<div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-black/65 px-2 py-1 backdrop-blur-xl sm:gap-2 sm:px-2.5">
						<div className="relative h-4 w-4 shrink-0 overflow-hidden rounded border border-[#7b2dff]/55 bg-black">
							<Image
								src={lkLogo}
								alt="LK Gloss & Detail"
								width={16}
								height={16}
								className="h-full w-full scale-105 object-cover"
							/>
						</div>
						<span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#e5e2e1] uppercase min-[390px]:text-[10px] sm:tracking-[0.16em]">
							LK Vision
						</span>
					</div>

					<div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-[#a855f7]/40 bg-black/65 px-2 py-1 backdrop-blur-xl sm:px-2.5">
						<span className="relative flex h-2 w-2 shrink-0">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
						</span>
						<span className="truncate font-mono text-[9px] font-semibold tracking-[0.1em] text-[#e9d5ff] uppercase min-[390px]:text-[10px] sm:tracking-[0.14em]">
							{validatedCount > 0 ? tDossier("statusActive") : tDossier("statusLive")}
						</span>
					</div>
				</div>

				{/* Bottom Header Title & Counter */}
				<div className="absolute right-4 bottom-3.5 left-4 flex items-end justify-between gap-2.5 sm:right-5 sm:bottom-4 sm:left-5 sm:gap-3">
					<div className="flex min-w-0 items-center gap-2">
						<ScanLine className="h-4 w-4 shrink-0 text-[#d8b4fe]" aria-hidden="true" />
						<h2 className="font-display text-sm leading-tight font-extrabold tracking-tight text-white min-[390px]:text-base sm:text-xl">
							{tDossier("title")}
						</h2>
					</div>
					<span className="shrink-0 rounded-lg border border-white/12 bg-black/60 px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest text-[#d8b4fe] backdrop-blur-md">
						{progressBadge}
					</span>
				</div>
			</div>

			{/* Dossier Body */}
			<div className="space-y-4 p-4 sm:p-6">
				<DossierAngleGrid currentStep={currentStep} validPhotos={validPhotos} />

				{/* Live Detected Vehicle Telemetry */}
				<div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
					<p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#9b93ad] uppercase">
						<Car className="h-3.5 w-3.5 text-[#a855f7]" aria-hidden="true" />
						<span>{tDossier("telemetryTitle")}</span>
					</p>

					{detectedVehicle || detectedSize || detectedDirt || visualFindings.length > 0 ? (
						<dl className="space-y-2 text-xs">
							{detectedVehicle ? (
								<div className="flex items-start justify-between gap-3">
									<dt className="text-[#9b93ad]">{tDossier("vehicleLabel")}</dt>
									<dd className="text-right font-semibold text-white">{detectedVehicle}</dd>
								</div>
							) : null}
							{detectedSize ? (
								<div className="flex items-center justify-between gap-3">
									<dt className="text-[#9b93ad]">{tDossier("sizeLabel")}</dt>
									<dd className="rounded-md border border-[#7b2dff]/35 bg-[#7b2dff]/15 px-2 py-0.5 font-mono text-[11px] font-bold text-[#e9d5ff]">
										{t(`result.carSizes.${detectedSize}`)}
									</dd>
								</div>
							) : null}
							{detectedDirt ? (
								<div className="flex items-center justify-between gap-3">
									<dt className="flex items-center gap-1 text-[#9b93ad]">
										<Gauge className="h-3 w-3 text-[#a855f7]" aria-hidden="true" />
										<span>{tDossier("conditionLabel")}</span>
									</dt>
									<dd className="font-semibold text-[#e5e2e1]">
										{tDossier(`dirtLevels.${detectedDirt}`)}
									</dd>
								</div>
							) : null}
							{visualFindings.length > 0 ? (
								<div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-2">
									{visualFindings.slice(0, 4).map((finding) => (
										<span
											key={finding}
											className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#d1bcff]"
										>
											{finding}
										</span>
									))}
								</div>
							) : null}
						</dl>
					) : (
						<p className="text-xs text-[#6f6882]">{tDossier("pendingScan")}</p>
					)}
				</div>

				{/* Live Accepted Services (shown during/after service selection) */}
				{acceptedCatalogServices.length > 0 ? (
					<div className="rounded-2xl border border-[#7b2dff]/30 bg-[#7b2dff]/10 p-4">
						<div className="mb-2.5 flex items-center justify-between gap-2">
							<p className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#d8b4fe] uppercase">
								<Sparkles className="h-3.5 w-3.5 text-[#c026ff]" aria-hidden="true" />
								<span>{tDossier("servicesLabel")}</span>
							</p>
							<span className="rounded-full border border-[#a855f7]/45 bg-[#7b2dff]/25 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
								{acceptedCatalogServices.length}
							</span>
						</div>
						<ul className="flex flex-wrap gap-1.5">
							{acceptedCatalogServices.map((service) => {
								const IconComponent = getIcon(service.icon);
								return (
									<li
										key={service.id}
										className="inline-flex items-center gap-1.5 rounded-lg border border-[#a855f7]/35 bg-black/40 px-2.5 py-1 text-xs font-medium text-[#f1eff7]"
									>
										<IconComponent className="h-3 w-3 shrink-0 text-[#d8b4fe]" aria-hidden="true" />
										<span>{getLocalizedText(service.name, locale)}</span>
									</li>
								);
							})}
						</ul>
					</div>
				) : null}

				{/* DSGVO Privacy Guarantee */}
				<div className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#7b2dff]/35 bg-[#7b2dff]/15 text-[#d8b4fe]">
						<Lock className="h-4 w-4" aria-hidden="true" />
					</div>
					<div className="min-w-0">
						<p className="text-xs font-bold text-white">{tDossier("privacyTitle")}</p>
						<p className="mt-0.5 text-[11px] leading-relaxed text-[#9b93ad]">
							{tDossier("privacyDesc")}
						</p>
					</div>
				</div>

				{/* Direct Concierge Contact Channels */}
				<div className="border-t border-white/[0.07] pt-4">
					<p className="mb-2.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#9b93ad] uppercase">
						{tDossier("needHelp")}
					</p>
					<div className="grid grid-cols-2 gap-2.5">
						<a
							href={`tel:${CONTACT_INFO.phoneRaw}`}
							aria-label={`${tDossier("callCta")}: ${CONTACT_INFO.phone}`}
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-[#e5e2e1] transition-all hover:border-[#a855f7]/60 hover:bg-[#7b2dff]/15 hover:text-white"
						>
							<Phone className="h-3.5 w-3.5 text-[#d1bcff]" aria-hidden="true" />
							<span>{tDossier("callCta")}</span>
						</a>
						<a
							href={CONTACT_INFO.whatsappUrl}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`${tDossier("whatsappCta")}: ${CONTACT_INFO.phone}`}
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-3 py-2.5 text-xs font-semibold text-emerald-200 transition-all hover:border-emerald-400/55 hover:bg-emerald-500/20 hover:text-white"
						>
							<MessageCircle className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
							<span>{tDossier("whatsappCta")}</span>
						</a>
					</div>
				</div>
			</div>
		</aside>
	);
};
