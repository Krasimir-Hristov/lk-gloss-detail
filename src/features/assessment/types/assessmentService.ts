import type { AssessmentPhoto } from "@/features/assessment/schemas/assessmentSchema";

export type AssessmentService = {
	id: string;
	name: Record<string, string> | string;
	short_description: Record<string, string> | string | null;
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

export const fetchAssessmentServices = async (): Promise<AssessmentService[]> => {
	const response = await fetch("/api/services");
	if (!response.ok) {
		throw new Error("Failed to fetch services");
	}
	return (await response.json()) as AssessmentService[];
};

export type VehicleTelemetry = {
	carSize: "small" | "medium" | "large" | "suv";
	dirtLevel: "light" | "moderate" | "heavy";
	brand: string | null;
	visualFindings: string[];
};

const DIRT_SEVERITY_RANK: Record<VehicleTelemetry["dirtLevel"], number> = {
	light: 1,
	moderate: 2,
	heavy: 3,
};

export const extractVehicleTelemetry = (photos: AssessmentPhoto[]): VehicleTelemetry => {
	const validPhotos = photos.filter((p) => p.validationStatus === "valid");

	const sizeCounts = new Map<VehicleTelemetry["carSize"], number>();
	for (const photo of validPhotos) {
		if (photo.carSize) {
			sizeCounts.set(photo.carSize, (sizeCounts.get(photo.carSize) ?? 0) + 1);
		}
	}

	let carSize: VehicleTelemetry["carSize"] = "medium";
	let maxSizeCount = 0;
	for (const [size, count] of sizeCounts.entries()) {
		if (count > maxSizeCount) {
			maxSizeCount = count;
			carSize = size;
		}
	}

	let dirtLevel: VehicleTelemetry["dirtLevel"] = "moderate";
	let highestRank = 0;
	for (const photo of validPhotos) {
		if (photo.dirtLevel) {
			const rank = DIRT_SEVERITY_RANK[photo.dirtLevel];
			if (rank > highestRank) {
				highestRank = rank;
				dirtLevel = photo.dirtLevel;
			}
		}
	}

	let brand: string | null = null;
	for (const photo of validPhotos) {
		const desc = photo.carDescription?.trim();
		if (desc) {
			brand = desc.slice(0, 160);
			break;
		}
	}

	const seenFindings = new Set<string>();
	const visualFindings: string[] = [];
	for (const photo of validPhotos) {
		if (!photo.visualFindings) continue;
		for (const rawFinding of photo.visualFindings) {
			const trimmed = rawFinding.trim();
			if (!trimmed || seenFindings.has(trimmed)) continue;
			seenFindings.add(trimmed);
			visualFindings.push(trimmed);
			if (visualFindings.length >= 16) break;
		}
		if (visualFindings.length >= 16) break;
	}

	return { carSize, dirtLevel, brand, visualFindings };
};
