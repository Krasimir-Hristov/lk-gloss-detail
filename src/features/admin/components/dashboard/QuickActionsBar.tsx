import { BrainCircuit, CalendarPlus, Wrench, CalendarDays } from "lucide-react";
import React from "react";

import { Link } from "@/i18n/routing";

interface QuickActionsBarProps {
	t: (key: string) => string;
}

const actions = [
	{
		key: "appointments",
		href: "/admin/appointments" as const,
		icon: CalendarDays,
		color: "text-purple-400",
		bg: "bg-purple-500/10 hover:bg-purple-500/20",
		border: "border-purple-500/20 hover:border-purple-500/40",
	},
	{
		key: "blockSlot",
		href: "/admin/appointments?action=blockDate" as const,
		icon: CalendarPlus,
		color: "text-amber-400",
		bg: "bg-amber-500/10 hover:bg-amber-500/20",
		border: "border-amber-500/20 hover:border-amber-500/40",
	},
	{
		key: "addKnowledge",
		href: "/admin/chatbot-kb" as const,
		icon: BrainCircuit,
		color: "text-cyan-400",
		bg: "bg-cyan-500/10 hover:bg-cyan-500/20",
		border: "border-cyan-500/20 hover:border-cyan-500/40",
	},
	{
		key: "services",
		href: "/admin/services" as const,
		icon: Wrench,
		color: "text-emerald-400",
		bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
		border: "border-emerald-500/20 hover:border-emerald-500/40",
	},
] as const;

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ t }) => (
	<section
		className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
		aria-label={t("quickActions.title")}
	>
		<h3 className="mb-4 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
			{t("quickActions.title")}
		</h3>
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{actions.map(({ key, href, icon: Icon, color, bg, border }) => (
				<Link
					key={key}
					href={href}
					className={`flex flex-col items-center gap-2 rounded-lg border ${border} ${bg} px-4 py-4 text-center transition-all duration-200`}
				>
					<Icon className={`h-5 w-5 ${color}`} />
					<span className="text-xs font-medium text-neutral-300">{t(`quickActions.${key}`)}</span>
				</Link>
			))}
		</div>
	</section>
);
