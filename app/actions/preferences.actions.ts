"use server";

import {
	DEFAULT_PREFERENCES,
	PREFS_COOKIE,
	PREFS_MAX_AGE,
	parsePreferences,
	serialisePreferences,
	type FeedPreferences,
} from "@/lib/feed/preferences";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getPreferences(): Promise<FeedPreferences> {
	const store = await cookies();
	return parsePreferences(store.get(PREFS_COOKIE)?.value);
}

/**
 * Merge a partial update into the stored preferences.
 *
 * Not httpOnly: the tab bar and switcher read it on the client to avoid a
 * round-trip when someone changes parish. There is nothing sensitive in it —
 * a parish id and a few interest tags, all of which are public choices.
 */
export async function updatePreferences(
	patch: Partial<FeedPreferences>,
): Promise<FeedPreferences> {
	const store = await cookies();
	const current = parsePreferences(store.get(PREFS_COOKIE)?.value);
	const next: FeedPreferences = { ...current, ...patch };

	store.set(PREFS_COOKIE, serialisePreferences(next), {
		maxAge: PREFS_MAX_AGE,
		path: "/",
		sameSite: "lax",
	});

	revalidatePath("/feed");
	return next;
}

export async function clearPreferences(): Promise<FeedPreferences> {
	const store = await cookies();
	store.delete(PREFS_COOKIE);
	revalidatePath("/feed");
	return DEFAULT_PREFERENCES;
}
