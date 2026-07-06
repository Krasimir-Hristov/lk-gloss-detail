"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";

export const Providers = ({ children }: { children: ReactNode }) => {
	const queryClient = useMemo(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000,
						retry: 1,
					},
				},
			}),
		[],
	);

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
