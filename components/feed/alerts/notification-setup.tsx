"use client";

import { updatePreferences } from "@/app/actions/preferences.actions";
import type { NotifyLevel } from "@/lib/feed/preferences";
import { cn } from "@/lib/utils";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

/**
 * Web push opt-in.
 *
 * The browser permission prompt only fires from a real tap here — asking on
 * first paint is the fastest way to get permanently denied, and a denied
 * permission cannot be asked for again.
 */

function urlBase64ToUint8Array(base64: string): BufferSource {
	const padding = "=".repeat((4 - (base64.length % 4)) % 4);
	const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = window.atob(normalised);
	const output = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
	return output as unknown as BufferSource;
}

const LEVELS: { value: NotifyLevel; label: string }[] = [
	{ value: "all", label: "Everything" },
	{ value: "important", label: "Just important" },
	{ value: "none", label: "Nothing" },
];

export function NotificationSetup({
	initialLevel,
}: {
	initialLevel: NotifyLevel;
}) {
	const [supported, setSupported] = useState<boolean | null>(null);
	const [enabled, setEnabled] = useState(false);
	const [level, setLevel] = useState<NotifyLevel>(initialLevel);
	const [busy, setBusy] = useState(false);
	const [, startTransition] = useTransition();

	useEffect(() => {
		const ok =
			typeof window !== "undefined" &&
			"serviceWorker" in navigator &&
			"PushManager" in window &&
			"Notification" in window;

		setSupported(ok);
		if (!ok) return;

		navigator.serviceWorker.ready
			.then((registration) => registration.pushManager.getSubscription())
			.then((subscription) => setEnabled(Boolean(subscription)))
			.catch(() => setEnabled(false));
	}, []);

	async function enable() {
		const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
		if (!publicKey) {
			toast.error("Notifications aren't configured for this parish yet.");
			return;
		}

		setBusy(true);
		try {
			let permission = Notification.permission;
			if (permission === "default") {
				permission = await Notification.requestPermission();
			}
			if (permission !== "granted") {
				toast.error(
					"Your browser is blocking notifications. Turn them on in browser settings.",
				);
				return;
			}

			const registration =
				(await navigator.serviceWorker.getRegistration()) ??
				(await navigator.serviceWorker.register("/sw.js"));

			const subscription =
				(await registration.pushManager.getSubscription()) ??
				(await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(publicKey),
				}));

			const response = await fetch("/api/push-subscriptions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(subscription.toJSON()),
			});

			if (!response.ok) throw new Error("Failed to save subscription");

			setEnabled(true);
			toast.success("You'll hear from your parish.");
		} catch (error) {
			console.error(error);
			toast.error("Couldn't turn notifications on. Try again.");
		} finally {
			setBusy(false);
		}
	}

	function changeLevel(next: NotifyLevel) {
		setLevel(next);
		startTransition(async () => {
			await updatePreferences({ notify: next });
		});
	}

	if (supported === null) return null;

	if (!supported) {
		return (
			<div className="flex items-start gap-3 border-b border-hairline px-4 py-3.5">
				<BellOff className="mt-0.5 size-4 shrink-0 text-fg-dim" aria-hidden />
				<p className="text-body-sm text-fg-muted">
					This browser can&rsquo;t show notifications. Install Ecclesia to
					your home screen to get them.
				</p>
			</div>
		);
	}

	return (
		<div className="border-b border-hairline px-4 py-3.5">
			{!enabled ?
				<div className="flex items-start gap-3">
					<Bell className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
					<div className="min-w-0 flex-1">
						<p className="text-title-sm font-semibold text-fg">
							Get told when it matters
						</p>
						<p className="mt-1 text-body-sm text-fg-muted">
							Mass changes, funerals and urgent notices, straight to
							this phone.
						</p>
						<button
							type="button"
							onClick={enable}
							disabled={busy}
							className="mt-2.5 flex h-11 items-center gap-2 rounded-[10px] bg-gold px-4.5 text-body font-semibold text-on-gold disabled:opacity-70"
						>
							{busy && (
								<Loader2 className="size-4 animate-spin" aria-hidden />
							)}
							Turn on notifications
						</button>
					</div>
				</div>
			:	<div
					role="radiogroup"
					aria-label="How often to notify"
					className="flex flex-wrap items-center gap-2"
				>
					<span className="mr-1 text-body-sm text-fg-muted">Tell me</span>
					{LEVELS.map((option) => (
						<button
							key={option.value}
							type="button"
							role="radio"
							aria-checked={level === option.value}
							onClick={() => changeLevel(option.value)}
							className={cn(
								"flex min-h-9 items-center rounded-full border px-3 text-meta transition-colors",
								level === option.value ?
									"border-gold bg-gold/12 font-medium text-gold"
								:	"border-hairline text-fg-body",
							)}
						>
							{option.label}
						</button>
					))}
				</div>
			}
		</div>
	);
}
