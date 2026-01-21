import { AuthProvider } from "@/components/providers/auth-provider";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({
	variable: "--font-geist",
	subsets: ["latin"],
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
				className={`${geist.className} text-[13px] antialiased`}
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
