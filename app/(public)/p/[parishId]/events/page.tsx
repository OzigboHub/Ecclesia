import Link from 'next/link';
import db from '@/lib/db';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';

export default async function ParishEventsPage({
  params,
}: {
  params: Promise<{ parishId: string }>;
}) {
  const { parishId } = await params;
  if (!parishId) {
    notFound();
  }

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
      endTime: true,
      location: true,
    },
    orderBy: { startTime: 'asc' },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Upcoming Events</h1>
        <p className="text-muted-foreground mb-6">Events for this parish.</p>

        <div className="space-y-4">
          {events.map((e: any) => (
            <Link
              key={e.id}
              href={`/p/${parishId}/events/${e.id}`}
              className="block rounded-lg border bg-card p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{e.title}</h3>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(e.startTime), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
              {e.location && <p className="text-sm text-muted-foreground mt-2">{e.location}</p>}
            </Link>
          ))}

          {events.length === 0 && (
            <div className="text-muted-foreground">No upcoming events for this parish.</div>
          )}
        </div>
      </div>
    </div>
  );
}
