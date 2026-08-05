"use client";

import * as React from "react";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export type AdminNavItem = {
	href: string;
	label: string;
};

type AdminSidebarNavProps = {
	managementLabel: string;
	items: AdminNavItem[];
	onItemClickAction?: () => void;
};

export const AdminSidebarNav: React.FC<AdminSidebarNavProps> = ({
	managementLabel,
	items,
	onItemClickAction,
}) => {
	const pathname = usePathname();

	return (
		<nav className="space-y-2">
			<div className="px-3 py-2 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
				{managementLabel}
			</div>
			{items.map((item) => {
				const isActive =
					item.href === "/admin"
						? pathname === "/admin"
						: pathname === item.href || pathname.startsWith(`${item.href}/`);

				return (
					<Link
						key={item.href}
						href={item.href}
						onClick={onItemClickAction}
						className={cn(
							"block rounded-md px-3 py-2 text-sm font-medium transition-colors",
							isActive
								? "border border-purple-500/20 bg-neutral-900 font-semibold text-purple-300 shadow-sm"
								: "text-neutral-400 hover:bg-neutral-900 hover:text-white",
						)}
					>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
};
