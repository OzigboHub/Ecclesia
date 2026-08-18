import { getHighlightsFeed } from "@/app/actions/feed.actions";
import { getPreferences } from "@/app/actions/preferences.actions";
import { FeedList } from "@/components/feed/feed-list";
import { FeedShell } from "@/components/feed/feed-shell";
import { LockInProvider } from "@/components/feed/lock-in/lock-in-provider";
import { ParishSwitcher } from "@/components/feed/explore/parish-switcher";
import db from "@/lib/db";
import { HIDDEN_ORGANIZATION_NAMES } from "@/lib/organization-visibility";

export const metadata = {
	title: "Explore · Ecclesia",
	description: "Find a parish and see what's happening across Ecclesia.",
};

export default async function ExplorePage() {
	const prefs = await getPreferences();

	const [parishes, highlights] = await Promise.all([
		db.organization.findMany({
			where: { name: { notIn: HIDDEN_ORGANIZATION_NAMES } },
			select: { id: true, name: true, address: true },
			orderBy: { name: "asc" },
			take: 12,
		}),
		getHighlightsFeed(),
	]);

	return (
		<FeedShell
			topBar={
				<div className="sticky top-0 z-30 border-b border-hairline bg-surface-1/95 px-4 py-3 backdrop-blur pt-[calc(12px+env(safe-area-inset-top))]">
					<h1 className="text-title font-semibold text-fg">Explore</h1>
				</div>
			}
		>
			<ParishSwitcher
				parishes={parishes}
				currentId={prefs.organizationId}
			/>

			<div className="border-b border-hairline px-4 py-3">
				<h2 className="font-plex-mono text-caption uppercase tracking-[0.1em] text-fg-dim">
					Across Ecclesia
				</h2>
			</div>

			<LockInProvider isMember={false} organizationId={null} organizationName="">
				<FeedList items={highlights.data ?? []} />
			</LockInProvider>
		</FeedShell>
	);
}
