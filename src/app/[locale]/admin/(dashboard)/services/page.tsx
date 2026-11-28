import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

import { getAdminServices } from "@/features/admin/actions/services";
import { ServicesManager } from "@/features/admin/components/services/ServicesManager";
import { getCachedAdminSession } from "@/lib/auth/requireAdmin";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Metadata" });
	const tAdmin = await getTranslations({ locale, namespace: "Admin.services" });
	return { title: t("template").replace("%s", tAdmin("title")) };
};

interface AdminServicesPageProps {
	params: Promise<{ locale: string }>;
}

const AdminServicesPage: React.FC<AdminServicesPageProps> = async ({ params }) => {
	const { locale } = await params;
	const session = await getCachedAdminSession();

	if (!session) {
		redirect(`/${locale}/admin/login`);
	}

	const [t, res] = await Promise.all([getTranslations("Admin.services"), getAdminServices()]);

	if (!res.success) {
		return (
			<div className="space-y-6">
				<h1 className="Montserrat text-3xl font-extrabold tracking-tight text-white">
					{t("title")}
				</h1>
				<div className="rounded-lg border border-red-500/30 bg-red-950/20 p-6 text-red-400">
					<h2 className="Montserrat mb-2 text-lg font-bold">{t("loadingError")}</h2>
					<p className="text-sm">{res.error}</p>
				</div>
			</div>
		);
	}

	return <ServicesManager initialServices={res.data} />;
};

export default AdminServicesPage;
