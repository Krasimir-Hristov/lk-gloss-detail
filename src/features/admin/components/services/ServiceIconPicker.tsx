"use client";

import React from "react";

import { getIcon, SERVICE_ICON_NAMES } from "@/lib/iconMap";

interface ServiceIconPickerProps {
	value: string;
	label: string;
	onChange: (iconName: string) => void;
	error?: string;
}

export const ServiceIconPicker: React.FC<ServiceIconPickerProps> = ({
	value,
	label,
	onChange,
	error,
}) => (
	<div>
		<span className="mb-1.5 block text-sm font-medium text-neutral-300">{label}</span>
		<div className="grid grid-cols-6 gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 sm:grid-cols-11">
			{SERVICE_ICON_NAMES.map((iconName) => {
				const Icon = getIcon(iconName);
				const isSelected = value === iconName;

				return (
					<button
						key={iconName}
						type="button"
						onClick={() => onChange(iconName)}
						aria-label={iconName}
						aria-pressed={isSelected}
						title={iconName}
						className={`flex h-9 w-full cursor-pointer items-center justify-center rounded-md border transition-all ${
							isSelected
								? "border-purple-500 bg-purple-600/25 text-purple-300 ring-1 ring-purple-500/50"
								: "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-purple-500/40 hover:text-white"
						}`}
					>
						<Icon className="h-4 w-4" />
					</button>
				);
			})}
		</div>
		{error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
	</div>
);
