import { TabBar } from "@/components/feed/chrome/tab-bar";

/**
 * Every screen here depends on the preferences cookie, the gate cookie or the
 * session, so none of it can be prerendered. Saying so explicitly stops Next
 * probing these routes at build time — which it does by throwing inside the
 * data layer, where our error handling would otherwise quietly report it as a
 * failed load.
 */
export const dynamic = "force-dynamic";

/**
 * The feed's shell.
 *
 * `data-feed-root` scopes the feed surface styles and background.
 *
 * `font-plex` scopes IBM Plex to this route group; the console keeps Montserrat.
 */
export default function FeedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div
			data-feed-root
			className="font-plex text-body text-fg-body antialiased"
		>
			{children}
			<TabBar />
		</div>
	);
}
