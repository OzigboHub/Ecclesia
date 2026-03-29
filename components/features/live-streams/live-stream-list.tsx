"use client";

import {
  deleteLiveStream,
  endStream,
  goLive,
} from "@/app/actions/live-stream.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canManageLiveStreams } from "@/lib/permissions";
import { format } from "date-fns";
import {
  CirclePlay,
  CircleStop,
  ExternalLink,
  Eye,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { YouTubeThumbnail } from "./youtube-player";

interface LiveStreamItem {
  id: string;
  title: string;
  description: string | null;
  streamUrl: string;
  isLive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  mass: {
    id: string;
    date: string;
    time: string;
    massType: string;
    celebrant: string | null;
    location: string | null;
  } | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface LiveStreamListProps {
  streams: LiveStreamItem[];
  userRole: string;
}

export function LiveStreamList({ streams, userRole }: LiveStreamListProps) {
  const router = useRouter();
  const canManage = canManageLiveStreams(userRole);

  if (streams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <CirclePlay className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold">No live streams yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a live stream to broadcast your mass service to parishioners on
          the platform.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {streams.map((stream) => (
        <LiveStreamCard
          key={stream.id}
          stream={stream}
          canManage={canManage}
          onRefresh={() => router.refresh()}
        />
      ))}
    </div>
  );
}

function LiveStreamCard({
  stream,
  canManage,
  onRefresh,
}: {
  stream: LiveStreamItem;
  canManage: boolean;
  onRefresh: () => void;
}) {
  const [isPending, setIsPending] = useState(false);

  const handleGoLive = async () => {
    setIsPending(true);
    try {
      const result = await goLive(stream.id);
      if (result.success) {
        toast.success(result.message);
        onRefresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleEndStream = async () => {
    setIsPending(true);
    try {
      const result = await endStream(stream.id);
      if (result.success) {
        toast.success(result.message);
        onRefresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this live stream?")) return;
    setIsPending(true);
    try {
      const result = await deleteLiveStream(stream.id);
      if (result.success) {
        toast.success(result.message);
        onRefresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="relative">
        <YouTubeThumbnail url={stream.streamUrl} title={stream.title} />
        {stream.isLive && (
          <Badge className="absolute left-2 top-2 bg-red-600 text-white hover:bg-red-600">
            LIVE
          </Badge>
        )}
        {!stream.isLive && stream.endedAt && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            Ended
          </Badge>
        )}
        {!stream.isLive && !stream.endedAt && (
          <Badge
            variant="outline"
            className="absolute left-2 top-2 bg-background/80">
            Scheduled
          </Badge>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold leading-tight line-clamp-1">
          {stream.title}
        </h3>
        {stream.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {stream.description}
          </p>
        )}

        {stream.mass && (
          <div className="mt-2 rounded bg-muted/50 px-2 py-1.5">
            <p className="text-xs font-medium">
              {stream.mass.massType.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(stream.mass.date), "MMM d, yyyy")} at{" "}
              {stream.mass.time}
              {stream.mass.celebrant && ` · ${stream.mass.celebrant}`}
            </p>
          </div>
        )}

        <p className="mt-2 text-xs text-muted-foreground">
          Created {format(new Date(stream.createdAt), "MMM d, yyyy")}
          {stream.createdBy &&
            ` by ${stream.createdBy.firstName} ${stream.createdBy.lastName}`}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/live-streams/${stream.id}`}>
              <Eye className="mr-1 h-3.5 w-3.5" />
              Watch
            </Link>
          </Button>

          {/* <Button variant="ghost" size="sm" asChild>
            <a
              href={stream.streamUrl}
              target="_blank"
              rel="noopener noreferrer">
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              YouTube
            </a>
          </Button> */}

          {canManage && (
            <>
              {!stream.isLive && !stream.endedAt && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleGoLive}
                  disabled={isPending}>
                  <CirclePlay className="mr-1 h-3.5 w-3.5" />
                  Go Live
                </Button>
              )}

              {stream.isLive && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleEndStream}
                  disabled={isPending}>
                  <CircleStop className="mr-1 h-3.5 w-3.5" />
                  End
                </Button>
              )}

              {!stream.isLive && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
