import { AuthProvider } from "@/components/providers/auth-provider";
import type { Metadata } from "next";
import { Geist, Montserrat } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import "./globals.css";
import PublicNavbar from "@/components/layout/public-navbar";
import PublicFooter from "@/components/layout/public-footer";

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
        className={`${Montserrat} scroll-smooth text-[13px] antialiased`}
        suppressHydrationWarning>
        <AuthProvider>
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
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
