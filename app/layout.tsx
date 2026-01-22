import { AuthProvider } from "@/components/providers/auth-provider";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

import { Toaster } from "sonner";
import "./globals.css";
import { ProgressBarProvider } from "@/components/providers/progress-bar-provider";

const montserrat = Montserrat({
	variable: "--montserrat",
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
	title: "Ecclesia DPM - Digital Parish Manager",
	description: "Comprehensive parish management system",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${montserrat.className} text-[13px] antialiased`}
				suppressHydrationWarning
			>
				<AuthProvider>
					<ProgressBarProvider>
						{children}
						<Toaster position="top-right" richColors />
					</ProgressBarProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
