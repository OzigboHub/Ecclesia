import db from "@/lib/db";
import { formatTime12h } from "@/lib/format-time";
import { format } from "date-fns";
import { Calendar, Church, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ParishMassesPage({
  params,
}: {
  params: Promise<{ parishId: string }>;
}) {
  const { parishId } = await params;
  if (!parishId) notFound();

  const org = await db.organization.findUnique({
    where: { id: parishId },
    select: {
      id: true,
      name: true,
      address: true,
      contactPhone: true,
      contactEmail: true,
    },
  });
  if (!org) notFound();

  const now = new Date();

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
      status: true,
      language: true,
      location: true,
      celebrant: true,
      _count: { select: { intentions: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return (
    <div className="min-h-screen pt-20 bg-background">
      <section className="border-b bg-linear-to-b from-muted/50 to-background py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Link
                href="/mass"
                className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors">
                &larr; All parishes
              </Link>
              <h1 className="text-3xl font-bold md:text-4xl">{org.name}</h1>
              <p className="text-sm text-muted-foreground md:text-base">
                {masses.length} upcoming mass
                {masses.length !== 1 ? "es" : ""} scheduled
                {org.address && ` · ${org.address}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/p/${parishId}/mass-intentions`}>
                  Book an intention
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/mass/intentions/${parishId}`}>
                  View intentions
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {masses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {masses.map((mass) => (
              <div
                key={mass.id}
                className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">
                      {mass.massType.replace(/_/g, " ")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(mass.date), "EEEE, MMMM d, yyyy")} ·{" "}
                      {formatTime12h(mass.time)}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {mass.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {mass.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{mass.location}</span>
                    </div>
                  )}
                  {mass.celebrant && <p>Celebrant: {mass.celebrant}</p>}
                  {mass.language && <p>Language: {mass.language}</p>}
                  <p>
                    {mass._count.intentions} intention
                    {mass._count.intentions !== 1 ? "s" : ""} booked
                  </p>
                </div>
                <div className="mt-5">
                  <Button asChild size="sm" className="w-full">
                    <Link
                      href={`/p/${parishId}/mass-intentions?massId=${mass.id}`}>
                      Book intention for this mass
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">
              No upcoming masses scheduled for this parish.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
