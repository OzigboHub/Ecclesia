import { getSocietyAnnouncements } from "@/app/actions/announcement.actions";
import {
	getJoinRequestsForSociety,
	getSociety,
	getSocietyDuesOverview,
	getSocietyMemberRecords,
	getSocietyPayments,
	type JoinRequestWithParishioner,
} from "@/app/actions/society.actions";
import { auth } from "@/auth";
import { ManageDashboard } from "@/components/societies/manage/manage-dashboard";
import { canManageSocieties } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";

interface ManagePageProps {
	params: Promise<{ id: string }>;
}

export default async function SocietyManagePage({ params }: ManagePageProps) {
	const session = await auth();
	if (!session?.user) {
		redirect("/auth/login");
	}

	const { id } = await params;
	const result = await getSociety(id);

	if (!result.success || !result.data) {
		notFound();
	}

	const society = result.data;

	// Verify current user is a leader of this society or has admin rights
	const parishionerId = session.user.parishionerId ?? null;
	const isSocietyLeader =
		parishionerId !== null &&
		(society.presidentId === parishionerId ||
			society.secretaryId === parishionerId);
	const canManage = canManageSocieties(session.user.role);

	if (!isSocietyLeader && !canManage) {
		redirect(`/dashboard/societies/${id}`);
	}

	// Fetch all data in parallel
	const currentYear = new Date().getFullYear();
	const [
		duesResult,
		paymentsResult,
		membersResult,
		announcementsResult,
		joinRequestsResult,
	] = await Promise.all([
		getSocietyDuesOverview(id, currentYear),
		getSocietyPayments(id, { limit: 20 }),
		getSocietyMemberRecords(id),
		getSocietyAnnouncements(id),
		getJoinRequestsForSociety(id),
	]);

	const joinRequests: JoinRequestWithParishioner[] =
		joinRequestsResult.success && joinRequestsResult.data ?
			joinRequestsResult.data
		:	[];
	const joinRequestsError =
		joinRequestsResult.success ? null : joinRequestsResult.message;

	return (
		<ManageDashboard
			society={{
				id: society.id,
				name: society.name,
				description: society.description,
				monthlyDueAmount: society.monthlyDueAmount,
				president:
					society.president ?
						{
							firstName: society.president.firstName,
							lastName: society.president.lastName,
						}
					:	null,
				secretary:
					society.secretary ?
						{
							firstName: society.secretary.firstName,
							lastName: society.secretary.lastName,
						}
					:	null,
				memberCount: society.members.length,
			}}
			duesOverview={
				duesResult.success && duesResult.data ?
					duesResult.data
				:	{ members: [], monthlyDueAmount: null, year: currentYear }
			}
			payments={
				paymentsResult.success && paymentsResult.data ?
					paymentsResult.data
				:	{ payments: [], total: 0 }
			}
			members={
				membersResult.success && membersResult.data ?
					membersResult.data
				:	[]
			}
			announcements={
				announcementsResult.success && announcementsResult.data ?
					announcementsResult.data
				:	[]
			}
			joinRequests={joinRequests}
			joinRequestsError={joinRequestsError}
			userRole={session.user.role}
		/>
	);
}
