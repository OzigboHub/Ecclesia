import { RailSection } from "@/components/feed/feed-shell";
import type { DailyLiturgy, LiturgicalColor } from "@/types/liturgy";
import { BookOpen, ExternalLink, Quote } from "lucide-react";
import Link from "next/link";

const colorBadgeStyles: Record<LiturgicalColor, { badge: string; dot: string }> = {
	green: {
		badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
		dot: "bg-emerald-500",
	},
	purple: {
		badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
		dot: "bg-purple-500",
	},
	white: {
		badge: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
		dot: "bg-amber-400",
	},
	red: {
		badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
		dot: "bg-rose-500",
	},
	rose: {
		badge: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
		dot: "bg-pink-400",
	},
};

export function LiturgyRailWidget({ liturgy }: { liturgy: DailyLiturgy }) {
	const colorStyle = colorBadgeStyles[liturgy.liturgicalColor] ?? colorBadgeStyles.green;

	return (
		<RailSection
			title="Daily Liturgy"
			action={
				<span
					className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${colorStyle.badge}`}
				>
					<span className={`size-1 rounded-full ${colorStyle.dot}`} />
					{liturgy.colorName}
				</span>
			}
		>
			<div>
				<p className="text-body-sm font-semibold text-fg">
					{liturgy.celebration.name}
				</p>
				<p className="mt-0.5 text-caption text-fg-dim">
					{liturgy.formattedDate}
				</p>

				{liturgy.celebration.quote && (
					<div className="mt-2.5 flex items-start gap-1.5 rounded-md bg-surface-2 p-2 text-caption italic text-fg-muted">
						<Quote className="size-3 shrink-0 text-gold opacity-75 mt-0.5" />
						<p className="line-clamp-2">"{liturgy.celebration.quote}"</p>
					</div>
				)}

				<div className="mt-2.5 space-y-1 text-caption">
					<div className="flex items-center justify-between text-fg-muted">
						<span className="font-medium text-fg-dim">Gospel</span>
						<span className="truncate pl-2 text-fg font-medium">{liturgy.readings.gospel}</span>
					</div>
					<div className="flex items-center justify-between text-fg-muted">
						<span className="font-medium text-fg-dim">Psalm</span>
						<span className="truncate pl-2 text-fg-body">{liturgy.readings.psalm}</span>
					</div>
				</div>

				<div className="mt-3 flex items-center justify-between border-t border-hairline pt-2">
					<Link
						href={`/readings?date=${liturgy.date}`}
						className="flex items-center gap-1 text-caption font-semibold text-gold hover:underline"
					>
						<BookOpen className="size-3" />
						View Full Liturgy
					</Link>
					<a
						href={liturgy.usccbLink}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-0.5 text-caption text-fg-dim hover:text-fg"
					>
						<span>USCCB</span>
						<ExternalLink className="size-2.5" />
					</a>
				</div>
			</div>
		</RailSection>
	);
}
