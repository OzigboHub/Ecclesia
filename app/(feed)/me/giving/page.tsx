import {
	getMemberGiving,
	type GivingEntry,
} from "@/app/actions/member.actions";
import { naira } from "@/components/feed/feed-card-shell";
import { FeedShell } from "@/components/feed/feed-shell";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Giving · Ecclesia" };

const monthFormatter = new Intl.DateTimeFormat("en-NG", {
	month: "long",
	year: "numeric",
});

export default async function GivingPage() {
	const result = await getMemberGiving();
	// Annotated rather than inferred — see the note in alerts/page.tsx.
	const entries: GivingEntry[] = result.data ?? [];

	// Grouped by month, because that is how anybody checking their own giving
	// thinks about it — "what did I give in July".
	const groups = new Map<string, typeof entries>();
	for (const entry of entries) {
		const key = monthFormatter.format(entry.date);
		const bucket = groups.get(key);
		if (bucket) bucket.push(entry);
		else groups.set(key, [entry]);
	}

	return (
		<FeedShell
			topBar={
				<div className="sticky top-0 z-30 flex items-center gap-1 border-b border-hairline bg-surface-1/95 px-2 py-2 backdrop-blur pt-[calc(8px+env(safe-area-inset-top))]">
					<Link
						href="/me"
						className="flex size-11 items-center justify-center rounded-[10px] text-fg-muted"
					>
						<ChevronLeft className="size-5" aria-hidden />
						<span className="sr-only">Back</span>
					</Link>
					<h1 className="text-title font-semibold text-fg">Giving</h1>
				</div>
			}
		>
			{entries.length === 0 ?
				<p className="px-6 py-16 text-center text-body text-fg-muted">
					Nothing yet. Anything you give will show up here with its
					receipt.
				</p>
			:	[...groups.entries()].map(([month, rows]) => (
					<section key={month}>
						<h2 className="px-4 pb-1.5 pt-4 font-plex-mono text-caption uppercase tracking-[0.1em] text-fg-dim">
							{month}
						</h2>
						<ul className="divide-y divide-hairline border-y border-hairline">
							{rows.map((entry) => (
								<li
									key={entry.id}
									className="flex items-start justify-between gap-4 px-4 py-3"
								>
									<div className="min-w-0">
										<p className="truncate text-body text-fg">
											{entry.campaignName ??
												humanisePurpose(entry.purpose)}
										</p>
										<p className="mt-0.5 text-caption text-fg-dim">
											{new Intl.DateTimeFormat("en-NG", {
												day: "numeric",
												month: "short",
											}).format(entry.date)}
											{entry.receiptNumber ?
												` · ${entry.receiptNumber}`
											:	""}
										</p>
									</div>
									<div className="shrink-0 text-right">
										{/* Right-aligned and tabular so the column
										    scans as a column of money. */}
										<p className="text-body font-semibold tabular-nums text-fg">
											{naira(entry.amount)}
										</p>
										<p
											className={cn(
												"mt-0.5 text-caption capitalize",
												entry.status === "COMPLETED" ?
													"text-positive"
												: entry.status === "FAILED" ?
													"text-critical"
												:	"text-fg-dim",
											)}
										>
											{entry.status.toLowerCase()}
										</p>
									</div>
								</li>
							))}
						</ul>
					</section>
				))
			}
		</FeedShell>
	);
}

function humanisePurpose(purpose: string): string {
	return purpose
		.toLowerCase()
		.replace(/_/g, " ")
		.replace(/^./, (c) => c.toUpperCase());
}
