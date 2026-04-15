"use client";

import { getPastStreams } from "@/app/actions/live-stream.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowRight, CirclePlay, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { YouTubeThumbnail } from "./youtube-player";

interface PastStream {
  id: string;
  title: string;
  description: string | null;
  streamUrl: string;
  endedAt: string | null;
  mass: {
    id: string;
    date: string;
    time: string;
    massType: string;
    celebrant: string | null;
    location: string | null;
  } | null;
}

interface PastStreamsWidgetProps {
  limit?: number;
}

export function PastStreamsWidget({ limit = 4 }: PastStreamsWidgetProps) {
  const [streams, setStreams] = useState<PastStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPastStreams()
      .then((result) => {
        if (result.success && result.data) {
          setStreams((result.data as PastStream[]).slice(0, limit));
        }
      })
      .finally(() => setIsLoading(false));
  }, [limit]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Past Streams</CardTitle>
          <CardDescription>Rewatch previous mass services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg bg-muted aspect-video"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (streams.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Past Streams</CardTitle>
          <CardDescription>Rewatch previous mass services</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/live-streams">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {streams.map((stream) => (
            <Link
              key={stream.id}
              href={`/live-streams/${stream.id}`}
              className="group overflow-hidden rounded-lg border transition-colors hover:border-primary">
              <div className="relative">
                <YouTubeThumbnail url={stream.streamUrl} title={stream.title} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <CirclePlay className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {stream.title}
                </h4>
                {stream.mass && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {stream.mass.massType.replace(/_/g, " ")} ·{" "}
                    {format(new Date(stream.mass.date), "MMM d, yyyy")}
                  </p>
                )}
                {stream.endedAt && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {format(new Date(stream.endedAt), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CurrentLiveStreamBanner() {
  const [stream, setStream] = useState<{
    id: string;
    title: string;
    streamUrl: string;
    mass: { massType: string; celebrant: string | null } | null;
    organization: { name: string } | null;
  } | null>(null);

  useEffect(() => {
    import("@/app/actions/live-stream.actions").then(
      ({ getCurrentLiveStream }) => {
        getCurrentLiveStream().then((result) => {
          if (result.success && result.data) {
            setStream(result.data as any);
          }
        });
      },
    );
  }, []);

  if (!stream) return null;

  return (
    <Card className="border-red-500/50 bg-red-500/5">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex items-center gap-2">
          <Badge className="animate-pulse bg-red-600 text-white hover:bg-red-600">
            <Video className="mr-1 h-3 w-3" />
            LIVE NOW
          </Badge>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{stream.title}</p>
          {stream.mass && (
            <p className="text-xs text-muted-foreground">
              {stream.mass.massType.replace(/_/g, " ")}
              {stream.mass.celebrant && ` · ${stream.mass.celebrant}`}
            </p>
          )}
        </div>
        <Button size="sm" asChild>
          <Link href={`/live-streams/${stream.id}`}>
            <CirclePlay className="mr-1 h-4 w-4" />
            Watch
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
