import { AuthProvider } from "@/components/providers/auth-provider";
import { ServiceWorkerRegistration } from "@/components/providers/sw-registration";
import { ThemeScript } from "@/components/providers/theme-script";
import type { Metadata, Viewport } from "next";
import {
	IBM_Plex_Mono,
	IBM_Plex_Sans,
	IBM_Plex_Serif,
	Montserrat,
} from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import PublicNavbar from "@/components/layout/public-navbar";
import { Toaster } from "sonner";
import "./globals.css";

const montserrat = Montserrat({
	variable: "--montserrat",
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

// The feed's type system. Loaded as variables and applied only by the (feed)
// route group, so the console keeps Montserrat unchanged.
const plexSans = IBM_Plex_Sans({
	variable: "--ff-plex-sans",
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	style: ["normal", "italic"],
	display: "swap",
});

const plexSerif = IBM_Plex_Serif({
	variable: "--ff-plex-serif",
	subsets: ["latin"],
	weight: ["400", "500"],
	style: ["normal", "italic"],
	display: "swap",
});

const plexMono = IBM_Plex_Mono({
	variable: "--ff-plex-mono",
	subsets: ["latin"],
	weight: ["400", "500"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Ecclesia DPM - Digital Parish Manager",
	description: "Comprehensive parish management system",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Ecclesia",
	},
	formatDetection: {
		telephone: false,
	},
};

export const viewport: Viewport = {
	themeColor: "#eab308",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				<ThemeScript />
			</head>
			<body
				className={`${montserrat.className} ${plexSans.variable} ${plexSerif.variable} ${plexMono.variable} scroll-smooth text-[13px] antialiased`}
				suppressHydrationWarning
			>
				<AuthProvider>
					<ServiceWorkerRegistration />
					<NextTopLoader
						initialPosition={0.08}
						crawlSpeed={200}
						easing="ease"
						speed={200}
						height={3}
						shadow="0 0 10px #fbbf24,0 0 5px #fbbf24"
						crawl={true}
						color="#fbbf24"
						zIndex={1600}
						showSpinner={false}
					/>
					<PublicNavbar />
					{children}
					<Toaster position="bottom-right" richColors />
				</AuthProvider>
			</body>
		</html>
	);
}
