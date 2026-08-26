import { getHighlightsFeed, getParishFeed } from "@/app/actions/feed.actions";
import { getGateStatus } from "@/app/actions/parish-gate.actions";
import { getPreferences } from "@/app/actions/preferences.actions";
import { auth } from "@/auth";
import { ParishTopBar } from "@/components/feed/chrome/parish-top-bar";
import { FeedList } from "@/components/feed/feed-list";
import { FeedShell, RailSection } from "@/components/feed/feed-shell";
import { FeedEmpty } from "@/components/feed/feed-states";
import { LockInProvider } from "@/components/feed/lock-in/lock-in-provider";
import { naira } from "@/components/feed/feed-card-shell";
import db from "@/lib/db";
import type { FeedItem } from "@/lib/feed/types";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Feed",
	description: "What's happening in your parish.",
};

export default async function FeedPage() {
	const [prefs, session] = await Promise.all([getPreferences(), auth()]);

	// No parish chosen: the cold open. Highlights from everywhere, with a
	// standing invitation to pick one — a card in the feed, not a modal wall.
	if (!prefs.organizationId) {
		const highlights = await getHighlightsFeed();
		return (
			<FeedShell topBar={<HighlightsTopBar />}>
				<PickParishInvitation />
				<LockInProvider
					isMember={false}
					organizationId={null}
					organizationName=""
				>
					{highlights.data && highlights.data.length > 0 ?
						<FeedList items={highlights.data} />
					:	<FeedEmpty
							parishName="Public Feed"
							description="No parish has posted anything public yet. Find your parish to see what's happening there."
						/>
					}
				</LockInProvider>
			</FeedShell>
		);
	}

	const gate = await getGateStatus(prefs.organizationId);

	if (!gate.success || !gate.data) {
		// The stored parish no longer exists or is hidden. Send them back to
		// choose rather than showing a broken feed.
		redirect("/start");
	}

	if (gate.data.required && !gate.data.unlocked) {
		redirect(`/gate/${prefs.organizationId}`);
	}

	const [feed, rail] = await Promise.all([
		getParishFeed(prefs.organizationId),
		getRailContext(prefs.organizationId),
	]);

	const items: FeedItem[] = feed.data ?? [];
	const isMember =
		Boolean(session?.user?.parishionerId) &&
		session?.user?.organizationId === prefs.organizationId;

	return (
		<FeedShell
			topBar={
				<ParishTopBar
					parishName={gate.data.organizationName}
					parishId={gate.data.organizationId}
				/>
			}
			aside={<ContextRail {...rail} />}
		>
			<LockInProvider
				isMember={isMember}
				organizationId={prefs.organizationId}
				organizationName={gate.data.organizationName}
			>
				{items.length > 0 ?
					<FeedList items={items} />
				:	<FeedEmpty parishName={gate.data.organizationName} />}
			</LockInProvider>
		</FeedShell>
	);
}

function HighlightsTopBar() {
	return (
		<div className="sticky top-16 z-30 border-b border-hairline bg-surface-1/95 px-4 py-3 backdrop-blur pt-[calc(12px+env(safe-area-inset-top))]">
			<div className="flex items-center gap-2">
				<span aria-hidden className="size-[7px] rounded-full bg-gold" />
				<span className="text-title-sm font-semibold tracking-[0.01em] text-fg">
					Highlights
				</span>
			</div>
		</div>
	);
}

function PickParishInvitation() {
	return (
		<div className="border-b border-hairline bg-surface-1 px-4 py-3.5">
			<h2 className="text-title-sm font-semibold text-fg">
				See your own parish here
			</h2>
			<p className="mt-1.5 text-body-sm text-fg-muted">
				Mass times, announcements and giving from the parish you attend.
			</p>
			<div className="mt-2.5 flex items-center gap-2.5">
				<Link
					href="/start"
					className="flex h-11 items-center rounded-[10px] bg-gold px-4.5 text-body font-semibold text-on-gold"
				>
					Find my parish
				</Link>
				<Link
					href="/explore"
					className="flex h-11 items-center px-3 text-body-sm text-fg-muted"
				>
					Not now
				</Link>
			</div>
		</div>
	);
}

