/**
 * The feed's item model.
 *
 * A discriminated union rather than a bag of optional fields, so a card
 * component can only be handed data it actually knows how to render, and
 * adding a ninth card type is a compile error everywhere it must be handled.
 */

/** Provenance. Every card carries it — this is a multi-tenant timeline. */
export type FeedSource = {
	organizationId: string;
	organizationName: string;
	/** Two-letter crest, derived from the parish name. */
	initials: string;
	/** Present when a society, not the parish office, is speaking. */
	society: { id: string; name: string } | null;
	/** Short context after the name: "Campaign", "Mass times", "Event". */
	context: string | null;
};

type FeedItemBase = {
	id: string;
	source: FeedSource;
	/** Sort key and the timestamp shown on the card. */
	at: Date;
};

export type LiveItem = FeedItemBase & {
	kind: "live";
	title: string;
	celebrant: string | null;
	streamUrl: string;
	startedAt: Date | null;
	scheduledFor: Date | null;
	isLive: boolean;
};

export type MassEntry = {
	id: string;
	time: string;
	celebrant: string | null;
	location: string | null;
	language: string | null;
};

export type MassTimesItem = FeedItemBase & {
	kind: "massTimes";
	todayLabel: string;
	today: MassEntry[];
	sundayLabel: string;
	sunday: MassEntry[];
};

export type AnnouncementItem = FeedItemBase & {
	kind: "announcement" | "societyPost";
	title: string;
	content: string;
	imageUrl: string | null;
};

export type CampaignItem = FeedItemBase & {
	kind: "campaign";
	name: string;
	targetAmount: number;
	raisedAmount: number;
	/** Whole percent, capped at 100. */
	progress: number;
	/** Distinct givers. Null when the count could not be derived. */
	supporters: number | null;
	endDate: Date | null;
};

export type EventItem = FeedItemBase & {
	kind: "event";
	title: string;
	startTime: Date;
	endTime: Date;
	location: string | null;
	/** Attendance rows already recorded. */
	going: number;
	/** Whether the signed-in member is among them. */
	isGoing: boolean;
};

export type IntentionEntry = {
	id: string;
	intention: string;
	requestedBy: string;
	massLabel: string;
};

export type IntentionsItem = FeedItemBase & {
	kind: "intentions";
	entries: IntentionEntry[];
};

export type MomentPerson = {
	id: string;
	/** First name plus last initial. Never a full surname. */
	displayName: string;
	initials: string;
};

export type MomentsItem = FeedItemBase & {
	kind: "moments";
	title: string;
	people: MomentPerson[];
};

export type FeedItem =
	| LiveItem
	| MassTimesItem
	| AnnouncementItem
	| CampaignItem
	| EventItem
	| IntentionsItem
	| MomentsItem;

export type FeedKind = FeedItem["kind"];

/** Crest initials: "St. Michael's, Nsukka" → "SM". */
export function crestInitials(name: string): string {
	const words = name
		.replace(/[^A-Za-z ]/g, " ")
		.split(" ")
		.filter(Boolean);
	if (words.length === 0) return "??";
	return words
		.slice(0, 2)
		.map((word) => word[0].toUpperCase())
		.join("");
}

/** "Adaobi Okonkwo" → "Adaobi O." */
export function shortName(firstName: string, lastName: string): string {
	const initial = lastName.trim().charAt(0).toUpperCase();
	return initial ? `${firstName} ${initial}.` : firstName;
}

/**
 * Ranking.
 *
 * A live Mass outranks everything — it is happening now and will not be
 * happening in an hour. Today's Mass times sit next because that is the single
 * most-asked question a parish gets. Everything else is reverse-chronological,
 * which is what a timeline is.
 */
const KIND_PRIORITY: Record<FeedKind, number> = {
	live: 0,
	massTimes: 1,
	announcement: 2,
	campaign: 2,
	event: 2,
	societyPost: 2,
	intentions: 2,
	moments: 2,
};

export function rankFeed(items: FeedItem[]): FeedItem[] {
	return [...items].sort((a, b) => {
		const priority = KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind];
		if (priority !== 0) return priority;
		return b.at.getTime() - a.at.getTime();
	});
}
