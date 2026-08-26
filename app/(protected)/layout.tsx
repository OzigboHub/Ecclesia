import { auth } from "@/auth";
import ProtectedNavbar from "@/components/layout/protected-navbar";
import Sidebar from "@/components/layout/sidebar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		// Not /auth/login directly: the cookie that made this session look alive
		// is still in the browser, and the proxy — which has no database access
		// — would read it and bounce straight back here. /auth/signed-out is a
		// route handler, so it can actually drop the cookie first.
		redirect("/auth/signed-out?reason=session-ended");
	}

	return (
		<AuthProvider session={session}>
			<div className="h-screen overflow-hidden">
				<div className="h-screen min-h-0 lg:grid lg:grid-cols-[280px_1fr]">
					<Sidebar session={session} />
					<div className="flex h-screen min-h-0 min-w-0 flex-col">
						<ProtectedNavbar session={session} />
						<main className="flex-1 min-h-0 overflow-y-auto pt-24 pb-8 px-4 md:px-6 lg:px-8 bg-background text-foreground transition-colors duration-150">
							<div className="min-w-0">{children}</div>
						</main>
					</div>
				</div>
			</div>
		</AuthProvider>
	);
}
