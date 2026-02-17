import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SuperAdminDashboard } from "@/components/features/dashboard/super-admin-dashboard";
import { OrganizationDashboard } from "@/components/features/dashboard/organization-dashboard";
import { ParishionerDashboard } from "@/components/features/dashboard/parishioner-dashboard";
import { getActiveAnnouncementsForOrg } from "@/app/actions/announcement.actions";

export default async function DashboardPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	// SUPER_ADMIN sees system-wide dashboard
	if (session.user.role === "SUPER_ADMIN") {
		return <SuperAdminDashboard />;
	}

	const announcementsResult = await getActiveAnnouncementsForOrg(3);
	const announcements =
		announcementsResult.success ? announcementsResult.data ?? [] : [];

	// PARISHIONER sees personalized dashboard
	if (session.user.role === "PARISHIONER") {
		return (
			<ParishionerDashboard
				session={session}
				announcements={announcements}
			/>
		);
	}

	// Other (Staff/Admin) roles see organization-specific dashboard
	return (
		<OrganizationDashboard
			session={session}
			announcements={announcements}
		/>
	);
}
