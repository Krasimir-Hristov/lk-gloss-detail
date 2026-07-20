import { getTranslations } from "next-intl/server";
import React from "react";

import { createClient } from "@/lib/supabase/server";

interface DashboardPageProps {
	params: Promise<{ locale: string }>;
}

const DashboardPage: React.FC<DashboardPageProps> = async () => {
	const t = await getTranslations("Admin");

	const supabase = await createClient();

	// Fetch counts in parallel
	const [appointmentsRes, servicesRes, contactRes, knowledgeRes] = await Promise.all([
		supabase.from("appointments").select("*", { count: "exact", head: true }),
		supabase.from("services").select("*", { count: "exact", head: true }),
		supabase.from("contact_submissions").select("*", { count: "exact", head: true }),
		supabase.from("chatbot_knowledge").select("*", { count: "exact", head: true }),
	]);

	const hasError =
		appointmentsRes.error || servicesRes.error || contactRes.error || knowledgeRes.error;

	if (hasError) {
		console.error("[Dashboard] Error fetching database statistics:", {
			appointments: appointmentsRes.error?.message,
			services: servicesRes.error?.message,
			contact: contactRes.error?.message,
			knowledge: knowledgeRes.error?.message,
		});
		return (
			<div className="space-y-6">
				<div>
					<h1 className="Montserrat text-3xl font-extrabold tracking-tight text-white">
						{t("dashboard.welcome")}
					</h1>
					<p className="mt-2 text-sm text-neutral-400">{t("dashboard.subtitle")}</p>
				</div>
				<div className="rounded-lg border border-red-500/30 bg-red-950/20 p-6 text-red-400">
					<h2 className="Montserrat mb-2 text-lg font-bold">{t("dashboard.error.title")}</h2>
					<p className="text-sm">{t("dashboard.error.message")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div>
				<h1 className="Montserrat text-3xl font-extrabold tracking-tight text-white">
					{t("dashboard.welcome")}
				</h1>
				<p className="mt-2 text-sm text-neutral-400">{t("dashboard.subtitle")}</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{/* Appointments Card */}
				<div className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
					<div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-purple-500 to-indigo-600"></div>
					<h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
						{t("dashboard.cards.appointments.title")}
					</h3>
					<p className="Montserrat mt-4 text-4xl font-extrabold text-white">
						{appointmentsRes.count ?? 0}
					</p>
					<span className="mt-2 block text-xs text-neutral-500">
						{t("dashboard.cards.appointments.desc")}
					</span>
				</div>

				{/* Services Card */}
				<div className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
					<div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-blue-500 to-cyan-400"></div>
					<h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
						{t("dashboard.cards.services.title")}
					</h3>
					<p className="Montserrat mt-4 text-4xl font-extrabold text-white">
						{servicesRes.count ?? 0}
					</p>
					<span className="mt-2 block text-xs text-neutral-500">
						{t("dashboard.cards.services.desc")}
					</span>
				</div>

				{/* Contact Submissions Card */}
				<div className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
					<div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-pink-500 to-rose-500"></div>
					<h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
						{t("dashboard.cards.contact.title")}
					</h3>
					<p className="Montserrat mt-4 text-4xl font-extrabold text-white">
						{contactRes.count ?? 0}
					</p>
					<span className="mt-2 block text-xs text-neutral-500">
						{t("dashboard.cards.contact.desc")}
					</span>
				</div>

				{/* Chatbot Knowledge Card */}
				<div className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
					<div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-amber-500 to-yellow-500"></div>
					<h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
						{t("dashboard.cards.chatbot.title")}
					</h3>
					<p className="Montserrat mt-4 text-4xl font-extrabold text-white">
						{knowledgeRes.count ?? 0}
					</p>
					<span className="mt-2 block text-xs text-neutral-500">
						{t("dashboard.cards.chatbot.desc")}
					</span>
				</div>
			</div>

			{/* Welcome Info Box */}
			<div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
				<h2 className="Montserrat mb-4 text-xl font-bold text-white">
					{t("dashboard.overview.title")}
				</h2>
				<p className="text-sm leading-relaxed text-neutral-300">{t("dashboard.overview.text")}</p>
			</div>
		</div>
	);
};

export default DashboardPage;
