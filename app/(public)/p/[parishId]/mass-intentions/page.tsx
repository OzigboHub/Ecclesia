import { PublicMassIntentionBooking } from "@/components/mass-intentions/public-mass-intention-booking";
import db from "@/lib/db";
import { isFeatureEnabled } from "@/lib/features.server";
import { formatTime12h } from "@/lib/format-time";
import { format } from "date-fns";
import { BookOpen, Calendar, Church, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PublicMassIntentionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ parishId: string }>;
  searchParams: Promise<{ massId?: string }>;
}) {
  const { parishId } = await params;
  const { massId } = await searchParams;
  if (!parishId) {
    notFound();
  }

  const org = await db.organization.findUnique({
    where: { id: parishId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!org) {
    notFound();
  }

  const massIntentionsEnabled = await isFeatureEnabled(
    parishId,
    "enableMassIntentions",
  );

  if (!massIntentionsEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-32">
          <h1 className="text-2xl font-bold mb-4">Mass Intentions</h1>
          <p className="text-muted-foreground">
            Mass intention booking is not available for this parish at this
            time.
          </p>
        </div>
      </div>
    );
  }

  // If massId is provided, fetch that specific mass
  if (massId) {
    const mass = await db.mass.findFirst({
      where: {
        id: massId,
        organizationId: parishId,
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        date: true,
        time: true,
        massType: true,
        location: true,
        celebrant: true,
        language: true,
      },
    });

    if (!mass) {
      notFound();
    }

    return (
      <div className="min-h-screen pt-15 bg-background">
        <div className="mx-auto max-w-lg px-4 py-12">
          <div className="space-y-2 mb-8">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Book Mass Intention</h1>
            </div>
            <p className="text-muted-foreground">
              Submit a mass intention request for{" "}
              <span className="font-medium text-foreground">{org.name}</span>
            </p>
          </div>

          {/* Selected mass details */}
          <div className="rounded-lg border bg-card p-4 mb-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Mass selected
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">
                  {format(new Date(mass.date), "MMMM d, yyyy")} &middot;{" "}
                  {formatTime12h(mass.time)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {mass.massType.replace(/_/g, " ")}
              </p>
              {mass.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {mass.location}
                </p>
              )}
              {mass.celebrant && (
                <p className="text-sm text-muted-foreground">
                  Celebrant: {mass.celebrant}
                </p>
              )}
            </div>
          </div>

          <PublicMassIntentionBooking
            organizationId={parishId}
            massId={mass.id}
          />
        </div>
      </div>
    );
  }

  // No massId provided — show list of upcoming masses to pick from
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const masses = await db.mass.findMany({
    where: {
      organizationId: parishId,
      date: { gte: now, lte: thirtyDaysLater },
      status: { not: "CANCELLED" },
    },
    select: {
      id: true,
      date: true,
      time: true,
      massType: true,
      location: true,
      celebrant: true,
      language: true,
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return (
    <div className="min-h-screen pt-15 bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-2 mb-8">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Book Mass Intention</h1>
          </div>
          <p className="text-muted-foreground">
            Select a mass and submit your intention for{" "}
            <span className="font-medium text-foreground">{org.name}</span>
          </p>
        </div>

        {masses.length === 0 ? (
          <p className="text-muted-foreground">No upcoming masses scheduled.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {masses.map((mass) => (
              <Link
                key={mass.id}
                href={`/p/${parishId}/mass-intentions?massId=${mass.id}`}
                className="rounded-xl border bg-card p-4 transition hover:shadow-md hover:border-primary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">
                    {formatTime12h(mass.time)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(mass.date), "MMMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {mass.massType.replace(/_/g, " ")}
                </p>
                {mass.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {mass.location}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
