"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import {
	crestInitials,
	rankFeed,
	shortName,
	type AnnouncementItem,
	type CampaignItem,
	type EventItem,
	type FeedItem,
	type FeedSource,
	type IntentionsItem,
	type LiveItem,
	type MassTimesItem,
	type MomentsItem,
} from "@/lib/feed/types";
import { HIDDEN_ORGANIZATION_NAMES } from "@/lib/organization-visibility";
import type { ActionResponse } from "@/types";

/**
 * The parish feed.
 *
 * Everything here is derived from data the parish already keeps. Where the
 * schema cannot answer a question — how many people are watching a livestream
 * right now — the card simply omits that detail rather than inventing it.
 */

const dayFormatter = new Intl.DateTimeFormat("en-NG", { weekday: "long" });

function startOfDay(date: Date): Date {
	const copy = new Date(date);
	copy.setHours(0, 0, 0, 0);
	return copy;
}

function endOfDay(date: Date): Date {
	const copy = new Date(date);
	copy.setHours(23, 59, 59, 999);
	return copy;
}

/** The next Sunday strictly after today. If today is Sunday, next week's. */
function nextSunday(from: Date): Date {
	const copy = startOfDay(from);
	const daysAhead = (7 - copy.getDay()) % 7 || 7;
	copy.setDate(copy.getDate() + daysAhead);
	return copy;
}

function makeSource(
	organizationId: string,
	organizationName: string,
	options: {
		context?: string | null;
		society?: { id: string; name: string } | null;
	} = {},
): FeedSource {
	return {
		organizationId,
		organizationName,
		initials: crestInitials(options.society?.name ?? organizationName),
		society: options.society ?? null,
		context: options.context ?? null,
	};
}

