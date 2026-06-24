import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

type Props = {
	params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <HomePageContent locale={locale} />;
}

function HomePageContent({ locale }: { locale: string }) {
	const t = useTranslations("HomePage");

	return (
		<div className="flex flex-1 flex-col items-center justify-center bg-black">
			<main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between px-16 py-32 sm:items-start">
				<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
					<h1 className="max-w-xs text-3xl leading-10 font-semibold tracking-tight text-[#e5e2e1]">
						{t("hero.title")}
					</h1>
					<p className="max-w-md text-lg leading-8 text-[#ccc3d9]">{t("hero.subtitle")}</p>
					<div className="flex gap-4">
						<a
							href={`/${locale}/assessment`}
							className="inline-flex items-center justify-center rounded-lg bg-[#7b2dff] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#7b2dff]/80"
						>
							{t("hero.ctaPrimary")}
						</a>
						<a
							href={`/${locale}/services`}
							className="inline-flex items-center justify-center rounded-lg border border-[#353534] bg-transparent px-6 py-3 text-sm font-medium text-[#e5e2e1] transition-colors hover:bg-[#201f1f]"
						>
							{t("hero.ctaSecondary")}
						</a>
					</div>
				</div>
			</main>
		</div>
	);
}
