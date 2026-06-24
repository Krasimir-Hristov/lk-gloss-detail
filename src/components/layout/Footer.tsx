import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

const Footer = () => {
	const t = useTranslations("Footer");
	const tNav = useTranslations("Navigation");
	const locale = useLocale();

	const year = new Date().getFullYear();

	const navLinks = [
		{ href: "/services", label: tNav("services") },
		{ href: "/assessment", label: tNav("assessment") },
		{ href: "/gallery", label: tNav("gallery") },
		{ href: "/contact", label: tNav("contact") },
	];

	const legalLinks = [
		{ href: "/impressum", label: t("impressum") },
		{ href: "/impressum", label: t("privacy") },
	];

	return (
		<footer className="w-full border-t border-[#4a4456] bg-black py-16 md:py-28">
			<div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 md:grid-cols-4 md:px-16">
				{/* --- Column 1: Brand --- */}
				<div className="md:col-span-2">
					<div className="mb-4 text-xl font-extrabold tracking-tighter text-[#d1bcff] uppercase">
						LK Gloss <span className="text-[#7b2dff]">&</span> Detail
					</div>
					<p className="mb-6 max-w-sm text-sm text-[#ccc3d9]">{t("copyright", { year })}</p>
				</div>

				{/* --- Column 2: Navigation --- */}
				<div className="space-y-3">
					<h5 className="tracking- text-xs font-bold text-[#d1bcff] uppercase">{t("services")}</h5>
					<ul className="space-y-2">
						{navLinks.map((l) => (
							<li key={l.href}>
								<Link
									href={`/${locale}${l.href}`}
									className="text-sm text-[#ccc3d9] transition-colors hover:text-[#d1bcff] hover:underline"
								>
									{l.label}
								</Link>
							</li>
						))}
					</ul>
				</div>

				{/* --- Column 3: Legal --- */}
				<div className="space-y-3">
					<h5 className="tracking- text-xs font-bold text-[#d1bcff] uppercase">{t("impressum")}</h5>
					<ul className="space-y-2">
						{legalLinks.map((l) => (
							<li key={l.href + l.label}>
								<Link
									href={`/${locale}${l.href}`}
									className="text-sm text-[#ccc3d9] transition-colors hover:text-[#d1bcff] hover:underline"
								>
									{l.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
