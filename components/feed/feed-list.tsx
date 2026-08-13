"use client";

import { FeedCard } from "@/components/feed/cards";
import type { FeedItem } from "@/lib/feed/types";

/**
 * Renders a ranked feed.
 *
 * A client component only because the cards inside it are — the fetching and
 * the ranking both happen on the server, and the whole list arrives as data.
 */
export function FeedList({ items }: { items: FeedItem[] }) {
	return (
		<div className="lg:pt-2">
			{items.map((item) => (
				<FeedCard key={item.id} item={item} />
			))}
		</div>
	);
}
