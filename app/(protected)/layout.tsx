import { auth } from "@/auth";
import ProtectedNavbar from "@/components/layout/protected-navbar";
import Sidebar from "@/components/layout/sidebar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	return (
		<AuthProvider session={session}>
			<div className="min-h-screen bg-background">
				<div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
					<Sidebar />
					<div className="flex min-h-screen min-w-0 flex-col">
						<ProtectedNavbar />
						<main className="flex-1 pt-24 pb-8 px-4 md:px-6 lg:px-8 bg-[#111827]">
							<div className="min-w-0">{children}</div>
						</main>
					</div>
				</div>
			</div>
		</AuthProvider>
	);
}
