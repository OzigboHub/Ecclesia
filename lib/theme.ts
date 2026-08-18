export const THEME_COOKIE = "ecclesia-theme";

export type ThemeChoice = "dark" | "light" | "system";

export function isThemeChoice(value: unknown): value is ThemeChoice {
	return value === "dark" || value === "light" || value === "system";
}

/**
 * Resolve a cookie value to the attribute that goes on <html>.
 *
 * "system" stamps nothing, which lets the prefers-color-scheme block in
 * globals.css decide. An explicit choice stamps the attribute so it wins over
 * the media query in both directions.
 */
export function themeAttribute(value: unknown): "dark" | "light" | undefined {
	if (value === "dark") return "dark";
	if (value === "light") return "light";
	return undefined;
}