/** Parish names keyed by id, with hidden organizations filtered out. */
async function resolveOrganizationNames(
	ids: string[],
): Promise<Map<string, string>> {
	if (ids.length === 0) return new Map();
	const organizations = await db.organization.findMany({
		where: {
			id: { in: [...new Set(ids)] },
			name: { notIn: HIDDEN_ORGANIZATION_NAMES },
		},
		select: { id: true, name: true },
	});
	return new Map(organizations.map((o) => [o.id, o.name]));
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

async function liveItems(
	organizationId: string | undefined,
	names: Map<string, string>,
	limit: number,
): Promise<LiveItem[]> {
	const streams = await db.liveStream.findMany({
		where: {
			...(organizationId ? { organizationId } : {}),
			OR: [
				{ isLive: true },
				{
					scheduledFor: {
						gte: new Date(),
						lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					},
				},
			],
		},
		select: {
			id: true,
			title: true,
			streamUrl: true,
			isLive: true,
			startedAt: true,
			scheduledFor: true,
			createdAt: true,
			organizationId: true,
			mass: { select: { celebrant: true } },
		},
		orderBy: [{ isLive: "desc" }, { scheduledFor: "asc" }],
		take: limit,
	});

	return streams
		.filter((s) => names.has(s.organizationId))
		.map((s) => ({
			kind: "live" as const,
			id: `live:${s.id}`,
			source: makeSource(s.organizationId, names.get(s.organizationId)!, {
				context: s.isLive ? null : "Upcoming stream",
			}),
			at: s.startedAt ?? s.scheduledFor ?? s.createdAt,
			title: s.title,
			celebrant: s.mass?.celebrant ?? null,
			streamUrl: s.streamUrl,
			startedAt: s.startedAt,
			scheduledFor: s.scheduledFor,
			isLive: s.isLive,
		}));
}

/**
 * One digest card: today's Masses and this Sunday's. Only emitted when there is
 * something to show — an empty Mass card is worse than no Mass card.
 */
async function massTimesItem(
	organizationId: string,
	organizationName: string,
): Promise<MassTimesItem | null> {
	const now = new Date();
	const sunday = nextSunday(now);

	const [today, thisSunday] = await Promise.all([
		db.mass.findMany({
			where: {
				organizationId,
				status: "SCHEDULED",
				date: { gte: startOfDay(now), lte: endOfDay(now) },
			},
			select: {
				id: true,
				time: true,
				celebrant: true,
				location: true,
				language: true,
			},
			orderBy: { time: "asc" },
		}),
		db.mass.findMany({
			where: {
				organizationId,
				status: "SCHEDULED",
				date: { gte: startOfDay(sunday), lte: endOfDay(sunday) },
			},
			select: {
				id: true,
				time: true,
				celebrant: true,
				location: true,
				language: true,
			},
			orderBy: { time: "asc" },
		}),
	]);

	if (today.length === 0 && thisSunday.length === 0) return null;

	return {
		kind: "massTimes",
		id: `massTimes:${organizationId}:${startOfDay(now).toISOString()}`,
		source: makeSource(organizationId, organizationName, {
			context: "Mass times",
		}),
		at: now,
		todayLabel: `Today · ${dayFormatter.format(now)}`,
		today,
		sundayLabel:
			now.getDay() === 0 ? "Next Sunday" : "This Sunday",
		sunday: thisSunday,
	};
}

async function announcementItems(
	organizationId: string | undefined,
	names: Map<string, string>,
	limit: number,
): Promise<AnnouncementItem[]> {
	const now = new Date();
	const announcements = await db.announcement.findMany({
		where: {
			...(organizationId ? { organizationId } : {}),
			isPublished: true,
			approvalStatus: "APPROVED",
			AND: [
				{ OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
				{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
			],
		},
		select: {
			id: true,
			title: true,
			content: true,
			imageUrl: true,
			organizationId: true,
			publishedAt: true,
			createdAt: true,
			society: { select: { id: true, name: true } },
		},
		orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
		take: limit,
	});

	return announcements
		.filter((a) => names.has(a.organizationId))
		.map((a) => ({
			// A society's post is the same record with a society attached, but
			// it is a different card — different crest, different badge.
			kind: a.society ? ("societyPost" as const) : ("announcement" as const),
			id: `announcement:${a.id}`,
			source: makeSource(a.organizationId, names.get(a.organizationId)!, {
				society: a.society,
				context: a.society ? null : "Parish office",
			}),
			at: a.publishedAt ?? a.createdAt,
			title: a.title,
			content: a.content,
			imageUrl: a.imageUrl,
		}));
}

async function campaignItems(
	organizationId: string | undefined,
	names: Map<string, string>,
	limit: number,
): Promise<CampaignItem[]> {
	const campaigns = await db.donationCampaign.findMany({
		where: {
			...(organizationId ? { organizationId } : {}),
			isActive: true,
			startDate: { lte: new Date() },
			OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
		},
		select: {
			id: true,
			name: true,
			targetAmount: true,
			endDate: true,
			createdAt: true,
			organizationId: true,
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	if (campaigns.length === 0) return [];

	const ids = campaigns.map((c) => c.id);

	const [totals, donors] = await Promise.all([
		db.payment.groupBy({
			by: ["donationCampaignId"],
			where: {
				donationCampaignId: { in: ids },
				paymentStatus: "COMPLETED",
			},
			_sum: { amount: true },
		}),
		// Distinct givers per campaign. Anonymous gifts have no parishionerId,
		// so they are genuinely uncountable as people and are left out of the
		// supporter number rather than each counted as one.
		db.payment.groupBy({
			by: ["donationCampaignId", "parishionerId"],
			where: {
				donationCampaignId: { in: ids },
				paymentStatus: "COMPLETED",
				parishionerId: { not: null },
			},
		}),
	]);

	const raisedBy = new Map(
		totals.map((t) => [t.donationCampaignId, t._sum.amount ?? 0]),
	);
	const supporterCount = new Map<string, number>();
	for (const row of donors) {
		if (!row.donationCampaignId) continue;
		supporterCount.set(
			row.donationCampaignId,
			(supporterCount.get(row.donationCampaignId) ?? 0) + 1,
		);
	}

	return campaigns
		.filter((c) => names.has(c.organizationId))
		.map((c) => {
			const raisedAmount = raisedBy.get(c.id) ?? 0;
			return {
				kind: "campaign" as const,
				id: `campaign:${c.id}`,
				source: makeSource(c.organizationId, names.get(c.organizationId)!, {
					context: "Campaign",
				}),
				at: c.createdAt,
				name: c.name,
				targetAmount: c.targetAmount,
				raisedAmount,
				progress:
					c.targetAmount > 0 ?
						Math.min(100, Math.round((raisedAmount / c.targetAmount) * 100))
					:	0,
				supporters: supporterCount.get(c.id) ?? 0,
				endDate: c.endDate,
			};
		});
}

async function eventItems(
	organizationId: string | undefined,
	names: Map<string, string>,
	limit: number,
	viewerParishionerId: string | null,
): Promise<EventItem[]> {
	const events = await db.event.findMany({
		where: {
			...(organizationId ? { organizationId } : {}),
			status: "SCHEDULED",
			startTime: { gte: new Date() },
		},
		select: {
			id: true,
			title: true,
			startTime: true,
			endTime: true,
			location: true,
			createdAt: true,
			organizationId: true,
			society: { select: { id: true, name: true } },
			_count: { select: { attendance: true } },
			attendance:
				viewerParishionerId ?
					{
						where: { parishionerId: viewerParishionerId },
						select: { id: true },
						take: 1,
					}
				:	false,
		},
		orderBy: { startTime: "asc" },
		take: limit,
	});

	return events
		.filter((e) => names.has(e.organizationId))
		.map((e) => ({
			kind: "event" as const,
			id: `event:${e.id}`,
			source: makeSource(e.organizationId, names.get(e.organizationId)!, {
				society: e.society,
				context: "Event",
			}),
			at: e.createdAt,
			title: e.title,
			startTime: e.startTime,
			endTime: e.endTime,
			location: e.location,
			going: e._count.attendance,
			isGoing: Array.isArray(e.attendance) && e.attendance.length > 0,
		}));
}

async function intentionsItem(
	organizationId: string,
	organizationName: string,
	limit: number,
): Promise<IntentionsItem | null> {
	const intentions = await db.massIntention.findMany({
		where: {
			organizationId,
			status: "APPROVED",
			mass: { date: { gte: startOfDay(new Date()) } },
		},
		select: {
			id: true,
			intention: true,
			requestedBy: true,
			approvedAt: true,
			createdAt: true,
			mass: { select: { date: true, time: true } },
		},
		orderBy: { mass: { date: "asc" } },
		take: limit,
	});

	if (intentions.length === 0) return null;

	return {
		kind: "intentions",
		id: `intentions:${organizationId}`,
		source: makeSource(organizationId, organizationName, {
			context: "Mass intentions · approved by the parish office",
		}),
		at: intentions[0].approvedAt ?? intentions[0].createdAt,
		entries: intentions.map((i) => ({
			id: i.id,
			intention: i.intention,
			requestedBy: i.requestedBy,
			massLabel: `${i.mass.time} Mass, ${dayFormatter.format(i.mass.date)}`,
		})),
	};
}

/**
 * Baptisms and confirmations from the last fortnight, and only for people who
 * opted in. `shareMoments` defaults to false, so this card is empty until a
 * parish deliberately turns it on person by person — which is the correct
 * default for publishing somebody's sacrament to a public timeline.
 */
async function momentsItem(
	organizationId: string,
	organizationName: string,
): Promise<MomentsItem | null> {
	const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

	const baptisms = await db.baptism.findMany({
		where: {
			organizationId,
			date: { gte: since, lte: new Date() },
			parishioner: { shareMoments: true, deletedAt: null },
		},
		select: {
			id: true,
			date: true,
			parishioner: {
				select: { id: true, firstName: true, lastName: true },
			},
		},
		orderBy: { date: "desc" },
		take: 8,
	});

	if (baptisms.length === 0) return null;

	return {
		kind: "moments",
		id: `moments:${organizationId}`,
		source: makeSource(organizationId, organizationName, {
			context: "Parish moments · this fortnight",
		}),
		at: baptisms[0].date,
		title: "Baptised recently",
		people: baptisms.map((b) => ({
			id: b.parishioner.id,
			displayName: shortName(
				b.parishioner.firstName,
				b.parishioner.lastName,
			),
			initials: crestInitials(
				`${b.parishioner.firstName} ${b.parishioner.lastName}`,
			),
		})),
	};
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

/**
 * One parish's timeline. Every card type, ranked.
 *
 * Callers must have already checked the gate — see getGateStatus. This does not
 * enforce it, because the parish page needs to render the gate screen against
 * the same organization record.
 */
export async function getParishFeed(
	organizationId: string,
): Promise<ActionResponse<FeedItem[]>> {
	try {
		const organization = await db.organization.findFirst({
			where: {
				id: organizationId,
				name: { notIn: HIDDEN_ORGANIZATION_NAMES },
			},
			select: { id: true, name: true },
		});

		if (!organization) {
			return { success: false, message: "Parish not found", data: [] };
		}

		const names = new Map([[organization.id, organization.name]]);

		const session = await auth();
		const viewerParishionerId =
			session?.user?.organizationId === organizationId ?
				(session.user.parishionerId ?? null)
			:	null;

		const [live, masses, announcements, campaigns, events, intentions, moments] =
			await Promise.all([
				liveItems(organizationId, names, 3),
				massTimesItem(organization.id, organization.name),
				announcementItems(organizationId, names, 15),
				campaignItems(organizationId, names, 5),
				eventItems(organizationId, names, 8, viewerParishionerId),
				intentionsItem(organization.id, organization.name, 4),
				momentsItem(organization.id, organization.name),
			]);

		const items: FeedItem[] = [
			...live,
			...announcements,
			...campaigns,
			...events,
		];
		if (masses) items.push(masses);
		if (intentions) items.push(intentions);
		if (moments) items.push(moments);

		return {
			success: true,
			message: "Feed retrieved",
			data: rankFeed(items),
		};
	} catch (error) {
		console.error("Failed to build parish feed:", error);
		return { success: false, message: "Failed to load the feed", data: [] };
	}
}

/**
 * The cold open: public moments from parishes across the platform, for someone
 * who has not chosen a parish yet.
 *
 * Deliberately excludes Mass times, intentions and parish moments — those are
 * meaningful to a congregation and noise to a stranger.
 */
export async function getHighlightsFeed(): Promise<ActionResponse<FeedItem[]>> {
	try {
		const [liveIds, announcementOrgs, campaignOrgs, eventOrgs] =
			await Promise.all([
				db.liveStream.findMany({
					where: { isLive: true },
					select: { organizationId: true },
					take: 20,
				}),
				db.announcement.findMany({
					where: { isPublished: true, approvalStatus: "APPROVED" },
					select: { organizationId: true },
					take: 40,
				}),
				db.donationCampaign.findMany({
					where: { isActive: true },
					select: { organizationId: true },
					take: 20,
				}),
				db.event.findMany({
					where: { status: "SCHEDULED", startTime: { gte: new Date() } },
					select: { organizationId: true },
					take: 20,
				}),
			]);

		const names = await resolveOrganizationNames([
			...liveIds.map((r) => r.organizationId),
			...announcementOrgs.map((r) => r.organizationId),
			...campaignOrgs.map((r) => r.organizationId),
			...eventOrgs.map((r) => r.organizationId),
		]);

		const [live, announcements, campaigns, events] = await Promise.all([
			liveItems(undefined, names, 3),
			announcementItems(undefined, names, 12),
			campaignItems(undefined, names, 4),
			eventItems(undefined, names, 6, null),
		]);

		return {
			success: true,
			message: "Highlights retrieved",
			data: rankFeed([...live, ...announcements, ...campaigns, ...events]),
		};
	} catch (error) {
		console.error("Failed to build highlights feed:", error);
		return {
			success: false,
			message: "Failed to load highlights",
			data: [],
		};
	}
}
