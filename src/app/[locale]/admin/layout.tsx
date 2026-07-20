import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import * as React from "react";

import { LogoutButton } from "./logout-button";

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

const AdminLayout: React.FC<Props> = async ({ children, params }) => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Admin" });

	const headersList = await headers();
	const pathname = headersList.get("x-pathname") || "";
	const isLoginPage = pathname.endsWith("/admin/login") || pathname.endsWith("/admin/login/");

	return (
		<div className="min-h-screen bg-black text-[#e5e2e1]">
			{!isLoginPage ? (
				<header className="border-b border-white/10 bg-[#121212] px-6 py-4 shadow-[0px_0px_15px_rgba(123,45,255,0.15)]">
					<div className="mx-auto flex max-w-7xl items-center justify-between">
						<div className="text-lg font-bold tracking-tight text-[#d1bcff] uppercase">
							LK Gloss <span className="text-[#7b2dff]">&</span> Detail
							<span className="ml-2 text-xs font-semibold text-white/40">Admin Portal</span>
						</div>
						<LogoutButton locale={locale} label={t("logout")} />
					</div>
				</header>
			) : null}
			<main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
		</div>
	);
};

export default AdminLayout;
