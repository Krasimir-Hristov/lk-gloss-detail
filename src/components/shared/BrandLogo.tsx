import Image from "next/image";

import { lkLogo } from "@/assets";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
	size?: "sm" | "md" | "lg";
	showWordmark?: boolean;
	priority?: boolean;
	className?: string;
};

const ICON_SIZES = {
	sm: { box: "h-9 w-9 rounded-lg", px: 36 },
	md: { box: "h-10 w-10 rounded-xl", px: 40 },
	lg: { box: "h-12 w-12 rounded-xl", px: 48 },
} as const;

export const BrandLogo = ({
	size = "md",
	showWordmark = true,
	priority = false,
	className,
}: BrandLogoProps) => {
	const iconSpec = ICON_SIZES[size];

	return (
		<div className={cn("inline-flex items-center gap-3", className)}>
			<div
				className={cn(
					"relative shrink-0 overflow-hidden border border-[#7b2dff]/45 bg-black shadow-[0_0_18px_rgba(123,45,255,0.28)] transition-all duration-300 group-hover:border-[#c026ff]/70 group-hover:shadow-[0_0_24px_rgba(192,38,255,0.45)]",
					iconSpec.box,
				)}
			>
				<Image
					src={lkLogo}
					alt="LK Gloss & Detail Logo"
					width={iconSpec.px}
					height={iconSpec.px}
					priority={priority}
					className="h-full w-full scale-105 object-cover"
				/>
			</div>

			{showWordmark ? (
				<div className="flex flex-col leading-none">
					<span className="font-display text-sm font-black tracking-tight text-white uppercase sm:text-base">
						LK <span className="violet-text">Gloss &amp; Detail</span>
					</span>
					<span className="mt-1 font-mono text-[9px] font-medium tracking-[0.22em] text-[#9b93ad] uppercase">
						Mobile Detailing
					</span>
				</div>
			) : null}
		</div>
	);
};
