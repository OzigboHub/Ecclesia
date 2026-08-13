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
	const match = document.cookie.match(
		new RegExp(`(?:^|;\\s*)${THEME_COOKIE}=([^;]*)`),
	);
	const value = match ? decodeURIComponent(match[1]) : null;
	return value === "dark" || value === "light" ? value : "system";
}

/**
 * The cookie is an external store, so it is read through
 * useSyncExternalStore rather than mirrored into state by an effect. The
 * subscribe callback fires on our own writes — nothing else changes this
 * cookie, and a cross-tab change would be picked up on next mount anyway.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
	listeners.add(onChange);
	return () => listeners.delete(onChange);
}

function notify() {
	for (const listener of listeners) listener();
}

export function ThemeToggle() {
	const choice = useSyncExternalStore(
		subscribe,
		readTheme,
		// On the server there is no cookie to read here — the visual theme was
		// already applied before paint by ThemeScript, so this only decides
		// which pill renders as selected on the very first frame.
		() => "system" as ThemeChoice,
	);

	const apply = useCallback((next: ThemeChoice) => {
		if (next === "system") {
			document.documentElement.removeAttribute("data-theme");
		} else {
			document.documentElement.setAttribute("data-theme", next);
		}
		// Write it locally first so the store reads the new value immediately,
		// rather than waiting on the server action round-trip.
		document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
		notify();
		void setTheme(next);
	}, []);

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
