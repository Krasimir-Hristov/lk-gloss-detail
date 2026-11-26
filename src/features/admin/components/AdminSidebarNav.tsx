"use client";

import {
	LayoutDashboard,
	CalendarDays,
	MessageSquare,
	Wrench,
	BrainCircuit,
	type LucideIcon,
} from "lucide-react";
import * as React from "react";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export type AdminNavIconKey = "overview" | "appointments" | "messages" | "services" | "chatbotKb";

export type AdminNavItem = {
	href: string;
	label: string;
	iconKey?: AdminNavIconKey;
	badge?: number;
};

const NAV_ICON_MAP: Record<AdminNavIconKey, LucideIcon> = {
	overview: LayoutDashboard,
	appointments: CalendarDays,
	messages: MessageSquare,
	services: Wrench,
	chatbotKb: BrainCircuit,
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
		<nav className="space-y-1.5" aria-label={managementLabel}>
			<div className="px-3 py-2 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
				{managementLabel}
			</div>
			{items.map((item) => {
				const isActive =
					item.href === "/admin"
						? pathname === "/admin"
						: pathname === item.href || pathname.startsWith(`${item.href}/`);
				const Icon = item.iconKey ? NAV_ICON_MAP[item.iconKey] : null;
				const badgeCount = typeof item.badge === "number" && item.badge > 0 ? item.badge : 0;

				return (
					<Link
						key={item.href}
						href={item.href}
						aria-label={item.label}
						onClick={onItemClickAction}
						className={cn(
							"flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
							isActive
								? "border border-purple-500/25 bg-neutral-900 font-semibold text-purple-300 shadow-sm"
								: "text-neutral-400 hover:bg-neutral-900 hover:text-white",
						)}
					>
						<span className="flex min-w-0 items-center gap-2.5">
							{Icon ? (
								<Icon
									className={cn(
										"size-4 shrink-0",
										isActive ? "text-purple-400" : "text-neutral-500",
									)}
								/>
							) : null}
							<span className="truncate">{item.label}</span>
						</span>
						{badgeCount > 0 ? (
							<span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full border border-purple-500/40 bg-purple-600/30 px-1.5 py-0.5 text-[11px] leading-none font-bold text-purple-200">
								{badgeCount > 99 ? "99+" : badgeCount}
							</span>
						) : null}
					</Link>
				);
			})}
		</nav>
	);
};
