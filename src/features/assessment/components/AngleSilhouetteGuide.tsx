"use client";

import React from "react";

import type { PhotoAngle } from "@/features/assessment/schemas/assessmentSchema";

type AngleSilhouetteGuideProps = {
	angle: PhotoAngle;
	className?: string;
};

export const AngleSilhouetteGuide: React.FC<AngleSilhouetteGuideProps> = ({
	angle,
	className = "h-12 w-20",
}) => {
	if (angle === "front") {
		return (
			<svg
				viewBox="0 0 120 68"
				fill="none"
				aria-hidden="true"
				className={className}
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Sleek front coupe silhouette */}
				<path
					d="M28 28L38 14C41 10 46 8 52 8H68C74 8 79 10 82 14L92 28"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
				/>
				<path
					d="M16 44V34C16 30 20 27 26 26L34 25H86L94 26C100 27 104 30 104 34V44C104 47 101 50 97 50H23C19 50 16 47 16 44Z"
					stroke="currentColor"
					strokeWidth="2"
				/>
				{/* Headlights */}
				<path
					d="M24 34H37L34 39H23L24 34Z"
					stroke="#d8b4fe"
					strokeWidth="1.75"
					strokeLinejoin="round"
				/>
				<path
					d="M96 34H83L86 39H97L96 34Z"
					stroke="#d8b4fe"
					strokeWidth="1.75"
					strokeLinejoin="round"
				/>
				{/* Grille & wheels */}
				<rect x="44" y="36" width="32" height="8" rx="3" stroke="currentColor" strokeWidth="1.75" />
				<path d="M22 50V57H34V50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				<path d="M86 50V57H98V50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			</svg>
		);
	}

	if (angle === "rear") {
		return (
			<svg
				viewBox="0 0 120 68"
				fill="none"
				aria-hidden="true"
				className={className}
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Rear glass & trunk */}
				<path
					d="M26 27L35 13C38 10 43 8 49 8H71C77 8 82 10 85 13L94 27"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
				/>
				<path
					d="M16 45V33C16 29 20 27 26 26H94C100 27 104 29 104 33V45C104 48 101 50 97 50H23C19 50 16 48 16 45Z"
					stroke="currentColor"
					strokeWidth="2"
				/>
				{/* Full-width LED taillight bar */}
				<path d="M23 34H97" stroke="#d8b4fe" strokeWidth="2.5" strokeLinecap="round" />
				{/* License plate recess & dual exhausts */}
				<rect x="47" y="39" width="26" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" />
				<circle cx="29" cy="45" r="2.5" stroke="#d8b4fe" strokeWidth="1.5" />
				<circle cx="91" cy="45" r="2.5" stroke="#d8b4fe" strokeWidth="1.5" />
				<path d="M22 50V57H34V50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				<path d="M86 50V57H98V50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			</svg>
		);
	}

	if (angle === "side") {
		return (
			<svg
				viewBox="0 0 120 68"
				fill="none"
				aria-hidden="true"
				className={className}
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Side coupe profile */}
				<path
					d="M12 43L16 32C18 29 23 27 32 26L46 15C51 12 58 11 67 11H79C85 11 91 14 96 20L106 28C110 31 112 35 112 40V44C112 46 110 48 107 48H99"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path d="M43 48H77" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				<path
					d="M12 43C12 46 14 48 17 48H21"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
				/>
				{/* Side window line */}
				<path
					d="M42 26L52 17H76C81 17 85 19 89 24L91 26H42Z"
					stroke="#d8b4fe"
					strokeWidth="1.6"
					strokeLinejoin="round"
				/>
				{/* Wheels */}
				<circle cx="32" cy="48" r="10" stroke="currentColor" strokeWidth="2" />
				<circle cx="32" cy="48" r="4" stroke="#d8b4fe" strokeWidth="1.5" />
				<circle cx="88" cy="48" r="10" stroke="currentColor" strokeWidth="2" />
				<circle cx="88" cy="48" r="4" stroke="#d8b4fe" strokeWidth="1.5" />
			</svg>
		);
	}

	// interior: steering wheel & cockpit silhouette
	return (
		<svg
			viewBox="0 0 120 68"
			fill="none"
			aria-hidden="true"
			className={className}
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* Dashboard arc */}
			<path
				d="M16 44C26 24 44 16 60 16C76 16 94 24 104 44"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			{/* Steering wheel */}
			<circle cx="44" cy="40" r="15" stroke="#d8b4fe" strokeWidth="2" />
			<circle cx="44" cy="40" r="4" stroke="currentColor" strokeWidth="1.75" />
			<path
				d="M31 38H40M48 38H57M44 44V54"
				stroke="#d8b4fe"
				strokeWidth="1.75"
				strokeLinecap="round"
			/>
			{/* Center console & seat silhouette */}
			<rect x="68" y="31" width="24" height="14" rx="3" stroke="currentColor" strokeWidth="1.75" />
			<path d="M74 38H86" stroke="#d8b4fe" strokeWidth="1.75" strokeLinecap="round" />
			<path
				d="M22 57H98"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				opacity="0.5"
			/>
		</svg>
	);
};
