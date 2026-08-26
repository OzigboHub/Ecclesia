import { NavRail } from "@/components/feed/chrome/tab-bar";

/**
 * Page frame for every feed screen.
 *
 * Mobile is one column, full-bleed, with room at the bottom for the tab bar.
 * From 1024px a nav rail appears; from 1280px a context rail joins it and the
 * centre column caps at 640px. The right rail is where desktop earns its keep,
 * so it carries standing parish context rather than filler.
 */
export function FeedShell({
	children,
	aside,
	topBar,
}: {
	children: React.ReactNode;
	aside?: React.ReactNode;
	topBar?: React.ReactNode;
}) {
	return (
		<div className="min-h-[100dvh] bg-surface-0 pt-16">
			<div className="mx-auto flex w-full max-w-[1400px] gap-8 px-0 lg:px-6">
				<aside className="hidden shrink-0 lg:block lg:w-[216px]">
					<div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col py-4">
						<NavRail />
					</div>
				</aside>

				<main className="min-w-0 flex-1 pb-[calc(84px+env(safe-area-inset-bottom))] lg:max-w-[640px] lg:pb-10">
					{topBar}
					{children}
				</main>

				{aside && (
					<aside className="hidden shrink-0 xl:block xl:w-[300px]">
						<div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto py-4">
							{aside}
						</div>
					</aside>
				)}
			</div>
		</div>
	);
}

/** A titled block in the desktop context rail. */
export function RailSection({
	title,
	action,
	children,
}: {
	title: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section className="mb-3 rounded-card border border-hairline bg-surface-1 p-4">
			<div className="mb-2.5 flex items-baseline justify-between gap-2">
				<h2 className="font-plex-mono text-caption uppercase tracking-[0.1em] text-fg-dim">
					{title}
				</h2>
				{action}
			</div>
			{children}
		</section>
	);
}
