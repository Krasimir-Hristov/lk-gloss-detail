import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";

import type { Metadata } from "next";

import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "LK Gloss & Detail",
	description: "Mobile Car Detailing",
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
	return (
		<html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
			<head>
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
				/>
			</head>
			<body className="flex min-h-full flex-col bg-[#131313] font-sans text-[#e5e2e1]">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
};

export default RootLayout;
