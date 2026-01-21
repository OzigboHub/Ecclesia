import { AuthProvider } from "@/components/providers/auth-provider";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { Toaster } from "sonner";
import "./globals.css";

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
				<NextTopLoader
          color="#eab308"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
        />
				<AuthProvider>
					{children}
					<Toaster position="top-right" richColors />
				</AuthProvider>
			</body>
		</html>
	);
}
