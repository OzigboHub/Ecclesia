import { auth } from "@/auth";
import { getLiveStreams } from "@/app/actions/live-stream.actions";
import { CreateLiveStreamDialog } from "@/components/features/live-streams/create-live-stream-dialog";
import { LiveStreamList } from "@/components/features/live-streams/live-stream-list";
import { canManageLiveStreams } from "@/lib/permissions";

export default async function LiveStreamsPage() {
  const session = await auth();
  const canManage = canManageLiveStreams(session?.user?.role ?? "");
  const result = await getLiveStreams();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Live Streams</h1>
          <p className="text-sm text-muted-foreground">
            Broadcast your mass services to parishioners via YouTube live
            streams.
          </p>
        </div>
        {canManage && <CreateLiveStreamDialog />}
      </div>

      {result.success ? (
        <LiveStreamList
          streams={(result.data ?? []) as any[]}
          userRole={session?.user?.role ?? ""}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">{result.message}</p>
        </div>
      )}
    </div>
  );
}
