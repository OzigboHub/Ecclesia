"use server";

import { THEME_COOKIE, isThemeChoice, type ThemeChoice } from "@/lib/theme";
import { cookies } from "next/headers";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setTheme(choice: ThemeChoice) {
	if (!isThemeChoice(choice)) return;

	const store = await cookies();
	store.set(THEME_COOKIE, choice, {
		maxAge: ONE_YEAR,
		path: "/",
		sameSite: "lax",
	});
}
