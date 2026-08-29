import { FeedShell } from "@/components/feed/feed-shell";
import { DailyReadingsView } from "@/components/liturgy/daily-readings-view";
import { LiturgyRailWidget } from "@/components/liturgy/liturgy-rail-widget";
import { LiturgyService } from "@/lib/services/liturgy.service";

export const metadata = {
	title: "Daily Liturgy & Readings",
	description: "Catholic Daily Mass readings, liturgical season, and saint of the day.",
};

export default async function ReadingsPage({
	searchParams,
}: {
	searchParams: Promise<{ date?: string }>;
}) {
	const params = await searchParams;
	let dateStr = params.date;

	if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, "0");
		const d = String(now.getDate()).padStart(2, "0");
		dateStr = `${y}-${m}-${d}`;
	}

	const liturgy = await LiturgyService.getDailyLiturgy(dateStr);

	return (
		<FeedShell
			topBar={
				<div className="sticky top-16 z-30 border-b border-hairline bg-surface-1/95 px-4 py-3 backdrop-blur pt-[calc(12px+env(safe-area-inset-top))]">
					<div className="flex items-center gap-2">
						<span aria-hidden className="size-[7px] rounded-full bg-gold" />
						<h1 className="text-title-sm font-semibold tracking-[0.01em] text-fg">
							Daily Readings & Saints
						</h1>
					</div>
				</div>
			}
			aside={<LiturgyRailWidget liturgy={liturgy} />}
		>
			<div className="p-4">
				<DailyReadingsView initialLiturgy={liturgy} currentDate={dateStr} />
			</div>
		</FeedShell>
	);
}