type RailContext = {
	name: string;
	address: string | null;
	contactPhone: string | null;
	campaigns: { id: string; name: string; progress: number; raised: number }[];
	societies: { id: string; name: string }[];
};

async function getRailContext(organizationId: string): Promise<RailContext> {
	const [organization, campaigns, societies] = await Promise.all([
		db.organization.findUnique({
			where: { id: organizationId },
			select: { name: true, address: true, contactPhone: true },
		}),
		db.donationCampaign.findMany({
			where: { organizationId, isActive: true },
			select: { id: true, name: true, targetAmount: true },
			take: 3,
			orderBy: { createdAt: "desc" },
		}),
		db.society.findMany({
			where: { organizationId },
			select: { id: true, name: true },
			take: 5,
			orderBy: { name: "asc" },
		}),
	]);

	const raised = await Promise.all(
		campaigns.map((campaign) =>
			db.payment.aggregate({
				where: {
					donationCampaignId: campaign.id,
					paymentStatus: "COMPLETED",
				},
				_sum: { amount: true },
			}),
		),
	);

	return {
		name: organization?.name ?? "",
		address: organization?.address ?? null,
		contactPhone: organization?.contactPhone ?? null,
		societies,
		campaigns: campaigns.map((campaign, index) => {
			const total = raised[index]._sum.amount ?? 0;
			return {
				id: campaign.id,
				name: campaign.name,
				raised: total,
				progress:
					campaign.targetAmount > 0 ?
						Math.min(
							100,
							Math.round((total / campaign.targetAmount) * 100),
						)
					:	0,
			};
		}),
	};
}

function ContextRail({
	name,
	address,
	contactPhone,
	campaigns,
	societies,
}: RailContext) {
	return (
		<>
			<RailSection title="Parish office">
				<p className="text-body-sm font-semibold text-fg">{name}</p>
				{address && (
					<p className="mt-1 text-meta leading-[18px] text-fg-muted">
						{address}
					</p>
				)}
				{contactPhone && (
					<a
						href={`tel:${contactPhone}`}
						className="mt-2 flex min-h-11 items-center text-body-sm font-semibold text-gold"
					>
						{contactPhone}
					</a>
				)}
			</RailSection>

			<RailSection
				title="Campaigns"
				action={
					campaigns.length > 0 ?
						<span className="text-caption text-fg-dim">
							{campaigns.length} open
						</span>
					:	undefined
				}
			>
				{campaigns.length > 0 ?
					<ul className="flex flex-col gap-3">
						{campaigns.map((campaign) => (
							<li key={campaign.id}>
								<p className="text-body-sm text-fg">{campaign.name}</p>
								<div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
									<div
										className="h-full rounded-full bg-gold"
										style={{ width: `${campaign.progress}%` }}
									/>
								</div>
								<p className="mt-1 text-caption tabular-nums text-fg-dim">
									{naira(campaign.raised)} · {campaign.progress}%
								</p>
							</li>
						))}
					</ul>
				:	<p className="text-body-sm text-fg-muted">No active campaigns right now.</p>}
			</RailSection>

			<RailSection title="Societies">
				{societies.length > 0 ?
					<ul className="flex flex-col gap-1">
						{societies.map((society) => (
							<li key={society.id}>
								<Link
									href={`/societies/${society.id}`}
									className="flex min-h-9 items-center text-body-sm text-fg-body hover:text-fg"
								>
									{society.name}
								</Link>
							</li>
						))}
					</ul>
				:	<p className="text-body-sm text-fg-muted">No societies registered yet.</p>}
			</RailSection>
		</>
	);
}
