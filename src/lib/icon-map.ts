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

const iconMap: Record<string, LucideIcon> = {
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
	return iconMap[name] ?? Sparkles; // Default to Sparkles if icon not found
};
