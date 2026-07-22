import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { logoutAdmin } from "@/features/admin/actions/auth";
import { isAdminUser } from "@/features/admin/utils/auth";
import { Link } from "@/i18n/routing";
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

	return (
		<div className="flex min-h-screen bg-black font-sans text-white">
			{/* Sidebar */}
			<aside className="flex w-64 flex-col justify-between border-r border-neutral-800 bg-neutral-950 p-6">
				<div>
					<div className="mb-8">
						<h2 className="Montserrat text-xl font-bold tracking-wider text-purple-400">
							LK GLOSS & DETAIL
						</h2>
						<p className="mt-1 text-xs text-neutral-400">{t("dashboard.title")}</p>
						<div className="mt-4">
							<LanguageSwitcher />
						</div>
					</div>

					<nav className="space-y-2">
						<div className="px-3 py-2 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
							{t("dashboard.sidebar.management")}
						</div>
						<Link
							href="/admin"
							className="block rounded-md border border-purple-500/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-purple-300 transition-colors hover:bg-neutral-800"
						>
							{t("dashboard.sidebar.overview")}
						</Link>
						<Link
							href="/admin/appointments"
							className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
						>
							{t("dashboard.sidebar.appointments")}
						</Link>
						<Link
							href="/admin/services"
							className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
						>
							{t("dashboard.sidebar.servicesCrud")}
						</Link>
						<div className="block cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium text-neutral-500">
							{t("dashboard.sidebar.chatbotKb")}
						</div>
					</nav>
				</div>

				<div className="border-t border-neutral-800 pt-4">
					<div className="mb-4 flex items-center justify-between">
						<div className="truncate pr-2">
							<p className="truncate text-xs text-neutral-400">{user.email}</p>
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
