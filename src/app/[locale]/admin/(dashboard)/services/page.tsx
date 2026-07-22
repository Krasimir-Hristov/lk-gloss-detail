import { getTranslations } from "next-intl/server";
import React from "react";

import { getAdminServices } from "@/features/admin/actions/services";
import { ServicesManager } from "@/features/admin/components/services/ServicesManager";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Metadata" });
	return { title: t("template").replace("%s", "Services Management") };
}

export default async function AdminServicesPage() {
	const t = await getTranslations("Admin.services");

	const res = await getAdminServices();

	if (!res.success) {
		return (
			<div className="space-y-6">
				<h1 className="Montserrat text-3xl font-extrabold tracking-tight text-white">
					{t("title")}
				</h1>
				<div className="rounded-lg border border-red-500/30 bg-red-950/20 p-6 text-red-400">
					<h2 className="Montserrat mb-2 text-lg font-bold">Error loading services</h2>
					<p className="text-sm">{res.error}</p>
				</div>
			</div>
		);
	}

	return <ServicesManager initialServices={res.data} />;
}
