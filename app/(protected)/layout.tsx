import { auth } from "@/auth";
import ProtectedNavbar from "@/components/layout/protected-navbar";
import Sidebar from "@/components/layout/sidebar";
import { AuthProvider } from "@/components/providers/auth-provider";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	const user = session?.user;

	return (
		<AuthProvider>
			<div className=" h-screen overflow-hidden   ">
				<div className="   flex flex-row">
					<Sidebar />
					<div className=" overflow-y-scroll h-screen w-full  ">
						<ProtectedNavbar user={user} />
						<div className="pt-[70px] pb-[30px] px-[20px] ">
							{children}
						</div>
					</div>
				</div>
			</div>
		</AuthProvider>
	);
}
