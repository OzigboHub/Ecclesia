import Link from 'next/link';
import db from '@/lib/db';
import { format } from 'date-fns';
import { Calendar, Heart, MapPin, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

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
    select: { id: true, name: true, contactEmail: true, contactPhone: true, address: true },
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
      orderBy: [{ isLive: 'desc' }, { scheduledFor: 'asc' }],
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
      orderBy: { scheduledFor: 'desc' },
      take: 10,
    }),
  ]);
  const liveNow = livestreams.filter((s) => s.isLive);
  const upcomingStreams = livestreams.filter(
    (s) => !s.isLive && s.scheduledFor && s.scheduledFor >= now
  );

  // Get upcoming events
  const events = await db.event.findMany({
    where: {
      organizationId: parishId,
      startTime: { gte: new Date() },
      status: 'SCHEDULED',
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      location: true,
    },
    orderBy: { startTime: 'asc' },
    take: 5,
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
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  // Calculate campaign progress
  const campaignsWithProgress = await Promise.all(
    campaigns.map(async (c) => {
      const raised = await db.payment.aggregate({
        where: {
          donationCampaignId: c.id,
          paymentStatus: 'COMPLETED',
        },
        _sum: { amount: true },
      });
      return {
        ...c,
        raisedAmount: raised._sum.amount || 0,
        progress: Math.min(100, ((raised._sum.amount || 0) / c.targetAmount) * 100),
      };
    })
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero section */}
      <section className="border-b bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-3xl font-bold">{org.name}</h1>
          <div className="mt-4 space-y-1 text-sm text-muted-foreground">
            {org.address && <p>{org.address}</p>}
            {org.contactPhone && <p>📞 {org.contactPhone}</p>}
            {org.contactEmail && <p>📧 {org.contactEmail}</p>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Livestream Section */}
        {(liveNow.length > 0 || upcomingStreams.length > 0 || pastLivestreams.length > 0) && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Radio className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Livestream</h2>
            </div>

            {liveNow.length > 0 ? (
              <div className="space-y-6">
                {liveNow.map((stream) => (
                  <div
                    key={stream.id}
                    className="rounded-lg border bg-card overflow-hidden"
                  >
                    <div className="px-4 py-2 bg-red-600 text-white text-sm font-medium flex items-center gap-2">
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
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Upcoming streams</h3>
                <ul className="space-y-2">
                  {upcomingStreams.map((stream) => (
                    <li
                      key={stream.id}
                      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                    >
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
                          ? format(new Date(stream.scheduledFor), 'MMM d, h:mm a')
                          : '—'}
                      </time>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pastLivestreams.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Past livestreams</h3>
                <ul className="space-y-2">
                  {pastLivestreams.map((stream) => (
                    <li
                      key={stream.id}
                      className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{stream.title}</p>
                        {stream.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                            {stream.description}
                          </p>
                        )}
                        <time className="text-xs text-muted-foreground mt-1 block">
                          {stream.scheduledFor
                            ? format(new Date(stream.scheduledFor), 'MMM d, yyyy · h:mm a')
                            : '—'}
                        </time>
                      </div>
                      <Button asChild variant="outline" size="sm" className="shrink-0">
                        <a
                          href={stream.streamUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
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

        {/* Events Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
            </div>
            {events.length > 0 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/p/${parishId}/events`}>View All</Link>
              </Button>
            )}
          </div>

          {events.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/p/${parishId}/events/${event.id}`}
                  className="rounded-lg border bg-card p-4 hover:shadow-md transition"
                >
                  <h3 className="font-semibold line-clamp-2">{event.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {format(new Date(event.startTime), 'MMM d, yyyy')}
                  </p>
                  {event.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No upcoming events scheduled.</p>
          )}
        </section>

        {/* Campaigns Section */}
        {campaignsWithProgress.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
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
                  className="rounded-lg border bg-card p-6 hover:shadow-md transition"
                >
                  <h3 className="font-semibold line-clamp-2">{campaign.name}</h3>
                  {campaign.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">₦{campaign.raisedAmount.toLocaleString()}</span>
                      <span className="text-muted-foreground">
                        of ₦{campaign.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-red-500 transition-all"
                        style={{ width: `${campaign.progress}%` }}
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
