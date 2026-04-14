import db from "@/lib/db";
import { BookOpen, Church } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MassIntentionsParishesPage() {
  const parishes = await db.organization.findMany({
    where: {
      featureSettings: {
        enableMassIntentions: true,
      },
    },
    select: {
      id: true,
      name: true,
      address: true,
      _count: {
        select: {
          massIntentions: {
            where: {
              status: "APPROVED",
              mass: {
                date: { gte: new Date() },
                status: { not: "CANCELLED" },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen pt-[80px] bg-background">
      <section className="border-b bg-linear-to-b from-muted/50 to-background py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Mass Intentions
              </p>
              <h1 className="text-3xl font-bold md:text-4xl">
                Browse Parish Intentions
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Select a parish to view their mass intentions or book your own.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/mass">Back to masses</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {parishes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parishes.map((parish) => (
              <Link
                key={parish.id}
                href={`/mass/intentions/${parish.id}`}
                className="rounded-xl border bg-card p-6 transition hover:shadow-md hover:border-primary/50">
                <div className="flex items-start gap-3">
                  <Church className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold line-clamp-2">
                      {parish.name}
                    </h2>
                    {parish.address && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {parish.address}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium text-foreground">
                        {parish._count.massIntentions}
                      </span>{" "}
                      upcoming intention
                      {parish._count.massIntentions !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">
              No parishes have mass intentions enabled yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
