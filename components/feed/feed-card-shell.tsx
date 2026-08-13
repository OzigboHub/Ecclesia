import type { FeedSource } from "@/lib/feed/types";
import { cn } from "@/lib/utils";

/**
 * Every feed card sits in this.
 *
 * Full-bleed with a hairline divider on mobile — no gutters, no floating
 * rounded boxes. At 360px wide, gutters cost about 8% of the readable line and
 * buy nothing; the type hierarchy is what separates one card from the next.
 * Radius and gaps only appear from `lg` up, where there is width to spare.
 */
export function FeedCardShell({
	source,
	at,
	children,
	className,
	tone = "default",
}: {
	source: FeedSource;
	at?: Date;
	children: React.ReactNode;
	className?: string;
	/** "quiet" tints the card — used only for Mass intentions. */
	tone?: "default" | "quiet";
}) {
	return (
		<article
			className={cn(
				"border-b border-hairline px-4 pt-3 pb-3.5",
				"lg:mb-2 lg:rounded-card lg:border lg:px-4 lg:py-4",
				tone === "quiet" && "bg-surface-1/60",
				className,
			)}
		>
			<SourceLine source={source} at={at} />
			{children}
		</article>
	);
}

/**
 * Provenance. This is a multi-tenant feed — a card without a parish on it is a
 * card you cannot trust.
 */
export function SourceLine({
	source,
	at,
}: {
	source: FeedSource;
	at?: Date;
}) {
	const name = source.society?.name ?? source.organizationName;
	const suffix = source.society ? null : source.context;

	return (
		<div className="mb-2 flex items-center gap-2">
			<span
				className={cn(
					"flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-gold",
					source.society ? "bg-gold/15" : "bg-surface-3",
				)}
				aria-hidden
			>
				{source.initials}
			</span>
			<span className="truncate text-meta text-fg-muted">
				{name}
				{suffix ? ` · ${suffix}` : ""}
			</span>
			{source.society && (
				<span className="shrink-0 rounded bg-surface-3 px-1.5 text-caption leading-4 text-fg-body">
					Society
				</span>
			)}
			{at && (
				<time
					dateTime={at.toISOString()}
					className="shrink-0 text-caption text-fg-dim"
				>
					· {relativeTime(at)}
				</time>
			)}
		</div>
	);
}

/**
 * Compact relative time. Deliberately terse — "3h" not "3 hours ago" — because
 * it shares a 360px line with a parish name that matters more.
 */
export function relativeTime(date: Date): string {
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	if (seconds < 60) return "now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d`;
	const weeks = Math.floor(days / 7);
	if (weeks < 5) return `${weeks}w`;
	return new Intl.DateTimeFormat("en-NG", {
		day: "numeric",
		month: "short",
	}).format(date);
}

/** ₦4,820,000 — no decimals; parish sums are large and round. */
export function naira(amount: number): string {
	return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

/**
 * Media placeholder with a reserved aspect ratio.
 *
 * Every image in the feed goes through something like this. On a 3G connection
 * an unreserved image box means the whole timeline jumps when it loads, which
 * on a feed you are actively scrolling is the difference between usable and
 * infuriating.
 */
export function FeedImage({
	src,
	alt,
	ratio = "3/2",
	className,
}: {
	src: string | null;
	alt: string;
	ratio?: "16/9" | "3/2";
	className?: string;
}) {
	if (!src) return null;
	return (
		<div
			style={{ aspectRatio: ratio }}
			className={cn(
				"mt-2.5 overflow-hidden rounded-[10px] bg-surface-2",
				className,
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={src}
				alt={alt}
				loading="lazy"
				decoding="async"
				className="size-full object-cover"
			/>
		</div>
	);
}

/** Inline text link sized as a 44px target without looking like a button. */
export function CardAction({
	children,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			{...props}
			className={cn(
				"flex min-h-11 items-center text-body-sm font-semibold text-gold disabled:opacity-50",
				props.className,
			)}
		>
			{children}
		</button>
	);
}
