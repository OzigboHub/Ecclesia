import { auth } from "@/auth";
import ProtectedNavbar from "@/components/layout/protected-navbar";
import Sidebar from "@/components/layout/sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	const user = session?.user;

	return (
		// <ProtectedRoute>
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
		// </ProtectedRoute>
	);
}
