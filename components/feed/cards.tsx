"use client";

import { toggleEventRsvp } from "@/app/actions/rsvp.actions";
import type {
	AnnouncementItem,
	CampaignItem,
	EventItem,
	FeedItem,
	IntentionsItem,
	LiveItem,
	MassTimesItem,
	MomentsItem,
} from "@/lib/feed/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	CardAction,
	FeedCardShell,
	FeedImage,
	naira,
} from "./feed-card-shell";
import { useLockIn } from "./lock-in/lock-in-provider";

/**
 * The eight card types.
 *
 * Shared rules, applied throughout: nothing exceeds title-sm (15/16px), money
 * and times are tabular-nums so columns line up, and every tappable thing
 * clears 44px however small its label is.
 */

export function FeedCard({ item }: { item: FeedItem }) {
	switch (item.kind) {
		case "live":
			return <LiveCard item={item} />;
		case "massTimes":
			return <MassTimesCard item={item} />;
		case "announcement":
		case "societyPost":
			return <AnnouncementCard item={item} />;
		case "campaign":
			return <CampaignCard item={item} />;
		case "event":
			return <EventCard item={item} />;
		case "intentions":
			return <IntentionsCard item={item} />;
		case "moments":
			return <MomentsCard item={item} />;
	}
}

// --- Live ------------------------------------------------------------------

function LiveCard({ item }: { item: LiveItem }) {
	const when =
		item.isLive ?
			item.startedAt ?
				`started ${minutesSince(item.startedAt)}`
			:	"live now"
		: item.scheduledFor ?
			new Intl.DateTimeFormat("en-NG", {
				weekday: "long",
				hour: "numeric",
				minute: "2-digit",
			}).format(item.scheduledFor)
		:	"scheduled";

	return (
		<FeedCardShell source={item.source} at={item.at}>
			<Link
				href={item.streamUrl}
				target="_blank"
				rel="noreferrer"
				className="relative block overflow-hidden rounded-[10px] bg-surface-2"
				style={{ aspectRatio: "16/9" }}
			>
				<span className="absolute inset-0 flex items-center justify-center">
					<span className="flex size-13 items-center justify-center rounded-full bg-surface-0/70">
						<svg viewBox="0 0 20 20" className="size-5 fill-fg">
							<path d="M7 4.6 15.4 10 7 15.4z" />
						</svg>
					</span>
				</span>
				{item.isLive && (
					<span className="absolute left-2 top-2 flex h-[22px] items-center gap-1.5 rounded-md bg-surface-0/85 px-2 backdrop-blur-sm">
						<span
							aria-hidden
							className="size-1.5 rounded-full bg-gold [animation:livePulse_1.6s_ease-in-out_infinite]"
						/>
						<span className="text-caption font-semibold tracking-[0.06em] text-fg">
							LIVE
						</span>
					</span>
				)}
			</Link>
			<h3 className="mt-2.5 text-title-sm font-semibold text-fg">
				{item.title}
			</h3>
			<p className="mt-1 text-meta text-fg-muted">
				{item.celebrant ? `${item.celebrant} · ` : ""}
				{when}
			</p>
		</FeedCardShell>
	);
}

function minutesSince(date: Date): string {
	const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	return `${hours}h ago`;
}

// --- Mass times ------------------------------------------------------------

function MassTimesCard({ item }: { item: MassTimesItem }) {
	return (
		<FeedCardShell source={item.source}>
			{item.today.length > 0 && (
				<>
					<h3 className="text-title-sm font-semibold text-fg">
						{item.todayLabel}
					</h3>
					<MassList entries={item.today} />
				</>
			)}

			{item.today.length > 0 && item.sunday.length > 0 && (
				<div className="my-3 h-px bg-hairline" />
			)}

			{item.sunday.length > 0 && (
				<>
					<h3
						className={cn(
							"font-semibold",
							item.today.length > 0 ?
								"text-body-sm text-fg-muted"
							:	"text-title-sm text-fg",
						)}
					>
						{item.sundayLabel}
					</h3>
					<MassList entries={item.sunday} />
				</>
			)}

			<Link
				href="/masses"
				className="flex min-h-11 items-center text-body-sm font-semibold text-gold"
			>
				See the full schedule
			</Link>
		</FeedCardShell>
	);
}

