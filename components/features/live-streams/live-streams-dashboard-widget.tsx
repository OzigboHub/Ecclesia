"use client";

import {
	getCurrentLiveStream,
	getLiveStreams,
} from "@/app/actions/live-stream.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import {
	ArrowRight,
	CirclePlay,
	Play,
	Radio,
	Video,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { YouTubeThumbnail } from "./youtube-player";

interface StreamItem {
	id: string;
	title: string;
	description: string | null;
	streamUrl: string;
	isLive: boolean;
	startedAt: string | null;
	endedAt: string | null;
	scheduledFor: string | null;
	mass: {
		id: string;
		date: string;
		time: string;
		massType: string;
		celebrant: string | null;
		location: string | null;
	} | null;
}

/**
 * Sacred Media widget for the parishioner dashboard.
 * Shows featured live stream (if any) and past recordings.
 */
export function SacredMediaWidget() {
	const [liveStream, setLiveStream] = useState<StreamItem | null>(null);
	const [pastStreams, setPastStreams] = useState<StreamItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		getLiveStreams()
			.then((result) => {
				if (result.success && result.data) {
					const all = result.data as StreamItem[];
					const live = all.find((s) => s.isLive) ?? null;
					setLiveStream(live);
					setPastStreams(
						all
							.filter((s) => !s.isLive && s.endedAt)
							.slice(0, 3),
					);
				}
			})
			.finally(() => setIsLoading(false));
	}, []);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<h2 className="text-xl font-bold tracking-tight">Sacred Media</h2>
				<div className="animate-pulse rounded-xl bg-muted aspect-video" />
				<div className="space-y-3">
					{Array.from({ length: 2 }).map((_, i) => (
						<div key={i} className="flex gap-3">
							<div className="animate-pulse rounded-lg bg-muted h-14 w-24 shrink-0" />
							<div className="flex-1 space-y-2">
								<div className="animate-pulse rounded bg-muted h-3 w-3/4" />
								<div className="animate-pulse rounded bg-muted h-2 w-1/2" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (!liveStream && pastStreams.length === 0) {
		return null;
	}

	return (
		<div className="space-y-5">
			<h2 className="text-xl font-bold tracking-tight">Sacred Media</h2>

			{/* Featured Stream — Live or most recent past */}
			{liveStream ? (
				<FeaturedLiveCard stream={liveStream} />
			) : pastStreams.length > 0 ? (
				<FeaturedPastCard stream={pastStreams[0]} />
			) : null}

			{/* Past Recordings */}
			{pastStreams.length > (liveStream ? 0 : 1) && (
				<div className="space-y-3">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Past Recordings
					</p>
					<div className="space-y-2">
						{(liveStream ? pastStreams : pastStreams.slice(1)).map(
							(stream) => (
								<PastStreamRow key={stream.id} stream={stream} />
							),
						)}
					</div>
				</div>
			)}

			{/* View More */}
			<Button
				variant="ghost"
				size="sm"
				className="w-full text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground"
				asChild>
				<Link href="/live-streams">
					View All Streams <ArrowRight className="ml-1 h-3 w-3" />
				</Link>
			</Button>
		</div>
	);
}

function FeaturedLiveCard({ stream }: { stream: StreamItem }) {
	return (
		<Link
			href={`/live-streams/${stream.id}`}
			className="group block overflow-hidden rounded-xl border border-red-500/20">
			{/* Thumbnail with overlay */}
			<div className="relative">
				<YouTubeThumbnail url={stream.streamUrl} title={stream.title} />
				{/* Dark gradient overlay */}
				<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
				{/* LIVE badge */}
				<div className="absolute left-3 top-3">
					<Badge className="animate-pulse bg-red-600 text-white hover:bg-red-600 gap-1">
						<Radio className="h-3 w-3" />
						LIVE NOW
					</Badge>
				</div>
				{/* Content over image */}
				<div className="absolute bottom-0 inset-x-0 p-4 space-y-2">
					<h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
						{stream.title}
					</h3>
					{stream.mass && (
						<p className="text-xs text-white/70">
							with{" "}
							{stream.mass.celebrant ??
								stream.mass.massType.replace(/_/g, " ")}
						</p>
					)}
					<Button
						size="sm"
						className="w-full bg-primary hover:bg-primary/90 font-semibold uppercase tracking-wider text-xs">
						Enter Sanctuary
					</Button>
				</div>
			</div>
		</Link>
	);
}

function FeaturedPastCard({ stream }: { stream: StreamItem }) {
	return (
		<Link
			href={`/live-streams/${stream.id}`}
			className="group block overflow-hidden rounded-xl border">
			<div className="relative">
				<YouTubeThumbnail url={stream.streamUrl} title={stream.title} />
				<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
				{/* Play overlay on hover */}
				<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
					<div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
						<Play className="h-6 w-6 text-white fill-white" />
					</div>
				</div>
				<div className="absolute bottom-0 inset-x-0 p-4 space-y-1">
					<h3 className="text-base font-bold text-white leading-tight line-clamp-2">
						{stream.title}
					</h3>
					{stream.mass && (
						<p className="text-xs text-white/70">
							{stream.mass.massType.replace(/_/g, " ")}
							{stream.mass.celebrant && ` · ${stream.mass.celebrant}`}
						</p>
					)}
					{stream.endedAt && (
						<p className="text-[11px] text-white/50">
							Recorded{" "}
							{formatDistanceToNow(new Date(stream.endedAt), {
								addSuffix: true,
							})}
						</p>
					)}
				</div>
			</div>
		</Link>
	);
}

function PastStreamRow({ stream }: { stream: StreamItem }) {
	const duration = stream.startedAt && stream.endedAt
		? formatDuration(new Date(stream.startedAt), new Date(stream.endedAt))
		: null;

	return (
		<Link
			href={`/live-streams/${stream.id}`}
			className="group flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-muted/50">
			<div className="relative w-20 shrink-0">
				<YouTubeThumbnail url={stream.streamUrl} title={stream.title} />
				{/* Play icon overlay */}
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="rounded-full bg-black/50 p-1">
						<Play className="h-3 w-3 text-white fill-white" />
					</div>
				</div>
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium leading-tight line-clamp-1 group-hover:text-primary transition-colors">
					{stream.title}
				</p>
				<p className="text-[11px] text-muted-foreground mt-0.5">
					{stream.endedAt &&
						`Recorded ${formatDistanceToNow(new Date(stream.endedAt), { addSuffix: true })}`}
					{duration && ` · ${duration}`}
				</p>
			</div>
		</Link>
	);
}

function formatDuration(start: Date, end: Date): string {
	const diffMs = end.getTime() - start.getTime();
	const mins = Math.round(diffMs / 60000);
	if (mins < 60) return `${mins}m`;
	const hrs = Math.floor(mins / 60);
	const remainingMins = mins % 60;
	return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
}
