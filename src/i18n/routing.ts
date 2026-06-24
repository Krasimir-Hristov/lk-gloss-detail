import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: ["de", "en", "el"],
	defaultLocale: "de",
	localePrefix: "always",
});

export const { usePathname, useRouter, redirect, getPathname } = createNavigation(routing);