function MassList({ entries }: { entries: MassTimesItem["today"] }) {
	return (
		<ul className="mt-2 flex flex-col gap-2 tabular-nums">
			{entries.map((mass) => (
				<li key={mass.id} className="flex items-baseline gap-3">
					<span className="w-[62px] shrink-0 text-body-sm font-semibold text-gold">
						{mass.time}
					</span>
					<span className="text-body-sm text-fg">
						{mass.language ?? mass.celebrant ?? "Mass"}
					</span>
					{mass.location && (
						<span className="ml-auto shrink-0 text-meta text-fg-dim">
							{mass.location}
						</span>
					)}
				</li>
			))}
		</ul>
	);
}

// --- Announcement / society post -------------------------------------------

const TRUNCATE_AT = 180;

function AnnouncementCard({ item }: { item: AnnouncementItem }) {
	const [expanded, setExpanded] = useState(false);
	const isLong = item.content.length > TRUNCATE_AT;
	const shown =
		expanded || !isLong ?
			item.content
		:	item.content.slice(0, TRUNCATE_AT).trimEnd();

	return (
		<FeedCardShell source={item.source} at={item.at}>
			<h3 className="text-title-sm font-semibold text-fg">{item.title}</h3>
			<p className="mt-1.5 whitespace-pre-line text-body text-pretty text-fg-body">
				{shown}
				{isLong && !expanded && <span className="text-fg-dim">…</span>}
			</p>
			{isLong && !expanded && (
				<CardAction onClick={() => setExpanded(true)}>Read more</CardAction>
			)}
			<FeedImage src={item.imageUrl} alt="" ratio="3/2" />
		</FeedCardShell>
	);
}

// --- Campaign --------------------------------------------------------------

function CampaignCard({ item }: { item: CampaignItem }) {
	const { requireMember } = useLockIn();

	return (
		<FeedCardShell source={item.source} at={item.at}>
			<h3 className="text-title-sm font-semibold text-fg">{item.name}</h3>
			{item.endDate && (
				<p className="mt-1 text-body-sm text-fg-muted">
					Closes{" "}
					{new Intl.DateTimeFormat("en-NG", {
						day: "numeric",
						month: "long",
					}).format(item.endDate)}
				</p>
			)}

			<div className="mt-2.5 flex items-baseline justify-between tabular-nums">
				<span className="text-title-sm font-semibold text-fg">
					{naira(item.raisedAmount)}
				</span>
				<span className="text-meta text-fg-muted">
					of {naira(item.targetAmount)}
				</span>
			</div>

			<div
				role="progressbar"
				aria-valuenow={item.progress}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={`${item.name} progress`}
				className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"
			>
				<div
					className="h-full rounded-full bg-gold"
					style={{ width: `${item.progress}%` }}
				/>
			</div>

			<div className="mt-2 flex items-center justify-between gap-3">
				<span className="text-meta tabular-nums text-fg-dim">
					{item.progress}%
					{item.supporters ? ` · ${item.supporters} giving` : ""}
				</span>
				<button
					type="button"
					onClick={() =>
						requireMember({
							label: `Give to ${item.name}`,
							// The parish's own campaign page, which already
							// carries the giving flow — rather than /pay, which
							// is a staff screen listing payment types.
							run: () => {
								window.location.href = `/p/${item.source.organizationId}/campaigns/${item.id.replace("campaign:", "")}`;
							},
						})
					}
					className="flex h-11 items-center rounded-[10px] bg-gold px-5 text-body font-semibold text-on-gold transition-[filter] hover:brightness-105"
				>
					Give
				</button>
			</div>
		</FeedCardShell>
	);
}

// --- Event -----------------------------------------------------------------

