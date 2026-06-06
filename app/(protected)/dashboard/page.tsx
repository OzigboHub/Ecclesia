import { getActiveAnnouncementsForOrg } from "@/app/actions/announcement.actions";
import {
	getOrganizationDashboardMetrics,
	getParishionerDashboardMetrics,
} from "@/app/actions/dashboard.actions";
import { auth } from "@/auth";
import { OrganizationDashboard } from "@/components/features/dashboard/organization-dashboard";
import { ParishionerDashboard } from "@/components/features/dashboard/parishioner-dashboard";
import { SuperAdminDashboard } from "@/components/features/dashboard/super-admin-dashboard";
import db from "@/lib/db";
import { redirect } from "next/navigation";

function isBirthdayToday(date: Date | null | undefined): boolean {
	if (!date) return false;
	const today = new Date();
	return (
		date.getUTCMonth() === today.getUTCMonth() &&
		date.getUTCDate() === today.getUTCDate()
	);
}

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
		announcementsResult.success ? (announcementsResult.data ?? []) : [];
	const metricsResult = await getOrganizationDashboardMetrics();
	const metrics =
		metricsResult.success && metricsResult.data ?
			metricsResult.data
		:	{
				totalParishioners: 0,
				totalPayments: 0,
				totalPaymentAmount: 0,
				upcomingAppointments: 0,
				totalMassIntentions: 0,
				recentActivity: [],
			};

	// PARISHIONER sees personalized dashboard
	if (session.user.role === "PARISHIONER") {
		const parishionerMetricsResult = await getParishionerDashboardMetrics();
		const parishionerMetrics =
			parishionerMetricsResult.success && parishionerMetricsResult.data ?
				parishionerMetricsResult.data
			:	{
					contributionsThisMonth: 0,
					societyCount: 0,
					pendingIntentions: 0,
					upcomingEvents: 0,
					societies: [],
				};

		const userProfile = await db.user.findUnique({
			where: { id: session.user.id },
			select: { dateOfBirth: true },
		});

		const birthdayBannerMessage =
			isBirthdayToday(userProfile?.dateOfBirth) ?
				`Everyone at ${session.user.organizationName ?? "your parish"} wishes you a beautiful birthday. May this new year be filled with grace and joy.`
			:	null;

		return (
			<ParishionerDashboard
				session={session}
				announcements={announcements}
				metrics={parishionerMetrics}
				birthdayBannerMessage={birthdayBannerMessage}
			/>
		);
	}

	// Other (Staff/Admin) roles see organization-specific dashboard
	return (
		<OrganizationDashboard
			session={session}
			announcements={announcements}
			metrics={metrics}
		/>
	);
}
