"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CurrentLiveStreamBanner,
  PastStreamsWidget,
} from "@/components/features/live-streams/past-streams-widget";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import type { ParishionerDashboardMetrics } from "@/app/actions/dashboard.actions";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Church,
  DollarSign,
  HandHeart,
  Users,
} from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";

interface ParishionerDashboardProps {
  session: Session;
  announcements: any[];
  metrics: ParishionerDashboardMetrics;
}

export function ParishionerDashboard({
  session,
  announcements,
  metrics,
}: ParishionerDashboardProps) {
  const firstName = session.user.name?.split(" ")[0] || "there";
  const { isFeatureEnabled } = useFeatureSettings();
  const liveStreamingEnabled = isFeatureEnabled("enableLiveStreaming");

  return (
    <div className="space-y-8">
      {/* Live Stream Banner */}
      {liveStreamingEnabled && <CurrentLiveStreamBanner />}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Hello, {firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {session.user.organizationName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/dashboard/payments">
              <HandHeart className="h-4 w-4 mr-2" /> Give Online
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Contributions
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{metrics.contributionsThisMonth.toLocaleString("en-NG")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Societies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.societyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active memberships
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Intentions
            </CardTitle>
            <Church className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.pendingIntentions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions for Parishioners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/mass-intentions" className="group">
              <Card className="h-full hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <Church className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Book Mass Intention
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Request a mass for your loved ones
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/appointments" className="group">
              <Card className="h-full hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <Calendar className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Pastoral Appointment
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Schedule a meeting with a priest
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Announcements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Latest Announcements</CardTitle>
                <CardDescription>Stay updated with parish news</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/announcements">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.length > 0 ? (
                  announcements.slice(0, 3).map((announcement) => (
                    <div
                      key={announcement.id}
                      className="pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{announcement.title}</h4>
                        {announcement.publishedAt &&
                          new Date(announcement.publishedAt) > new Date() && (
                            <Badge variant="secondary" className="text-[10px]">
                              Upcoming
                            </Badge>
                          )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {announcement.content}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {new Date(
                          announcement.publishedAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No new announcements.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Past Streams */}
          {liveStreamingEnabled && <PastStreamsWidget limit={4} />}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Societies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.societies.length > 0 ? (
                metrics.societies.map((society) => (
                  <Link
                    href={`/dashboard/societies`}
                    key={society.id}
                    className="flex items-center justify-between group">
                    <span className="text-sm group-hover:text-primary transition-colors">
                      {society.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  You haven&apos;t joined any societies yet.
                </p>
              )}
              <Button
                variant="ghost"
                className="w-full text-xs"
                size="sm"
                asChild>
                <Link href="/dashboard/societies">
                  Explore Societies <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
