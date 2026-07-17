import { getTranslations, setRequestLocale } from "next-intl/server";

import { AssessmentWizard } from "@/features/assessment";

import type { Metadata } from "next";

type Params = { locale: string };

export const generateMetadata = async ({
	params,
}: {
	params: Promise<Params>;
}): Promise<Metadata> => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Assessment" });

	return {
		title: t("title"),
	};
};

const AssessmentPage = async ({ params }: { params: Promise<Params> }) => {
	const { locale } = await params;
	setRequestLocale(locale);

	return <AssessmentWizard />;
};

export default AssessmentPage;
