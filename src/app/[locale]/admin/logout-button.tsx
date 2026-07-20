"use client";

import * as React from "react";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
	locale: string;
	label: string;
};

export const LogoutButton: React.FC<LogoutButtonProps> = ({ locale, label }) => {
	const [isPending, startTransition] = React.useTransition();

	const handleLogout = () => {
		startTransition(async () => {
			await logout(locale);
		});
	};

	return (
		<Button
			variant="outline"
			size="sm"
			disabled={isPending}
			onClick={handleLogout}
			className="border-white/10 text-[#ccc3d9] hover:bg-white/5 hover:text-[#e5e2e1]"
		>
			{isPending ? "..." : label}
		</Button>
	);
};
