"use client";

import { Sparkles, ShieldCheck, Lightbulb } from "lucide-react";

import { headlightsCleaning, manWithVacum, mopSege } from "@/assets";

// ── Assessment Service (icon + image, text comes from i18n) ─────────────────

export const ASSESSMENT_SERVICES = [
	{
		id: "interior",
		key: "interior" as const,
		icon: Sparkles,
		image: manWithVacum,
	},
	{
		id: "headlights",
		key: "headlights" as const,
		icon: Lightbulb,
		image: headlightsCleaning,
	},
	{
		id: "paintCorrection",
		key: "paintCorrection" as const,
		icon: ShieldCheck,
		image: mopSege,
	},
] as const;

export type AssessmentService = (typeof ASSESSMENT_SERVICES)[number];
