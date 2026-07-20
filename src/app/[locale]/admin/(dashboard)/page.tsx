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
	const [
		{ count: appointmentsCount },
		{ count: servicesCount },
		{ count: contactCount },
		{ count: knowledgeCount },
	] = await Promise.all([
		supabase.from("appointments").select("*", { count: "exact", head: true }),
		supabase.from("services").select("*", { count: "exact", head: true }),
		supabase.from("contact_submissions").select("*", { count: "exact", head: true }),
		supabase.from("chatbot_knowledge").select("*", { count: "exact", head: true }),
	]);

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
						Appointments
					</h3>
					<p className="Montserrat mt-4 text-4xl font-extrabold text-white">
						{appointmentsCount ?? 0}
					</p>
					<span className="mt-2 block text-xs text-neutral-500">Total bookings registered</span>
				</div>

				{/* Services Card */}
				<div className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
					<div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-blue-500 to-cyan-400"></div>
					<h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
						Active Services
					</h3>
					<p className="Montserrat mt-4 text-4xl font-extrabold text-white">{servicesCount ?? 0}</p>
					<span className="mt-2 block text-xs text-neutral-500">Available catalog entries</span>
				</div>

				{/* Contact Submissions Card */}
				<div className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
					<div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-pink-500 to-rose-500"></div>
					<h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
						Contact Submissions
					</h3>
					<p className="Montserrat mt-4 text-4xl font-extrabold text-white">{contactCount ?? 0}</p>
					<span className="mt-2 block text-xs text-neutral-500">Total inquiries received</span>
				</div>

				{/* Chatbot Knowledge Card */}
				<div className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
					<div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-amber-500 to-yellow-500"></div>
					<h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
						Chatbot Knowledge
					</h3>
					<p className="Montserrat mt-4 text-4xl font-extrabold text-white">
						{knowledgeCount ?? 0}
					</p>
					<span className="mt-2 block text-xs text-neutral-500">Vectorized QA pairs</span>
				</div>
			</div>

			{/* Welcome Info Box */}
			<div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
				<h2 className="Montserrat mb-4 text-xl font-bold text-white">Dashboard Overview</h2>
				<p className="text-sm leading-relaxed text-neutral-300">
					This admin panel allows you to monitor and manage all aspects of the LK Gloss & Detail
					website. In the next phases of development, you will be able to review booking calendars,
					modify service pricing tiers, and train the AI chatbot with new knowledge database entries
					directly.
				</p>
			</div>
		</div>
	);
};

export default DashboardPage;
