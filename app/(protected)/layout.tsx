import { ProtectedRoute } from "@/components/auth/protected-route";
import ProtectedNavbar from "@/components/layout/protected-navbar";
import Sidebar from "@/components/layout/sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		// <ProtectedRoute>
		<div className=" lg:h-screen overflow-hidden   ">
			<div className=" lg:h-screen flex flex-row">
				<Sidebar />
				<div className=" w-full lg:h-screen ">
					<ProtectedNavbar />
					<div className=" pt-[90px] lg:h-screen px-[20px]">
						{children}
					</div>
				</div>
			</div>
		</div>
		// </ProtectedRoute>
	);
}