function EventCard({ item }: { item: EventItem }) {
	const { requireMember } = useLockIn();
	const [going, setGoing] = useState(item.isGoing);
	const [count, setCount] = useState(item.going);
	const [pending, startTransition] = useTransition();

	const eventId = item.id.replace("event:", "");

	function rsvp() {
		requireMember({
			label: `RSVP to ${item.title}`,
			run: () =>
				startTransition(async () => {
					// Optimistic: the tap should feel done before the round trip.
					const next = !going;
					setGoing(next);
					setCount((c) => c + (next ? 1 : -1));

					const result = await toggleEventRsvp(eventId);
					if (!result.success) {
						setGoing(!next);
						setCount((c) => c + (next ? -1 : 1));
						toast.error(result.message);
					}
				}),
		});
	}

	return (
		<FeedCardShell source={item.source} at={item.at}>
			<div className="flex gap-3">
				<div className="w-13 shrink-0 rounded-[10px] border border-hairline bg-surface-2 py-1.5 text-center">
					<div className="font-plex-mono text-caption tracking-[0.1em] text-gold">
						{new Intl.DateTimeFormat("en-NG", { month: "short" })
							.format(item.startTime)
							.toUpperCase()}
					</div>
					<div className="text-headline font-semibold tabular-nums text-fg">
						{item.startTime.getDate()}
					</div>
				</div>

				<div className="min-w-0 flex-1">
					<h3 className="text-title-sm font-semibold text-fg">
						{item.title}
					</h3>
					<p className="mt-1 text-body-sm text-fg-muted">
						{new Intl.DateTimeFormat("en-NG", {
							weekday: "long",
							hour: "numeric",
							minute: "2-digit",
						}).format(item.startTime)}
						{item.location ? ` · ${item.location}` : ""}
					</p>

					<div className="mt-2 flex items-center gap-3">
						<button
							type="button"
							onClick={rsvp}
							disabled={pending}
							aria-pressed={going}
							className={cn(
								"flex h-11 items-center rounded-[10px] px-4.5 text-body font-semibold transition-colors disabled:opacity-60",
								going ?
									"border border-gold bg-gold/10 text-gold"
								:	"border border-fg-dim/40 text-fg hover:bg-surface-2",
							)}
						>
							{going ? "You're going" : "I'll be there"}
						</button>
						{count > 0 && (
							<span className="text-meta tabular-nums text-fg-dim">
								{count} going
							</span>
						)}
					</div>
				</div>
			</div>
		</FeedCardShell>
	);
}

// --- Mass intentions -------------------------------------------------------

function IntentionsCard({ item }: { item: IntentionsItem }) {
	const { requireMember } = useLockIn();

	return (
		<FeedCardShell source={item.source} tone="quiet">
			<h3 className="font-plex-serif text-title-sm text-fg">Pray for</h3>
			<ul className="mt-2.5 flex flex-col gap-2.5">
				{item.entries.map((entry) => (
					<li key={entry.id}>
						<p className="font-plex-serif text-body leading-[21px] text-fg-body">
							{entry.intention}
						</p>
						<p className="mt-0.5 text-caption text-fg-dim">
							Requested by {entry.requestedBy} · {entry.massLabel}
						</p>
					</li>
				))}
			</ul>
			<CardAction
				onClick={() =>
					requireMember({
						label: "Book a Mass intention",
						run: () => {
							window.location.href = "/mass-intentions";
						},
					})
				}
			>
				Book an intention
			</CardAction>
		</FeedCardShell>
	);
}

// --- Parish moments --------------------------------------------------------

function MomentsCard({ item }: { item: MomentsItem }) {
	const names = item.people.map((p) => p.displayName);
	const sentence =
		names.length === 1 ? names[0]
		: names.length === 2 ? `${names[0]} and ${names[1]}`
		: `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

	return (
		<FeedCardShell source={item.source}>
			<h3 className="text-title-sm font-semibold text-fg">{item.title}</h3>
			<div className="mt-2.5 flex items-center">
				<div className="flex" aria-hidden>
					{item.people.slice(0, 4).map((person, index) => (
						<span
							key={person.id}
							style={{ marginLeft: index === 0 ? 0 : -8 }}
							className="flex size-8.5 items-center justify-center rounded-full border-2 border-surface-0 bg-surface-3 text-meta font-semibold text-gold"
						>
							{person.initials}
						</span>
					))}
				</div>
				<p className="ml-2.5 text-body-sm text-fg-body">{sentence}</p>
			</div>
			<p className="mt-2.5 text-meta leading-[18px] text-fg-dim">
				Birthdays and sacraments appear only for members who chose to share
				them.
			</p>
		</FeedCardShell>
	);
}
