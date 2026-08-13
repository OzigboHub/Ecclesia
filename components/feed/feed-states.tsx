import { CloudOff, Inbox } from "lucide-react";
import Link from "next/link";

/**
 * Loading, empty and offline.
 *
 * Skeletons rather than spinners throughout: a spinner says "wait", a skeleton
 * says "here is the shape of what's coming", and on a slow connection the
 * difference is whether the wait feels like progress.
 */

function SkeletonBlock({ className }: { className?: string }) {
	return (
		<div
			className={`rounded bg-surface-2 [background-image:linear-gradient(90deg,transparent_0,color-mix(in_srgb,var(--surface-3)_70%,transparent)_50%,transparent_100%)] [background-size:340px_100%] [animation:feedShimmer_1.4s_linear_infinite] ${className ?? ""}`}
		/>
	);
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div aria-busy="true" aria-label="Loading the feed">
			{Array.from({ length: count }).map((_, index) => (
				<div key={index} className="border-b border-hairline px-4 py-3.5">
					<div className="mb-2.5 flex items-center gap-2">
						<SkeletonBlock className="size-5 rounded-md" />
						<SkeletonBlock className="h-3 w-32" />
					</div>
					<SkeletonBlock className="h-4 w-3/4" />
					<SkeletonBlock className="mt-2 h-3 w-full" />
					<SkeletonBlock className="mt-1.5 h-3 w-5/6" />
					{index % 2 === 0 && (
						<SkeletonBlock
							className="mt-2.5 w-full rounded-[10px]"
							// Reserve the same box a real image would take, so
							// nothing jumps when the content arrives.
						/>
					)}
				</div>
			))}
		</div>
	);
}

export function FeedEmpty({
	parishName,
	description,
}: {
	parishName: string;
	description?: string;
}) {
	return (
		<div className="flex flex-col items-center px-8 py-16 text-center">
			<span
				aria-hidden
				className="flex size-14 items-center justify-center rounded-full bg-surface-2"
			>
				<Inbox className="size-6 text-fg-dim" />
			</span>
			<h2 className="mt-4 text-title font-semibold text-fg">
				Nothing here yet
			</h2>
			<p className="mt-2 max-w-[34ch] text-body text-pretty text-fg-muted">
				{description ??
					`${parishName} hasn't posted anything yet. When they share Mass times, announcements or events, they'll appear here.`}
			</p>
			<Link
				href="/explore"
				className="mt-5 flex min-h-11 items-center rounded-[10px] border border-hairline px-5 text-body font-medium text-fg"
			>
				Look at another parish
			</Link>
		</div>
	);
}

export function FeedOffline() {
	return (
		<div className="flex flex-col items-center px-8 py-16 text-center">
			<span
				aria-hidden
				className="flex size-14 items-center justify-center rounded-full bg-surface-2"
			>
				<CloudOff className="size-6 text-fg-dim" />
			</span>
			<h2 className="mt-4 text-title font-semibold text-fg">
				You&rsquo;re offline
			</h2>
			<p className="mt-2 max-w-[34ch] text-body text-pretty text-fg-muted">
				This is what we saved the last time you had signal. It&rsquo;ll
				refresh on its own when you&rsquo;re back.
			</p>
		</div>
	);
}
