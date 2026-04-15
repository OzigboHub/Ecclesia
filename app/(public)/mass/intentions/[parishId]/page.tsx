import db from "@/lib/db";
import { isFeatureEnabled } from "@/lib/features.server";
import { formatTime12h } from "@/lib/format-time";
import { format } from "date-fns";
import { BookOpen, Calendar, Church, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ParishIntentionsPage({
  params,
}: {
  params: Promise<{ parishId: string }>;
}) {
  const { parishId } = await params;
  if (!parishId) notFound();

  const org = await db.organization.findUnique({
    where: { id: parishId },
    select: { id: true, name: true, address: true },
  });
  if (!org) notFound();

  const enabled = await isFeatureEnabled(parishId, "enableMassIntentions");
  if (!enabled) {
    return (
      <div className="min-h-screen pt-[80px] bg-background">
        <div className="mx-auto max-w-4xl px-4 py-32">
          <h1 className="text-2xl font-bold mb-4">Mass Intentions</h1>
          <p className="text-muted-foreground">
            Mass intentions are not available for this parish at this time.
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();

  // Fetch upcoming masses with their approved intentions
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
      intentions: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          intention: true,
          intentionType: true,
          requestedBy: true,
          intendedFor: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const totalIntentions = masses.reduce(
    (sum, m) => sum + m.intentions.length,
    0,
  );

  return (
    <div className="min-h-screen pt-[80px] bg-background">
      <section className="border-b bg-linear-to-b from-muted/50 to-background py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Link
                href="/mass/intentions"
                className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors">
                &larr; All parishes
              </Link>
              <h1 className="text-3xl font-bold md:text-4xl">{org.name}</h1>
              <p className="text-sm text-muted-foreground md:text-base">
                {totalIntentions} approved intention
                {totalIntentions !== 1 ? "s" : ""} for upcoming masses
              </p>
            </div>
            <Button asChild>
              <Link href={`/p/${parishId}/mass-intentions`}>
                Book an intention
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 space-y-8">
        {masses.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">
              No upcoming masses scheduled.
            </p>
          </div>
        ) : (
          masses.map((mass) => (
            <section
              key={mass.id}
              className="rounded-xl border bg-card overflow-hidden">
              {/* Mass header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold">
                      {mass.massType.replace(/_/g, " ")}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(mass.date), "EEEE, MMMM d, yyyy")} ·{" "}
                    {formatTime12h(mass.time)}
                    {mass.location && ` · ${mass.location}`}
                    {mass.celebrant && ` · ${mass.celebrant}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {mass.intentions.length} intention
                    {mass.intentions.length !== 1 ? "s" : ""}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/p/${parishId}/mass-intentions?massId=${mass.id}`}>
                      Book
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Intentions list */}
              {mass.intentions.length > 0 ? (
                <ul className="divide-y">
                  {mass.intentions.map((mi) => (
                    <li
                      key={mi.id}
                      className="px-5 py-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm leading-snug">{mi.intention}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                            {mi.intentionType.replace(/_/g, " ")}
                          </span>
                          {mi.intendedFor && <span>For: {mi.intendedFor}</span>}
                          <span>By: {mi.requestedBy || "Anonymous"}</span>
                        </div>
                      </div>
                      <time className="shrink-0 text-xs text-muted-foreground">
                        {format(new Date(mi.createdAt), "MMM d, yyyy")}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No intentions booked yet.{" "}
                    <Link
                      href={`/p/${parishId}/mass-intentions?massId=${mass.id}`}
                      className="text-primary hover:underline">
                      Be the first
                    </Link>
                  </p>
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
