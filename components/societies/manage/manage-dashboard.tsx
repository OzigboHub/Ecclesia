"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type {
  MemberDuesStatus,
  SocietyMemberRecord,
  SocietyPaymentRecord,
} from "@/app/actions/society.actions";
import { OverviewTab } from "./overview-tab";
import { DuesOverviewTab } from "./dues-overview-tab";
import { PaymentRecordsTab } from "./payment-records-tab";
import { MemberRecordsTab } from "./member-records-tab";
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
  userRole: string;
}

export function ManageDashboard({
  society,
  duesOverview,
  payments,
  members,
  announcements,
  userRole,
}: ManageDashboardProps) {
  const owingCount = duesOverview.members.filter(
    (m) => m.monthsOwing.length > 0,
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
            {announcements.filter((a) => a.approvalStatus === "PENDING_APPROVAL").length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white">
                {announcements.filter((a) => a.approvalStatus === "PENDING_APPROVAL").length}
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
      </Tabs>
    </div>
  );
}
