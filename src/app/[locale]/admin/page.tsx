import { getTranslations, setRequestLocale } from "next-intl/server";
import * as React from "react";

type PageProps = {
	params: Promise<{ locale: string }>;
};

const AdminDashboardPage: React.FC<PageProps> = async ({ params }) => {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Admin" });

	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-[#7b2dff]/20 bg-[#121212] p-8 shadow-[0px_0px_30px_rgba(123,45,255,0.05)]">
				<h1 className="bg-linear-to-r from-[#d8b4fe] via-[#a855f7] to-[#7b2dff] bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
					{t("welcome")}
				</h1>
				<p className="mt-4 text-base leading-relaxed text-[#ccc3d9]">{t("welcomeDescription")}</p>
			</div>
		</div>
	);
};

export default AdminDashboardPage;
