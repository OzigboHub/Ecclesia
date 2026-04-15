"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MemberDuesStatus } from "@/app/actions/society.actions";
import { AlertTriangle, DollarSign, Megaphone, Users } from "lucide-react";

interface OverviewTabProps {
  society: {
    id: string;
    name: string;
    monthlyDueAmount: number | null;
    president: { firstName: string; lastName: string } | null;
    secretary: { firstName: string; lastName: string } | null;
    memberCount: number;
  };
  duesOverview: {
    members: MemberDuesStatus[];
    monthlyDueAmount: number | null;
    year: number;
  };
  totalPayments: number;
  owingCount: number;
  announcementCount: number;
}

export function OverviewTab({
  society,
  duesOverview,
  totalPayments,
  owingCount,
  announcementCount,
}: OverviewTabProps) {
  const totalDuesCollected = duesOverview.members.reduce(
    (sum, m) => sum + m.totalPaid,
    0,
  );
  const totalOwing = duesOverview.members.reduce(
    (sum, m) => sum + m.totalOwing,
    0,
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{society.memberCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dues Collected ({duesOverview.year})
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalDuesCollected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPayments} payment records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {duesOverview.monthlyDueAmount
                ? formatCurrency(totalOwing)
                : `${owingCount} members`}
            </div>
            {owingCount > 0 && duesOverview.monthlyDueAmount && (
              <p className="text-xs text-muted-foreground mt-1">
                {owingCount} members owing
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Announcements
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcementCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Leadership & Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leadership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                President
              </p>
              <p className="font-medium">
                {society.president
                  ? `${society.president.firstName} ${society.president.lastName}`
                  : "Vacant"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Secretary
              </p>
              <p className="font-medium">
                {society.secretary
                  ? `${society.secretary.firstName} ${society.secretary.lastName}`
                  : "Vacant"}
              </p>
            </div>
            {society.monthlyDueAmount && (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Monthly Due
                </p>
                <p className="font-medium">
                  {formatCurrency(society.monthlyDueAmount)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owing members quick list */}
        <Card>
          <CardHeader>
            <CardTitle>Members Owing ({duesOverview.year})</CardTitle>
          </CardHeader>
          <CardContent>
            {owingCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                All members are up to date!
              </p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {duesOverview.members
                  .filter((m) => m.monthsOwing.length > 0)
                  .slice(0, 5)
                  .map((m) => (
                    <li
                      key={m.parishionerId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium">
                        {m.firstName} {m.lastName}
                      </span>
                      <span className="text-amber-600">
                        {m.monthsOwing.length} month
                        {m.monthsOwing.length > 1 ? "s" : ""}
                      </span>
                    </li>
                  ))}
                {owingCount > 5 && (
                  <li className="text-xs text-muted-foreground pt-1">
                    +{owingCount - 5} more — see Dues tab
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
