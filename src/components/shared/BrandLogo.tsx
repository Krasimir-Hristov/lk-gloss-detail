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
	sm: { box: "h-8 w-8 rounded-lg sm:h-9 sm:w-9", px: 36 },
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
		<div className={cn("inline-flex min-w-0 items-center gap-2 sm:gap-3", className)}>
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
				<div className="flex min-w-0 flex-col leading-none">
					<span className="font-display truncate text-[11px] font-black tracking-tight text-white uppercase min-[400px]:text-xs sm:text-base">
						LK <span className="violet-text">Gloss &amp; Detail</span>
					</span>
					<span className="mt-0.5 truncate font-mono text-[7.5px] font-medium tracking-[0.14em] text-[#9b93ad] uppercase min-[400px]:mt-1 min-[400px]:text-[8.5px] min-[400px]:tracking-[0.2em]">
						Mobile Detailing
					</span>
				</div>
			) : null}
		</div>
	);
};
