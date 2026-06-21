"use client";

import type { ParishionerDashboardMetrics } from "@/app/actions/dashboard.actions";
import { approveJoinRequest, rejectJoinRequest } from "@/app/actions/society.actions";
import { SacredMediaWidget } from "@/components/features/live-streams/live-streams-dashboard-widget";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NairaSign } from "@/components/ui/naira-sign";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Cake,
  Calendar,
  Check,
  ChevronRight,
  Church,
  HandHeart,
  MessageSquare,
  Users,
  X,
} from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface ParishionerDashboardProps {
  session: Session;
  announcements: any[];
  metrics: ParishionerDashboardMetrics;
  birthdayBannerMessage?: string | null;
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

function DashboardJoinRequests({ requests: initialRequests }: { requests: any[] }) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = (requestId: string) => {
    setProcessingId(requestId);
    startTransition(async () => {
      const res = await approveJoinRequest(requestId);
      if (res.success) {
        toast.success(res.message);
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        router.refresh();
      } else {
        toast.error(res.message);
      }
      setProcessingId(null);
    });
  };

  const handleReject = (requestId: string) => {
    setProcessingId(requestId);
    startTransition(async () => {
      const res = await rejectJoinRequest(requestId);
      if (res.success) {
        toast.success(res.message);
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        router.refresh();
      } else {
        toast.error(res.message);
      }
      setProcessingId(null);
    });
  };

  if (requests.length === 0) return null;

  return (
    <Card className="border-amber-500/10 bg-card/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-500" />
          <div>
            <CardTitle className="text-lg">Pending Society Join Requests</CardTitle>
            <CardDescription className="text-xs">
              Review and approve members requesting to join societies you lead.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => {
              const initials =
                `${req.parishioner.firstName[0]}${req.parishioner.lastName[0]}`.toUpperCase();
              const isProcessing = processingId === req.id && isPending;

              return (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card/50 gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-amber-500/10 text-amber-500 text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {req.parishioner.firstName} {req.parishioner.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {req.parishioner.phone || req.parishioner.email || "No contact info"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                          to {req.society.name}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {req.message && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          <p className="text-xs">{req.message}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-emerald-600 border-emerald-500/20 hover:bg-emerald-50/50 hover:text-emerald-700 h-8 px-3 text-xs"
                      onClick={() => handleApprove(req.id)}
                      disabled={isProcessing}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/10 hover:bg-destructive/5 h-8 px-3 text-xs"
                      onClick={() => handleReject(req.id)}
                      disabled={isProcessing}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

export function ParishionerDashboard({
  session,
  announcements,
  metrics,
  birthdayBannerMessage,
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

      {birthdayBannerMessage && (
        <div className="rounded-xl border border-amber-500/30 bg-linear-to-r from-amber-500/15 via-yellow-500/10 to-orange-500/15 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
              <Cake className="h-5 w-5 text-amber-300" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-100">
                Happy Birthday, {firstName}.
              </p>
              <p className="text-sm text-amber-50/90 leading-relaxed">
                {birthdayBannerMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {metrics.pendingJoinRequests && metrics.pendingJoinRequests.length > 0 && (
        <DashboardJoinRequests requests={metrics.pendingJoinRequests} />
      )}

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
            ₦
            {metrics.contributionsThisMonth.toLocaleString("en-NG")}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            This month
          </p>
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
          <p className="text-xl font-bold">
            {metrics.pendingIntentions}
          </p>
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
          <p className="text-xl font-bold">
            {metrics.upcomingEvents}
          </p>
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
                Submit a prayer request or memorial for a loved
                one.
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
                Schedule time for guidance, confession, or
                counseling.
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
              asChild
            >
              <Link href="/announcements">View All</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {announcements.length > 0 ?
              announcements.slice(0, 3).map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-xl border bg-card/50 p-5 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Church className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      {announcement.category && (
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-wider font-semibold border-amber-500/30 text-amber-400"
                        >
                          {announcement.category}
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(
                            announcement.publishedAt,
                          ),
                          {
                            addSuffix: true,
                          },
                        )}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {announcement.content}
                  </p>
                  <Link
                    href="/announcements"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-1"
                  >
                    Read Full Notice
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            : <div className="rounded-xl border border-dashed bg-card/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No new announcements at the moment.
                </p>
              </div>
            }
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
            <h2 className="text-xl font-bold tracking-tight">
              My Societies
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/societies">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.societies.map((society) => (
              <Link
                key={society.id}
                href={`/dashboard/societies/${society.id}`}
                className="group flex items-center gap-3 rounded-xl border bg-card/50 p-4 transition-all hover:border-primary/50 hover:bg-card"
              >
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
            <p className="font-semibold text-sm">
              Support Your Parish
            </p>
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
