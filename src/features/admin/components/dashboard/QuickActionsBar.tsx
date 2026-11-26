import { CalendarOff, Plus } from "lucide-react";
import React from "react";

import { Link } from "@/i18n/routing";

interface QuickActionsBarProps {
	t: (key: string) => string;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ t }) => (
	<section
		className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3.5"
		aria-label={t("quickActions.title")}
	>
		<h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
			{t("quickActions.title")}
		</h3>
		<div className="flex flex-wrap items-center gap-3">
			<Link
				href="/admin/appointments?action=blockDate"
				aria-label={t("quickActions.blockSlot")}
				className="inline-flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 transition-all hover:border-amber-500/45 hover:bg-amber-500/20"
			>
				<CalendarOff className="h-4 w-4 text-amber-400" />
				<span>{t("quickActions.blockSlot")}</span>
			</Link>
			<Link
				href="/admin/services?action=new"
				aria-label={t("quickActions.newService")}
				className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-600/20 px-4 py-2 text-xs font-semibold text-purple-200 transition-all hover:border-purple-500/50 hover:bg-purple-600/30"
			>
				<Plus className="h-4 w-4 text-purple-400" />
				<span>{t("quickActions.newService")}</span>
			</Link>
		</div>
	</section>
);
