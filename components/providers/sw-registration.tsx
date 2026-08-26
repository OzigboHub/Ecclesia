"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "ecclesia-notification-banner-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function ServiceWorkerRegistration() {
	const [showBanner, setShowBanner] = useState(false);

	useEffect(() => {
		if (!("serviceWorker" in navigator)) return;

		// Disable service worker in development to prevent caching issues with Fast Refresh / HMR
		if (process.env.NODE_ENV !== "production") {
			navigator.serviceWorker.getRegistrations().then((registrations) => {
				for (const registration of registrations) {
					registration.unregister();
				}
			});
			if ("caches" in window) {
				caches.keys().then((keys) => {
					keys.forEach((key) => caches.delete(key));
				});
			}
			return;
		}

		navigator.serviceWorker.register("/sw.js").catch((err) => {
			console.error("Service worker registration failed:", err);
		});

		const canPromptPermission =
			"Notification" in window && "PushManager" in window;
		const dismissedAtRaw = localStorage.getItem(DISMISS_KEY);
		const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : NaN;
		const isDismissedWithinCooldown =
			Number.isFinite(dismissedAt) &&
			Date.now() - dismissedAt < DISMISS_DURATION_MS;

		if (
			canPromptPermission &&
			Notification.permission === "default" &&
			!isDismissedWithinCooldown
		) {
			setShowBanner(true);
		}
	}, []);

	const requestPermission = async () => {
		try {
			const permission = await Notification.requestPermission();
			if (permission === "granted") {
				localStorage.removeItem(DISMISS_KEY);
				setShowBanner(false);
				return;
			}
			if (permission === "denied") {
				localStorage.setItem(DISMISS_KEY, String(Date.now()));
				setShowBanner(false);
			}
		} catch (err) {
			console.warn("Notification permission request failed:", err);
		}
	};

	const dismissBanner = () => {
		localStorage.setItem(DISMISS_KEY, String(Date.now()));
		setShowBanner(false);
	};

	if (!showBanner) return null;

	return (
		<div className="fixed bottom-4 left-4 right-4 z-[1700] sm:left-auto sm:max-w-sm">
			<div className="rounded-lg border border-border bg-background p-3 shadow-lg">
				<p className="text-sm font-medium text-foreground">
					Enable notifications
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Stay updated with important parish activity and updates.
				</p>
				<div className="mt-3 flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={dismissBanner}
						className="text-xs text-muted-foreground hover:text-foreground"
					>
						Not now
					</button>
					<button
						type="button"
						onClick={requestPermission}
						className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
					>
						Enable
					</button>
				</div>
			</div>
		</div>
	);
}
