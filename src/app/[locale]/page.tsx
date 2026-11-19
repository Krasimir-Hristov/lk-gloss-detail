import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { LocalBusinessJsonLd, WebPageJsonLd } from "@/components/shared/JsonLd";
import { getBaseUrl } from "@/constants/site";
import {
	AiValuationSection,
	B2BSection,
	ContactSection,
	CtaBanner,
	HeroSection,
	HowItWorksSection,
	MobileServiceSection,
	ServicesSection,
	WhyLKSection,
} from "@/features/home";
import { getPublicServices } from "@/features/services/actions/getPublicServices";

import type { PublicService } from "@/features/services/actions/getPublicServices";

export const revalidate = 3600;

type Props = {
	params: Promise<{ locale: string }>;
};

const HomePage = async ({ params }: Props) => {
	const { locale } = await params;
	setRequestLocale(locale);

	const services = await getPublicServices();

	return <HomePageContent locale={locale} services={services} />;
};

export default HomePage;

const HomePageContent = ({ locale, services }: { locale: string; services: PublicService[] }) => {
	const tMeta = useTranslations("Metadata");

	return (
		<div className="flex flex-1 flex-col bg-[#07070a]">
			<HeroSection locale={locale} />
			<ServicesSection services={services} />
			<MobileServiceSection />
			<AiValuationSection />
			<WhyLKSection />
			<HowItWorksSection />
			<B2BSection locale={locale} />
			<CtaBanner locale={locale} />
			<ContactSection />

			{/* Structured Data */}
			<LocalBusinessJsonLd locale={locale} />
			<WebPageJsonLd
				name={tMeta("title")}
				description={tMeta("description")}
				url={`${getBaseUrl()}/${locale}`}
				locale={locale}
			/>
		</div>
	);
};
