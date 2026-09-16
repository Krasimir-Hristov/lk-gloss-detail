"use client";

import Image from "next/image";
import React, { useState } from "react";

import { cn } from "@/lib/utils";

import type { ImageProps } from "next/image";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
	fallbackIcon?: React.ReactNode;
	fallbackClassName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
	src,
	alt,
	className,
	fallbackIcon,
	fallbackClassName,
	...rest
}) => {
	const [hasError, setHasError] = useState(false);

	if (hasError || !src) {
		return (
			<div
				className={cn(
					"flex h-full w-full items-center justify-center bg-linear-to-b from-[#252424] to-[#1a1a1a] text-[#7b2dff]/40",
					fallbackClassName,
					className,
				)}
				role="img"
				aria-label={alt || "Image placeholder"}
			>
				{fallbackIcon ? (
					fallbackIcon
				) : (
					<svg
						className="h-12 w-12 text-[#7b2dff]/30"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				)}
			</div>
		);
	}

	return (
		<Image src={src} alt={alt} className={className} onError={() => setHasError(true)} {...rest} />
	);
};
