/**
 * Device-local personalization.
 *
 * Choosing a parish and a set of interests requires no account and creates no
 * record — it is a cookie, read on the server so the first paint is already
 * personalised with no flash and no localStorage round-trip.
 */

export const PREFS_COOKIE = "ecclesia-prefs";
export const PREFS_MAX_AGE = 365 * 24 * 60 * 60;

export const INTERESTS = [
	{ id: "masses", label: "Mass times" },
	{ id: "live", label: "Livestreams" },
	{ id: "announcements", label: "Announcements" },
	{ id: "societies", label: "Societies & groups" },
	{ id: "giving", label: "Giving & campaigns" },
	{ id: "events", label: "Events" },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];

export type NotifyLevel = "all" | "important" | "none";

export type FeedPreferences = {
	organizationId: string | null;
	interests: InterestId[];
	notify: NotifyLevel;
};

export const DEFAULT_PREFERENCES: FeedPreferences = {
	organizationId: null,
	interests: [],
	notify: "important",
};

const VALID_INTERESTS = new Set<string>(INTERESTS.map((i) => i.id));

/**
 * Parse the cookie defensively. It is user-editable in the sense that anyone
 * can hand-write it, so nothing here trusts its shape — a malformed value
 * falls back to defaults rather than throwing on a page render.
 */
export function parsePreferences(raw: string | undefined): FeedPreferences {
	if (!raw) return DEFAULT_PREFERENCES;

	try {
		const parsed = JSON.parse(raw) as Partial<FeedPreferences>;

		const interests = Array.isArray(parsed.interests) ?
			parsed.interests.filter((i): i is InterestId =>
				VALID_INTERESTS.has(i as string),
			)
		:	[];

		const notify =
			parsed.notify === "all" ||
			parsed.notify === "important" ||
			parsed.notify === "none"
				? parsed.notify
				: DEFAULT_PREFERENCES.notify;

		return {
			organizationId:
				typeof parsed.organizationId === "string" && parsed.organizationId ?
					parsed.organizationId
				:	null,
			interests,
			notify,
		};
	} catch {
		return DEFAULT_PREFERENCES;
	}
}

export function serialisePreferences(prefs: FeedPreferences): string {
	return JSON.stringify(prefs);
}
