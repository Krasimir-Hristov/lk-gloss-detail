"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import * as React from "react";

import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { AdminSidebarNav } from "@/features/admin/components/AdminSidebarNav";

import type { AdminNavItem } from "@/features/admin/components/AdminSidebarNav";

type AdminMobileHeaderProps = {
	title: string;
	subtitle: string;
	managementLabel: string;
	items: AdminNavItem[];
	userEmail?: string;
	logoutAction: () => Promise<void> | void;
	logoutLabel: string;
};

export const AdminMobileHeader: React.FC<AdminMobileHeaderProps> = ({
	title,
	subtitle,
	managementLabel,
	items,
	userEmail,
	logoutAction,
	logoutLabel,
}) => {
	const [isOpen, setIsOpen] = React.useState(false);

	const toggleOpen = () => setIsOpen((prev) => !prev);
	const closeMenu = () => setIsOpen(false);

	return (
		<header className="fixed top-0 left-0 z-40 flex h-16 w-full items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 md:hidden">
			<div>
				<h2 className="Montserrat text-base font-extrabold tracking-wider text-purple-400">
					{title}
				</h2>
				<p className="text-[10px] text-neutral-400">{subtitle}</p>
			</div>

			<div className="flex items-center gap-3">
				<LanguageSwitcher />

				<button
					type="button"
					onClick={toggleOpen}
					className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 transition-colors hover:text-white"
					aria-label={isOpen ? "Close menu" : "Open menu"}
				>
					{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
				</button>
			</div>

			{/* Mobile Navigation Drawer */}
			<AnimatePresence>
				{isOpen ? (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="fixed top-16 right-0 left-0 z-40 flex flex-col justify-between border-b border-neutral-800 bg-neutral-950/98 p-6 shadow-2xl backdrop-blur-xl"
						style={{ maxHeight: "calc(100vh - 4rem)", overflowY: "auto" }}
					>
						<AdminSidebarNav
							managementLabel={managementLabel}
							items={items}
							onItemClickAction={closeMenu}
						/>

						<div className="mt-6 border-t border-neutral-800 pt-4">
							{userEmail ? (
								<p className="mb-3 truncate text-xs text-neutral-400">{userEmail}</p>
							) : null}
							<form
								action={async () => {
									closeMenu();
									await logoutAction();
								}}
							>
								<button
									type="submit"
									className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-red-500/20 bg-red-950/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-all hover:border-red-500/40 hover:bg-red-950/30"
								>
									<LogOut className="h-4 w-4" />
									{logoutLabel}
								</button>
							</form>
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</header>
	);
};
