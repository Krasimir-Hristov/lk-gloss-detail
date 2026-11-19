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

export const extractVehicleTelemetry = (photos: AssessmentPhoto[]) => {
	const validPhotos = photos.filter((p) => p.validationStatus === "valid");
	const carSizes = validPhotos.map((p) => p.carSize).filter(Boolean);
	const dirtLevels = validPhotos.map((p) => p.dirtLevel).filter(Boolean);
	const carDescriptions = validPhotos.map((p) => p.carDescription).filter(Boolean);

	const carSize =
		carSizes.length > 0
			? carSizes
					.sort(
						(a, b) =>
							carSizes.filter((v) => v === a).length - carSizes.filter((v) => v === b).length,
					)
					.pop()!
			: "medium";
	const dirtLevel =
		dirtLevels.length > 0
			? dirtLevels
					.sort(
						(a, b) =>
							dirtLevels.filter((v) => v === a).length - dirtLevels.filter((v) => v === b).length,
					)
					.pop()!
			: "moderate";
	const brand = carDescriptions.length > 0 ? carDescriptions[0] : null;

	return { carSize, dirtLevel, brand };
};
