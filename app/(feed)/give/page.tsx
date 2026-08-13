import { getParishFeed } from "@/app/actions/feed.actions";
import { getMemberProfile } from "@/app/actions/member.actions";
import { getPreferences } from "@/app/actions/preferences.actions";
import { auth } from "@/auth";
import { FeedCard } from "@/components/feed/cards";
import { naira } from "@/components/feed/feed-card-shell";
import { FeedShell } from "@/components/feed/feed-shell";
import { LockInProvider } from "@/components/feed/lock-in/lock-in-provider";
import db from "@/lib/db";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Give · Ecclesia" };

export default async function GivePage() {
	const [prefs, session] = await Promise.all([getPreferences(), auth()]);

	if (!prefs.organizationId) {
		return (
			<FeedShell topBar={<GiveTopBar />}>
				<p className="px-6 py-16 text-center text-body text-fg-muted">
					Choose a parish first and its campaigns will appear here.
				</p>
				<div className="flex justify-center">
					<Link
						href="/start"
						className="flex h-11 items-center rounded-[10px] bg-gold px-5 text-body font-semibold text-on-gold"
					>
						Find my parish
					</Link>
				</div>
			</FeedShell>
		);
	}

	const [organization, feed, profile] = await Promise.all([
		db.organization.findUnique({
			where: { id: prefs.organizationId },
			select: { name: true },
		}),
		getParishFeed(prefs.organizationId),
		getMemberProfile(),
	]);

	const campaigns = (feed.data ?? []).filter(
		(item) => item.kind === "campaign",
	);
	const isMember =
		Boolean(session?.user?.parishionerId) &&
		session?.user?.organizationId === prefs.organizationId;

	return (
		<FeedShell topBar={<GiveTopBar />}>
			{profile.data && (
				<Link
					href="/me/giving"
					className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3.5"
				>
					<span>
						<span className="block text-meta text-fg-dim">
							You&rsquo;ve given this year
						</span>
						<span className="mt-0.5 block text-title font-semibold tabular-nums text-fg">
							{naira(profile.data.givenThisYear)}
						</span>
					</span>
					<ChevronRight
						className="size-4 shrink-0 text-fg-dim"
						aria-hidden
					/>
				</Link>
			)}

			<LockInProvider
				isMember={isMember}
				organizationId={prefs.organizationId}
				organizationName={organization?.name ?? ""}
			>
				{campaigns.length > 0 ?
					campaigns.map((item) => <FeedCard key={item.id} item={item} />)
				:	<p className="px-6 py-16 text-center text-body text-fg-muted">
						{organization?.name ?? "This parish"} has no open campaigns
						right now.
					</p>
				}
			</LockInProvider>
		</FeedShell>
	);
}

function GiveTopBar() {
	return (
		<div className="sticky top-0 z-30 border-b border-hairline bg-surface-1/95 px-4 py-3 backdrop-blur pt-[calc(12px+env(safe-area-inset-top))]">
			<h1 className="text-title font-semibold text-fg">Give</h1>
		</div>
	);
}
