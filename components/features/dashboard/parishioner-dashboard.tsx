"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SacredMediaWidget } from "@/components/features/live-streams/live-streams-dashboard-widget";
import type { ParishionerDashboardMetrics } from "@/app/actions/dashboard.actions";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Church,
  HandHeart,
  Users,
} from "lucide-react";
import { NairaSign } from "@/components/ui/naira-sign";
import type { Session } from "next-auth";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ParishionerDashboardProps {
  session: Session;
  announcements: any[];
  metrics: ParishionerDashboardMetrics;
}

const BLESSINGS = [
  "May the grace of the Lord be with you today.",
  "The Lord bless you and keep you.",
  "May His light guide your path today.",
  "Grace and peace be with you always.",
  "May God's love fill your heart today.",
];

function getBlessing() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return BLESSINGS[dayOfYear % BLESSINGS.length];
}

function getGreetingTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function ParishionerDashboard({
  session,
  announcements,
  metrics,
}: ParishionerDashboardProps) {
  const firstName = session.user.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
          Welcome back, {firstName}.
        </h1>
        <p className="text-muted-foreground mt-1 italic text-sm">
          {getBlessing()}
        </p>
      </div>

      {/* Compact Stats Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              My Contributions
            </span>
            <NairaSign className="h-4 w-4 text-amber-400/70" />
          </div>
          <p className="text-xl font-bold">
            ₦{metrics.contributionsThisMonth.toLocaleString("en-NG")}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">This month</p>
        </div>

        <div className="rounded-xl border bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              My Societies
            </span>
            <Users className="h-4 w-4 text-purple-400/70" />
          </div>
          <p className="text-xl font-bold">{metrics.societyCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Active Groups
          </p>
        </div>

        <div className="rounded-xl border bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Intentions
            </span>
            <Church className="h-4 w-4 text-blue-400/70" />
          </div>
          <p className="text-xl font-bold">{metrics.pendingIntentions}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Awaiting Review
          </p>
        </div>

        <div className="rounded-xl border bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming Events
            </span>
            <Calendar className="h-4 w-4 text-green-400/70" />
          </div>
          <p className="text-xl font-bold">{metrics.upcomingEvents}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            In next 7 days
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/mass-intentions" className="group">
          <div className="flex items-center gap-4 rounded-xl border bg-card/50 p-5 transition-all hover:border-primary/50 hover:bg-card">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Church className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                Book Mass Intention
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Submit a prayer request or memorial for a loved one.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </Link>

        <Link href="/appointments" className="group">
          <div className="flex items-center gap-4 rounded-xl border bg-card/50 p-5 transition-all hover:border-primary/50 hover:bg-card">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
              <Calendar className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                Pastoral Appointment
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Schedule time for guidance, confession, or counseling.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </Link>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column — Community Notes */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">
              Community Notes
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground"
              asChild>
              <Link href="/announcements">View All</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {announcements.length > 0 ? (
              announcements.slice(0, 3).map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-xl border bg-card/50 p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Church className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      {announcement.category && (
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-wider font-semibold border-amber-500/30 text-amber-400">
                          {announcement.category}
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(announcement.publishedAt),
                          {
                            addSuffix: true,
                          },
                        )}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold">{announcement.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {announcement.content}
                  </p>
                  <Link
                    href="/announcements"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-1">
                    Read Full Notice
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed bg-card/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No new announcements at the moment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Sacred Media */}
        <div className="lg:col-span-2">
          <SacredMediaWidget />
        </div>
      </div>

      {/* My Societies */}
      {metrics.societies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">My Societies</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground"
              asChild>
              <Link href="/societies">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.societies.map((society) => (
              <Link
                key={society.id}
                href={`/dashboard/societies/${society.id}`}
                className="group flex items-center gap-3 rounded-xl border bg-card/50 p-4 transition-all hover:border-primary/50 hover:bg-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {society.name}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Give Online CTA */}
      <div className="rounded-xl border bg-linear-to-r from-amber-500/5 via-transparent to-purple-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <HandHeart className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Support Your Parish</p>
            <p className="text-xs text-muted-foreground">
              Make a contribution to the church online.
            </p>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href="/pay">
            Give Online <ArrowRight className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
