import { auth } from "@/auth";
import { getLiveStream } from "@/app/actions/live-stream.actions";
import { YouTubePlayer } from "@/components/features/live-streams/youtube-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  User,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface StreamData {
  id: string;
  title: string;
  description: string | null;
  streamUrl: string;
  isLive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  scheduledFor: string | null;
  organization: { id: string; name: string } | null;
  mass: {
    id: string;
    date: string;
    time: string;
    massType: string;
    celebrant: string | null;
    location: string | null;
    status: string;
  } | null;
  createdBy: { id: string; firstName: string; lastName: string } | null;
}

interface WatchStreamPageProps {
  params: Promise<{ id: string }>;
}

export default async function WatchStreamPage({
  params,
}: WatchStreamPageProps) {
  const session = await auth();
  if (!session?.user) return notFound();

  const { id } = await params;
  const result = await getLiveStream(id);

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/live-streams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Live Streams
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">Stream not found</h3>
          <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
        </div>
      </div>
    );
  }

  const stream = result.data as StreamData;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/live-streams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Video Player */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <YouTubePlayer url={stream.streamUrl} title={stream.title} />
      </div>

      {/* Stream Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {stream.title}
                </h1>
                {stream.isLive && (
                  <Badge className="bg-red-600 text-white hover:bg-red-600">
                    LIVE
                  </Badge>
                )}
                {!stream.isLive && stream.endedAt && (
                  <Badge variant="secondary">Ended</Badge>
                )}
                {!stream.isLive && !stream.endedAt && (
                  <Badge variant="outline">Scheduled</Badge>
                )}
              </div>
              {stream.description && (
                <p className="mt-2 text-muted-foreground">
                  {stream.description}
                </p>
              )}
            </div>
          </div>

          {stream.organization && (
            <p className="text-sm text-muted-foreground">
              {stream.organization.name}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {stream.startedAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Started{" "}
                  {format(
                    new Date(stream.startedAt),
                    "MMM d, yyyy 'at' h:mm a",
                  )}
                </span>
              </div>
            )}
            {stream.endedAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Ended{" "}
                  {format(new Date(stream.endedAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" asChild>
            <a
              href={stream.streamUrl}
              target="_blank"
              rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Watch on YouTube
            </a>
          </Button>
        </div>

        {/* Mass Details Sidebar */}
        {stream.mass && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Mass Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(stream.mass.date), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{stream.mass.time}</span>
              </div>
              <div>
                <span className="font-medium">
                  {stream.mass.massType.replace(/_/g, " ")}
                </span>
              </div>
              {stream.mass.celebrant && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{stream.mass.celebrant}</span>
                </div>
              )}
              {stream.mass.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{stream.mass.location}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
