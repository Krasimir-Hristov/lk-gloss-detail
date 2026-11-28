import {
	Sparkles,
	Lightbulb,
	ShieldCheck,
	Car,
	Droplets,
	Wind,
	Wrench,
	Star,
	Palette,
	Brush,
	Camera,
	type LucideIcon,
} from "lucide-react";

export const SERVICE_ICON_NAMES = [
	"Sparkles",
	"Lightbulb",
	"ShieldCheck",
	"Car",
	"Droplets",
	"Wind",
	"Wrench",
	"Star",
	"Palette",
	"Brush",
	"Camera",
] as const;

export type ServiceIconName = (typeof SERVICE_ICON_NAMES)[number];

export const SERVICE_ICON_MAP: Record<ServiceIconName, LucideIcon> = {
	Sparkles,
	Lightbulb,
	ShieldCheck,
	Car,
	Droplets,
	Wind,
	Wrench,
	Star,
	Palette,
	Brush,
	Camera,
};

export const getIcon = (name: string): LucideIcon => {
	if (Object.hasOwn(SERVICE_ICON_MAP, name)) {
		return SERVICE_ICON_MAP[name as ServiceIconName];
	}
	return Sparkles; // Default to Sparkles if icon not found
};
