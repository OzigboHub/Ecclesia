import db from "@/lib/db";
import { Calendar, Church, MapPin } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchParams = {
  q?: string;
};

export default async function Masses({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const now = new Date();

  const parishes = await db.organization.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { address: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      address: true,
      contactPhone: true,
      _count: {
        select: {
          masses: {
            where: {
              date: { gte: now },
              status: { not: "CANCELLED" },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen pt-20 bg-background">
      <section className="border-b bg-linear-to-b from-muted/50 to-background py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Masses
              </p>
              <h1 className="text-3xl font-bold md:text-4xl">
                Browse Parishes
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Select a parish to view their masses and book intentions.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/mass/intentions">Mass intentions</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>

          {/* Search */}
          <form className="mt-6">
            <Input
              name="q"
              placeholder="Search parishes by name or location..."
              defaultValue={query}
              className="max-w-md"
            />
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {parishes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parishes.map((parish) => (
              <Link
                key={parish.id}
                href={`/mass/${parish.id}`}
                className="rounded-xl border bg-card p-6 transition hover:shadow-md hover:border-primary/50"
              >
                <div className="flex items-start gap-3">
                  <Church className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold line-clamp-2">
                      {parish.name}
                    </h2>
                    {parish.address && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {parish.address}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-3">
                      <span className="font-medium text-foreground">
                        {parish._count.masses}
                      </span>{" "}
                      upcoming mass
                      {parish._count.masses !== 1 ? "es" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">
              {query
                ? "No parishes match your search."
                : "No parishes available yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
