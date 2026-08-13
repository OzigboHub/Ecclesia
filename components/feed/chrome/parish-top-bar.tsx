"use client";

import { crestInitials } from "@/lib/feed/types";
import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";

/**
 * The only chrome at the top of the feed.
 *
 * This runs as an installed PWA in standalone display mode, where there is no
 * browser chrome at all — so this bar carries the entire sense of "where am I",
 * and the parish name is the switcher rather than a separate control.
 */
export function ParishTopBar({
	parishName,
	parishId,
}: {
	parishName: string;
	parishId?: string | null;
}) {
	return (
		<div className="sticky top-0 z-30 border-b border-hairline bg-surface-1/95 backdrop-blur pt-[env(safe-area-inset-top)]">
			<div className="flex items-center justify-between px-2.5 py-1">
				<Link
					href="/explore"
					className="flex min-h-11 items-center gap-2.5 rounded-[10px] px-1.5 transition-colors hover:bg-surface-2"
				>
					<span className="flex size-6 items-center justify-center rounded-lg bg-surface-3 text-[10px] font-semibold text-gold">
						{crestInitials(parishName)}
					</span>
					<span className="flex items-center gap-1.5">
						<span className="text-title-sm font-semibold tracking-[-0.01em] text-fg">
							{parishName}
						</span>
						<ChevronDown
							className="size-3.5 text-fg-muted"
							aria-hidden
						/>
					</span>
					<span className="sr-only">Change parish</span>
				</Link>

				<Link
					href={parishId ? `/explore?parish=${parishId}` : "/explore"}
					className="flex size-11 items-center justify-center rounded-[10px] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
				>
					<Search className="size-[19px]" aria-hidden />
					<span className="sr-only">Search</span>
				</Link>
			</div>
		</div>
	);
}
