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

  return (
    <AuthProvider>
      <div className=" h-screen overflow-hidden   ">
        <div className="   flex flex-row">
          <Sidebar />
          <div className=" overflow-y-scroll h-screen w-full  ">
            <ProtectedNavbar />
            <div className="pt-32 pb-7.5 px-5 ">{children}</div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
