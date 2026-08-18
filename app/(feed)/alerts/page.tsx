import { getParishFeed } from "@/app/actions/feed.actions";
import { getPreferences } from "@/app/actions/preferences.actions";
import { FeedShell } from "@/components/feed/feed-shell";
import { NotificationSetup } from "@/components/feed/alerts/notification-setup";
import { relativeTime } from "@/components/feed/feed-card-shell";
import db from "@/lib/db";
import type { AnnouncementItem, FeedItem, LiveItem } from "@/lib/feed/types";
import Link from "next/link";

export const metadata = { title: "Alerts · Ecclesia" };

export default async function AlertsPage() {
	const prefs = await getPreferences();

	if (!prefs.organizationId) {
		return (
			<FeedShell topBar={<AlertsTopBar />}>
				<p className="px-6 py-16 text-center text-body text-fg-muted">
					Choose a parish and anything they announce will show up here.
				</p>
			</FeedShell>
		);
	}

	const [organization, feed] = await Promise.all([
		db.organization.findUnique({
			where: { id: prefs.organizationId },
			select: { name: true },
		}),
		getParishFeed(prefs.organizationId),
	]);

	// Alerts are the things a parish actively said, not the whole timeline.
	// A type predicate rather than a bare filter, so `title` is known to exist
	// on every item that survives.
	//
	// `items` is annotated rather than inferred from `feed.data`: ActionResponse
	// declares `data?: T`, and on a cold build the generic does not always flow
	// far enough for the filter callback to infer its parameter — which fails
	// under noImplicitAny in CI while passing locally off a warm cache.
	const items: FeedItem[] = feed.data ?? [];
	const notices = items.filter(
		(item): item is AnnouncementItem | LiveItem =>
			item.kind === "announcement" ||
			item.kind === "societyPost" ||
			item.kind === "live",
	);

	return (
		<FeedShell topBar={<AlertsTopBar />}>
			{/* The permission prompt lives here, behind a deliberate tap —
			    never on first paint, where it is reflexively dismissed. */}
			<NotificationSetup initialLevel={prefs.notify} />

			{notices.length === 0 ?
				<p className="px-6 py-16 text-center text-body text-fg-muted">
					Nothing from {organization?.name ?? "your parish"} yet.
				</p>
			:	<ul className="divide-y divide-hairline border-t border-hairline">
					{notices.map((notice) => (
						<li key={notice.id}>
							<Link
								href="/feed"
								className="block px-4 py-3.5"
							>
								<p className="text-meta text-fg-muted">
									{notice.source.society?.name ??
										notice.source.organizationName}{" "}
									· {relativeTime(notice.at)}
								</p>
								<p className="mt-1 text-title-sm font-semibold text-fg">
									{notice.title}
								</p>
							</Link>
						</li>
					))}
				</ul>
			}
		</FeedShell>
	);
}

function AlertsTopBar() {
	return (
		<div className="sticky top-0 z-30 border-b border-hairline bg-surface-1/95 px-4 py-3 backdrop-blur pt-[calc(12px+env(safe-area-inset-top))]">
			<h1 className="text-title font-semibold text-fg">Alerts</h1>
		</div>
	);
}
