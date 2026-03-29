"use client";

import { Users, Calendar, Church } from "lucide-react";
import { NairaSign } from "@/components/ui/naira-sign";
import type { Session } from "next-auth";
import type { OrganizationDashboardMetrics } from "@/app/actions/dashboard.actions";

interface OrganizationDashboardProps {
  session: Session;
  announcements: any[];
  metrics: OrganizationDashboardMetrics;
}

export function OrganizationDashboard({
  session,
  announcements,
  metrics,
}: OrganizationDashboardProps) {
  const stats = [
    {
      name: "Total Parishioners",
      value: metrics.totalParishioners.toLocaleString("en-NG"),
      icon: Users,
      change: "",
    },
    {
      name: "Completed Payments",
      value: `₦${metrics.totalPaymentAmount.toLocaleString("en-NG")}`,
      icon: NairaSign,
      change: `${metrics.totalPayments.toLocaleString("en-NG")} records`,
    },
    {
      name: "Upcoming Appointments",
      value: metrics.upcomingAppointments.toLocaleString("en-NG"),
      icon: Calendar,
      change: "",
    },
    {
      name: "Mass Intentions",
      value: metrics.totalMassIntentions.toLocaleString("en-NG"),
      icon: Church,
      change: "",
    },
  ];

  const formatRelativeTime = (value: Date | string) => {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {session.user.name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {session.user.organizationName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-background border border-border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-foreground">
                        {stat.value}
                      </div>
                      {stat.change && (
                        <div className="ml-2 flex items-baseline text-xs font-semibold text-muted-foreground">
                          {stat.change}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-background border border-border rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left">
            <NairaSign className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">Record Payment</h3>
            <p className="text-sm text-muted-foreground">
              Add offering or donation
            </p>
          </button>
          <button className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left">
            <Users className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">Add Parishioner</h3>
            <p className="text-sm text-muted-foreground">Register new member</p>
          </button>
          <button className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left">
            <Church className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">Book Mass Intention</h3>
            <p className="text-sm text-muted-foreground">
              Schedule mass intention
            </p>
          </button>
          <button className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left">
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">New Appointment</h3>
            <p className="text-sm text-muted-foreground">
              Schedule appointment
            </p>
          </button>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="mt-8 bg-background border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Announcements</h2>
            <a
              href="/dashboard/announcements"
              className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="mt-4 space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-md border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {announcement.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {announcement.content}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {announcement.publishedAt
                      ? new Date(announcement.publishedAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                          },
                        )
                      : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-8 bg-background border border-border rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {metrics.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          ) : (
            metrics.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 text-sm">
                <div className="flex shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                </div>
                <div className="flex-1">
                  <p className="text-foreground">{activity.details.message}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
