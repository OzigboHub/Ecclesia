import { ProtectedRoute } from "@/components/auth/protected-route";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ProtectedRoute>
			<div className=" h-screen overflow-hidden   ">
				<div className=" h-screen flex flex-row">
					<Sidebar />
					<div className=" w-full h-screen ">
						<Navbar />
						<div className=" h-screen px-[20px] py-[30px]">
							{children}
						</div>
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
