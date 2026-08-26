"use client";

import { setTheme } from "@/app/actions/theme.actions";
import { THEME_COOKIE, type ThemeChoice } from "@/lib/theme";
import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

const OPTIONS: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
	{ value: "light", label: "Light", Icon: Sun },
	{ value: "dark", label: "Dark", Icon: Moon },
	{ value: "system", label: "System", Icon: Monitor },
];

function readTheme(): ThemeChoice {
	if (typeof document === "undefined") return "system";
	const match = document.cookie.match(
		new RegExp(`(?:^|;\\s*)${THEME_COOKIE}=([^;]*)`),
	);
	const value = match ? decodeURIComponent(match[1]) : null;
	return value === "dark" || value === "light" ? value : "system";
}

/**
 * Global theme store subscription.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
	listeners.add(onChange);
	return () => listeners.delete(onChange);
}

function notify() {
	for (const listener of listeners) listener();
}

export function useThemeStore() {
	const choice = useSyncExternalStore(
		subscribe,
		readTheme,
		() => "system" as ThemeChoice,
	);

	const apply = useCallback((next: ThemeChoice) => {
		if (next === "system") {
			document.documentElement.removeAttribute("data-theme");
		} else {
			document.documentElement.setAttribute("data-theme", next);
		}
		document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
		notify();
		void setTheme(next);
	}, []);

	return { choice, apply };
}

/**
 * Global icon button for navbars (PublicNavbar, ProtectedNavbar, etc.)
 */
export function ThemeIconToggle({ className }: { className?: string }) {
	const { choice, apply } = useThemeStore();

	const toggle = () => {
		if (choice === "dark") {
			apply("light");
		} else if (choice === "light") {
			apply("dark");
		} else {
			const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			apply(isDark ? "light" : "dark");
		}
	};

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={`Switch theme (current: ${choice})`}
			title={`Current theme: ${choice}. Click to toggle.`}
			className={
				className ??
				"flex size-10 items-center justify-center rounded-[10px] text-secondary-foreground hover:bg-accent transition-colors"
			}
		>
			{choice === "dark" ?
				<Moon className="size-5" aria-hidden />
			: choice === "light" ?
				<Sun className="size-5" aria-hidden />
			:	<Monitor className="size-5" aria-hidden />}
		</button>
	);
}

/**
 * Global pill radiogroup for feed sidebars / settings
 */
export function ThemeToggle() {
	const { choice, apply } = useThemeStore();

	return (
		<div
			role="radiogroup"
			aria-label="Colour theme"
			className="inline-flex items-center gap-1 rounded-[10px] bg-surface-2 p-1"
		>
			{OPTIONS.map(({ value, label, Icon }) => {
				const selected = choice === value;
				return (
					<button
						key={value}
						type="button"
						role="radio"
						aria-checked={selected}
						onClick={() => apply(value)}
						className={`flex h-9 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-meta transition-colors ${
							selected ?
								"bg-surface-0 text-fg"
							:	"text-fg-dim hover:text-fg-body"
						}`}
					>
						<Icon className="size-4" aria-hidden />
						<span className="sr-only sm:not-sr-only">{label}</span>
					</button>
				);
			})}
		</div>
	);
}
