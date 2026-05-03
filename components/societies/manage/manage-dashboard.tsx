"use client";

import type {
	JoinRequestWithParishioner,
	MemberDuesStatus,
	SocietyMemberRecord,
	SocietyPaymentRecord,
} from "@/app/actions/society.actions";
import { JoinRequestsPanel } from "@/components/societies/join-requests-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DuesOverviewTab } from "./dues-overview-tab";
import { MemberRecordsTab } from "./member-records-tab";
import { OverviewTab } from "./overview-tab";
import { PaymentRecordsTab } from "./payment-records-tab";
import { SocietyAnnouncementsTab } from "./society-announcements-tab";

interface SocietyInfo {
	id: string;
	name: string;
	description: string | null;
	monthlyDueAmount: number | null;
	president: { firstName: string; lastName: string } | null;
	secretary: { firstName: string; lastName: string } | null;
	memberCount: number;
}

type AnnouncementItem = {
	id: string;
	title: string;
	content: string;
	imageUrl: string | null;
	isPublished: boolean;
	publishedAt: Date | null;
	expiresAt: Date | null;
	createdAt: Date;
	approvalStatus: string;
	rejectionReason: string | null;
	societyId: string | null;
};

interface ManageDashboardProps {
	society: SocietyInfo;
	duesOverview: {
		members: MemberDuesStatus[];
		monthlyDueAmount: number | null;
		year: number;
	};
	payments: {
		payments: SocietyPaymentRecord[];
		total: number;
	};
	members: SocietyMemberRecord[];
	announcements: AnnouncementItem[];
	joinRequests: JoinRequestWithParishioner[];
	joinRequestsError: string | null;
	userRole: string;
}

export function ManageDashboard({
	society,
	duesOverview,
	payments,
	members,
	announcements,
	joinRequests,
	joinRequestsError,
	userRole,
}: ManageDashboardProps) {
	const owingCount = duesOverview.members.filter(
		(m) => m.monthsOwing.length > 0,
	).length;
	const pendingAnnouncements = announcements.filter(
		(a) => a.approvalStatus === "PENDING_APPROVAL",
	).length;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href={`/dashboard/societies/${society.id}`}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
						{society.name} — Management
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Manage dues, members, and announcements
					</p>
				</div>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview" className="w-full">
				<TabsList className="w-full justify-start overflow-x-auto">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="dues">
						Dues
						{owingCount > 0 && (
							<span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground">
								{owingCount}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="payments">Payments</TabsTrigger>
					<TabsTrigger value="members">Members</TabsTrigger>
					<TabsTrigger value="announcements">
						Announcements
						{pendingAnnouncements > 0 && (
							<span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white">
								{pendingAnnouncements}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="join-requests">
						Join Requests
						{joinRequests.length > 0 && (
							<span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
								{joinRequests.length}
							</span>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-6">
					<OverviewTab
						society={society}
						duesOverview={duesOverview}
						totalPayments={payments.total}
						owingCount={owingCount}
						announcementCount={announcements.length}
					/>
				</TabsContent>

				<TabsContent value="dues" className="mt-6">
					<DuesOverviewTab
						societyId={society.id}
						duesOverview={duesOverview}
					/>
				</TabsContent>

				<TabsContent value="payments" className="mt-6">
					<PaymentRecordsTab
						societyId={society.id}
						initialPayments={payments.payments}
						total={payments.total}
					/>
				</TabsContent>

				<TabsContent value="members" className="mt-6">
					<MemberRecordsTab members={members} />
				</TabsContent>

				<TabsContent value="announcements" className="mt-6">
					<SocietyAnnouncementsTab
						societyId={society.id}
						announcements={announcements}
						userRole={userRole}
					/>
				</TabsContent>

				<TabsContent value="join-requests" className="mt-6">
					{joinRequestsError && (
						<div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
							{joinRequestsError}
						</div>
					)}
					<JoinRequestsPanel requests={joinRequests} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
