import { getPublicAppointmentAvailabilities } from "@/app/actions/appointment.actions";
import { PublicAppointmentBooking } from "@/components/features/appointments/public-appointment-booking";
import { Button } from "@/components/ui/button";
import db from "@/lib/db";
import { isFeatureEnabled } from "@/lib/features.server";
import { format } from "date-fns";
import {
  BookOpen,
  Calendar,
  Heart,
  Mail,
  MapPin,
  Phone,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ParishPage({
  params,
}: {
  params: Promise<{ parishId: string }>;
}) {
  const { parishId } = await params;
  if (!parishId) {
    notFound();
  }

  // Get organization details
  const org = await db.organization.findUnique({
    where: { id: parishId },
    select: {
      id: true,
      name: true,
      contactEmail: true,
      contactPhone: true,
      address: true,
    },
  });

  if (!org) {
    notFound();
  }

  // Get livestreams for this parish (live now, upcoming, past)
  const now = new Date();
  const [livestreams, pastLivestreams] = await Promise.all([
    db.liveStream.findMany({
      where: {
        organizationId: parishId,
        OR: [{ isLive: true }, { scheduledFor: { gte: now } }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        streamUrl: true,
        isLive: true,
        scheduledFor: true,
      },
      orderBy: [{ isLive: "desc" }, { scheduledFor: "asc" }],
      take: 10,
    }),
    db.liveStream.findMany({
      where: {
        organizationId: parishId,
        isLive: false,
        scheduledFor: { lt: now },
      },
      select: {
        id: true,
        title: true,
        description: true,
        streamUrl: true,
        scheduledFor: true,
      },
      orderBy: { scheduledFor: "desc" },
      take: 10,
    }),
  ]);
  const liveNow = livestreams.filter((s) => s.isLive);
  const upcomingStreams = livestreams.filter(
    (s) => !s.isLive && s.scheduledFor && s.scheduledFor >= now,
  );
  const totalStreams = livestreams.length + pastLivestreams.length;

  // Get upcoming masses
  const masses = await db.mass.findMany({
    where: {
      organizationId: parishId,
      date: { gte: now },
      status: { not: "CANCELLED" },
    },
    select: {
      id: true,
      date: true,
      time: true,
      massType: true,
      location: true,
      celebrant: true,
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 6,
  });

  // Get active campaigns with progress
  const campaigns = await db.donationCampaign.findMany({
    where: {
      organizationId: parishId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      targetAmount: true,
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Calculate campaign progress
  const campaignsWithProgress = await Promise.all(
    campaigns.map(async (c) => {
      const raised = await db.payment.aggregate({
        where: {
          donationCampaignId: c.id,
          paymentStatus: "COMPLETED",
        },
        _sum: { amount: true },
      });
      return {
        ...c,
        raisedAmount: raised._sum.amount || 0,
        progress: Math.min(
          100,
          ((raised._sum.amount || 0) / c.targetAmount) * 100,
        ),
      };
    }),
  );

  const appointmentAvailabilityResult =
    await getPublicAppointmentAvailabilities(parishId);

  // Get approved mass intentions for upcoming masses
  const massIntentionsEnabled = await isFeatureEnabled(
    parishId,
    "enableMassIntentions",
  );
  const massIntentions = massIntentionsEnabled
    ? await db.massIntention.findMany({
        where: {
          organizationId: parishId,
          status: "APPROVED",
          mass: {
            date: { gte: now },
            status: { not: "CANCELLED" },
          },
        },
        select: {
          id: true,
          intention: true,
          intentionType: true,
          requestedBy: true,
          intendedFor: true,
          createdAt: true,
          mass: {
            select: {
              id: true,
              date: true,
              time: true,
              massType: true,
            },
          },
        },
        orderBy: { mass: { date: "asc" } },
        take: 20,
      })
    : [];

  return (
    <div className="min-h-screen pt-[60px] bg-background">
      {/* Hero section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Parish public page
            </p>
            <h1 className="text-3xl font-bold md:text-4xl">{org.name}</h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Discover upcoming masses, live streams, and parish-led campaigns
              in one place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href="#masses">View masses</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/p/${parishId}/campaigns`}>Support parish</Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Location</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {org.address ?? "Address not available"}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Upcoming masses</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {masses.length > 0
                  ? `${masses.length} scheduled`
                  : "No upcoming masses"}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Livestreams</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {totalStreams > 0
                  ? `${totalStreams} available`
                  : "No livestreams listed"}
              </p>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            {org.contactPhone && (
              <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-2">
                <span className="text-base">
                  <Phone className=" w-4 h-4" />
                </span>
                <span>{org.contactPhone}</span>
              </div>
            )}
            {org.contactEmail && (
              <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-2">
                <span className="text-base">
                  <Mail className=" w-4 h-4" />
                </span>
                <span>{org.contactEmail}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
        {appointmentAvailabilityResult.success && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Book an Appointment</h2>
            </div>
            <PublicAppointmentBooking
              organizationId={parishId}
              organizationName={org.name}
              availabilities={appointmentAvailabilityResult.data ?? []}
            />
          </section>
        )}

        {/* Livestream Section */}
        {(liveNow.length > 0 ||
          upcomingStreams.length > 0 ||
          pastLivestreams.length > 0) && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Livestream</h2>
            </div>

            {liveNow.length > 0 ? (
              <div className="space-y-6">
                {liveNow.map((stream) => (
                  <div
                    key={stream.id}
                    className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      Live now — {stream.title}
                    </div>
                    <div className="aspect-video bg-black">
                      <iframe
                        src={stream.streamUrl}
                        title={stream.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    {stream.description && (
                      <p className="p-4 text-sm text-muted-foreground">
                        {stream.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {upcomingStreams.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold mb-3">Upcoming streams</h3>
                <ul className="space-y-2">
                  {upcomingStreams.map((stream) => (
                    <li
                      key={stream.id}
                      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                      <div>
                        <p className="font-medium">{stream.title}</p>
                        {stream.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {stream.description}
                          </p>
                        )}
                      </div>
                      <time className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                        {stream.scheduledFor
                          ? format(
                              new Date(stream.scheduledFor),
                              "MMM d, h:mm a",
                            )
                          : "—"}
                      </time>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pastLivestreams.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold mb-3">Past livestreams</h3>
                <ul className="space-y-2">
                  {pastLivestreams.map((stream) => (
                    <li
                      key={stream.id}
                      className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{stream.title}</p>
                        {stream.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                            {stream.description}
                          </p>
                        )}
                        <time className="text-xs text-muted-foreground mt-1 block">
                          {stream.scheduledFor
                            ? format(
                                new Date(stream.scheduledFor),
                                "MMM d, yyyy · h:mm a",
                              )
                            : "—"}
                        </time>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="shrink-0">
                        <a
                          href={stream.streamUrl}
                          target="_blank"
                          rel="noopener noreferrer">
                          Watch replay
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Masses Section */}
        <section id="masses" className="space-y-6 scroll-mt-28">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Upcoming Masses</h2>
            </div>
            {masses.length > 0 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/mass/${parishId}`}>Browse all masses</Link>
              </Button>
            )}
          </div>

          {masses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {masses.map((mass) => (
                <div key={mass.id} className="rounded-xl border bg-card p-4">
                  <h3 className="font-semibold line-clamp-2">
                    {mass.massType.replace(/_/g, " ")}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {format(new Date(mass.date), "MMM d, yyyy")} · {mass.time}
                  </p>
                  {mass.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {mass.location}
                    </p>
                  )}
                  {mass.celebrant && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Celebrant: {mass.celebrant}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No upcoming masses scheduled.
            </p>
          )}
        </section>

        {/* Mass Intentions Section */}
        {massIntentions.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Mass Intentions</h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/p/${parishId}/mass-intentions`}>
                  Book an intention
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              {massIntentions.map((mi) => (
                <div
                  key={mi.id}
                  className="rounded-xl border bg-card px-4 py-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium text-sm leading-snug">
                        {mi.intention}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                          {mi.intentionType.replace(/_/g, " ")}
                        </span>
                        {mi.intendedFor && <span>For: {mi.intendedFor}</span>}
                        <span>By: {mi.requestedBy || "Anonymous"}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground sm:text-right">
                      <p className="font-medium text-foreground">
                        {format(new Date(mi.mass.date), "MMM d, yyyy")}
                      </p>
                      <p>
                        {mi.mass.time} · {mi.mass.massType.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Campaigns Section */}
        {campaignsWithProgress.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <h2 className="text-2xl font-bold">Support Our Parish</h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/p/${parishId}/campaigns`}>View All</Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {campaignsWithProgress.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/p/${parishId}/campaigns/${campaign.id}`}
                  className="rounded-xl border bg-card p-6 transition hover:shadow-md">
                  <h3 className="font-semibold line-clamp-2">
                    {campaign.name}
                  </h3>
                  {campaign.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">
                        ₦{campaign.raisedAmount.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        of ₦{campaign.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-red-500 transition-all"
                        style={{
                          width: `${campaign.progress}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {Math.round(campaign.progress)}% of goal
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
