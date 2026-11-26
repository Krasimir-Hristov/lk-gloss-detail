import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { logoutAdmin } from "@/features/admin/actions/auth";
import { getAdminSidebarCountsAction } from "@/features/admin/actions/dashboard";
import { AdminMobileHeader } from "@/features/admin/components/AdminMobileHeader";
import { AdminSidebarNav, type AdminNavItem } from "@/features/admin/components/AdminSidebarNav";
import { getCachedAdminSession } from "@/lib/auth/requireAdmin";

interface AdminLayoutProps {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}

const AdminLayout: React.FC<AdminLayoutProps> = async ({ children, params }) => {
	const { locale } = await params;
	const [session, t, countsRes] = await Promise.all([
		getCachedAdminSession(),
		getTranslations("Admin"),
		getAdminSidebarCountsAction(),
	]);

	if (!session) {
		redirect(`/${locale}/admin/login`);
	}

	const counts =
		countsRes.success && countsRes.data
			? countsRes.data
			: { pendingAppointments: 0, unreadMessages: 0 };

	const handleLogout = logoutAdmin.bind(null, locale);

	const navItems: AdminNavItem[] = [
		{
			href: "/admin",
			label: t("dashboard.sidebar.overview"),
			iconKey: "overview",
		},
		{
			href: "/admin/appointments",
			label: t("dashboard.sidebar.appointments"),
			iconKey: "appointments",
			badge: counts.pendingAppointments,
		},
		{
			href: "/admin/messages",
			label: t("dashboard.sidebar.messages"),
			iconKey: "messages",
			badge: counts.unreadMessages,
		},
		{
			href: "/admin/services",
			label: t("dashboard.sidebar.servicesCrud"),
			iconKey: "services",
		},
		{
			href: "/admin/chatbot-kb",
			label: t("dashboard.sidebar.chatbotKb"),
			iconKey: "chatbotKb",
		},
	];

	return (
		<div className="flex min-h-screen flex-col bg-black font-sans text-white md:h-screen md:flex-row md:overflow-hidden">
			{/* Mobile Header & Drawer */}
			<AdminMobileHeader
				title="LK GLOSS & DETAIL"
				subtitle={t("dashboard.title")}
				managementLabel={t("dashboard.sidebar.management")}
				items={navItems}
				userEmail={session.user.email}
				logoutAction={handleLogout}
				logoutLabel={t("logoutButton")}
			/>

			{/* Desktop Sidebar */}
			<aside className="hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-neutral-800 bg-neutral-950 p-6 md:flex">
				<div className="overflow-y-auto">
					<div className="mb-8">
						<h2 className="Montserrat text-xl font-bold tracking-wider text-purple-400">
							LK GLOSS & DETAIL
						</h2>
						<p className="mt-1 text-xs text-neutral-400">{t("dashboard.title")}</p>
						<div className="mt-4">
							<LanguageSwitcher />
						</div>
					</div>

					<AdminSidebarNav managementLabel={t("dashboard.sidebar.management")} items={navItems} />
				</div>

				<div className="shrink-0 border-t border-neutral-800 pt-4">
					<div className="mb-4 flex items-center justify-between">
						<div className="truncate pr-2">
							<p className="truncate text-xs text-neutral-400">{session.user.email}</p>
						</div>
					</div>
					<form action={handleLogout}>
						<button
							type="submit"
							aria-label={t("logoutButton")}
							className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-red-500/20 bg-red-950/10 px-4 py-2 text-sm font-medium text-red-400 transition-all duration-200 hover:border-red-500/40 hover:bg-red-950/30"
						>
							{t("logoutButton")}
						</button>
					</form>
				</div>
			</aside>

			{/* Main Content Area */}
			<main className="flex-1 overflow-y-auto bg-neutral-950 p-4 pt-20 sm:p-6 md:p-10 md:pt-10">
				{children}
			</main>
		</div>
	);
};

export default AdminLayout;
