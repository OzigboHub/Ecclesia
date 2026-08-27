"use client";

import type { DailyLiturgy, LiturgicalColor } from "@/types/liturgy";
import { BookOpen, Calendar, ExternalLink, Quote } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { UsccbReaderModal } from "./usccb-reader-modal";
import { LiturgyImageModal } from "./liturgy-image-modal";

interface LiturgyFeedCardProps {
	liturgy: DailyLiturgy;
}

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

export function LiturgyFeedCard({ liturgy }: LiturgyFeedCardProps) {
	const colorStyle = colorBadgeStyles[liturgy.liturgicalColor] ?? colorBadgeStyles.green;

	const handleShare = () => {
		const text = `Catholic Daily Readings (${liturgy.formattedDate})\n📖 1st Reading: ${liturgy.readings.firstReading}\n📖 Psalm: ${liturgy.readings.psalm}${liturgy.readings.secondReading ? `\n📖 2nd Reading: ${liturgy.readings.secondReading}` : ""}\n📖 Gospel: ${liturgy.readings.gospel}\n\nUSCCB: ${liturgy.usccbLink}`;
		if (navigator.share) {
			navigator.share({
				title: `Catholic Readings - ${liturgy.formattedDate}`,
				text,
				url: window.location.origin + `/readings?date=${liturgy.date}`,
			}).catch(() => {});
		} else {
			navigator.clipboard.writeText(text);
			toast.success("Readings copied to clipboard");
		}
	};

	return (
		<article className="border-b border-hairline bg-surface-1 px-4 pt-3 pb-4 lg:mb-2 lg:rounded-card lg:border lg:px-5 lg:py-4.5">
			{/* Header line */}
			<div className="mb-2.5 flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-gold/15 text-[10px] font-semibold text-gold">
						✝
					</div>
					<span className="text-meta font-medium text-fg-muted">
						Daily Liturgy · {liturgy.season}
					</span>
				</div>

				<div className="flex items-center gap-1.5">
					<span
						className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-caption font-medium ${colorStyle.badge}`}
					>
						<span className={`size-1.5 rounded-full ${colorStyle.dot}`} />
						{liturgy.colorName}
					</span>
				</div>
			</div>

			{/* Celebration Title & Saint Info */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1">
					<div className="flex items-center gap-2">
						{liturgy.celebration.type && liturgy.celebration.type !== "FERIA" && (
							<span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium tracking-wide uppercase text-fg-dim">
								{liturgy.celebration.type}
							</span>
						)}
					</div>
					<h3 className="mt-1 text-title-sm font-semibold leading-snug text-fg">
						{liturgy.celebration.name}
					</h3>
					<p className="mt-0.5 text-caption text-fg-dim">
						{liturgy.formattedDate}
					</p>
				</div>

				{liturgy.celebration.image && (
					<LiturgyImageModal
						src={liturgy.celebration.image}
						alt={liturgy.celebration.name}
						title={liturgy.celebration.name}
						subtitle={`${liturgy.formattedDate} · ${liturgy.season}`}
						quote={liturgy.celebration.quote}
						thumbnailSize="sm"
					/>
				)}
			</div>

			{/* Saint quote / reflection */}
			{liturgy.celebration.quote && (
				<blockquote className="my-3 flex gap-2.5 rounded-lg bg-surface-2/70 p-2.5 text-body-sm italic text-fg-body">
					<Quote className="size-4 shrink-0 text-gold opacity-70" />
					<p className="leading-relaxed">"{liturgy.celebration.quote}"</p>
				</blockquote>
			)}

			{/* Readings Grid */}
			<div className="mt-3 rounded-lg border border-hairline/80 bg-surface-0/60 p-3">
				<div className="grid grid-cols-1 gap-2 text-body-sm sm:grid-cols-2">
					<div className="flex flex-col">
						<span className="text-[11px] font-medium uppercase tracking-wider text-fg-dim">
							First Reading
						</span>
						<span className="font-medium text-fg">
							{liturgy.readings.firstReading}
						</span>
					</div>

					<div className="flex flex-col">
						<span className="text-[11px] font-medium uppercase tracking-wider text-fg-dim">
							Responsorial Psalm
						</span>
						<span className="font-medium text-fg">
							{liturgy.readings.psalm}
						</span>
					</div>

					{liturgy.readings.secondReading && (
						<div className="flex flex-col">
							<span className="text-[11px] font-medium uppercase tracking-wider text-fg-dim">
								Second Reading
							</span>
							<span className="font-medium text-fg">
								{liturgy.readings.secondReading}
							</span>
						</div>
					)}

					<div className="flex flex-col">
						<span className="text-[11px] font-medium uppercase tracking-wider text-gold">
							Holy Gospel
						</span>
						<span className="font-semibold text-fg">
							{liturgy.readings.gospel}
						</span>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="mt-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-t border-hairline/60 pt-2.5">
				<div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
					<Link
						href={`/readings?date=${liturgy.date}`}
						className="inline-flex min-h-8 items-center gap-1.5 rounded-md bg-gold px-3 py-1 text-caption font-semibold text-on-gold hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
					>
						<BookOpen className="size-3.5" />
						Full Readings & Saint
					</Link>

					<UsccbReaderModal
						url={liturgy.usccbLink}
						liturgy={liturgy}
					/>
				</div>

				<button
					type="button"
					onClick={handleShare}
					className="inline-flex min-h-8 items-center gap-1 rounded-md px-2.5 py-1 text-caption font-medium text-fg-dim hover:bg-surface-2 transition-colors whitespace-nowrap shrink-0"
				>
					Share
				</button>
			</div>
		</article>
	);
}
