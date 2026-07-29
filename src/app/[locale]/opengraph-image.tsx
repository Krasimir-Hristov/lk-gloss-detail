import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const alt = "LK Gloss & Detail — Mobile Autopflege & Detailing";
export const size = {
	width: 1200,
	height: 630,
};

export const contentType = "image/png";

type Props = {
	params: Promise<{ locale: string }>;
};

const OpengraphImage = async ({ params }: Props) => {
	const { locale } = await params;
	const tMeta = await getTranslations({ locale, namespace: "Metadata" });
	const tHero = await getTranslations({ locale, namespace: "HomePage.hero" });

	const titleText = tMeta("title");
	const subtitleText = tHero("subtitle");

	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#131313",
				fontFamily: "sans-serif",
				position: "relative",
				overflow: "hidden",
			}}
		>
			{/* Background Purple Glow */}
			<div
				style={{
					position: "absolute",
					top: "-20%",
					left: "30%",
					width: "500px",
					height: "500px",
					borderRadius: "50%",
					background:
						"radial-gradient(circle, rgba(123, 45, 255, 0.35) 0%, rgba(19, 19, 19, 0) 70%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					bottom: "-20%",
					right: "20%",
					width: "450px",
					height: "450px",
					borderRadius: "50%",
					background:
						"radial-gradient(circle, rgba(216, 180, 254, 0.25) 0%, rgba(19, 19, 19, 0) 70%)",
				}}
			/>

			{/* Border Container */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					width: "90%",
					height: "80%",
					border: "2px solid rgba(123, 45, 255, 0.4)",
					borderRadius: "24px",
					backgroundColor: "rgba(32, 31, 31, 0.7)",
					padding: "40px",
					textAlign: "center",
				}}
			>
				{/* Brand Logo Header */}
				<div
					style={{
						fontSize: 48,
						fontWeight: 900,
						letterSpacing: "4px",
						color: "#ffffff",
						marginBottom: "16px",
						display: "flex",
						alignItems: "center",
						gap: "12px",
					}}
				>
					<span style={{ color: "#d8b4fe" }}>LK</span> GLOSS & DETAIL
				</div>

				{/* Category Title */}
				<div
					style={{
						fontSize: 32,
						fontWeight: 700,
						color: "#d1bcff",
						marginBottom: "24px",
					}}
				>
					{titleText}
				</div>

				{/* Subtitle / Key benefits */}
				<div
					style={{
						fontSize: 22,
						color: "#ccc3d9",
						maxWidth: "800px",
					}}
				>
					{subtitleText}
				</div>

				{/* Footer Tag */}
				<div
					style={{
						marginTop: "40px",
						padding: "10px 24px",
						borderRadius: "30px",
						backgroundColor: "rgba(123, 45, 255, 0.25)",
						border: "1px solid rgba(216, 180, 254, 0.4)",
						color: "#ffffff",
						fontSize: 18,
						fontWeight: 600,
						letterSpacing: "1px",
					}}
				>
					LK Gloss & Detail • Neuhausen auf den Fildern
				</div>
			</div>
		</div>,
		{
			...size,
		},
	);
};

export default OpengraphImage;
