import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { logoutAdmin } from "@/features/admin/actions/auth";
import { AdminSidebarNav } from "@/features/admin/components/AdminSidebarNav";
import { isAdminUser } from "@/features/admin/utils/auth";
import { createClient } from "@/lib/supabase/server";

interface AdminLayoutProps {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}

const AdminLayout: React.FC<AdminLayoutProps> = async ({ children, params }) => {
	const { locale } = await params;
	const t = await getTranslations("Admin");

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const isAdmin = user ? await isAdminUser(supabase, user.id) : false;

	if (!user || !isAdmin) {
		redirect(`/${locale}/admin/login`);
	}

	const handleLogout = logoutAdmin.bind(null, locale);

	const navItems = [
		{ href: "/admin", label: t("dashboard.sidebar.overview") },
		{ href: "/admin/appointments", label: t("dashboard.sidebar.appointments") },
		{ href: "/admin/services", label: t("dashboard.sidebar.servicesCrud") },
		{ href: "/admin/chatbot-kb", label: t("dashboard.sidebar.chatbotKb") },
	];

	return (
		<div className="flex h-screen overflow-hidden bg-black font-sans text-white">
			{/* Sidebar */}
			<aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-neutral-800 bg-neutral-950 p-6">
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
							<p className="truncate text-xs text-neutral-400">{user?.email}</p>
						</div>
					</div>
					<form action={handleLogout}>
						<button
							type="submit"
							className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-red-500/20 bg-red-950/10 px-4 py-2 text-sm font-medium text-red-400 transition-all duration-200 hover:border-red-500/40 hover:bg-red-950/30"
						>
							{t("logoutButton")}
						</button>
					</form>
				</div>
			</aside>

			{/* Main Content Area */}
			<main className="flex-1 overflow-y-auto bg-neutral-950 p-10">{children}</main>
		</div>
	);
};

export default AdminLayout;
