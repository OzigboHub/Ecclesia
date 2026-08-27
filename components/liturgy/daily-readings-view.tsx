"use client";

import type { DailyLiturgy, LiturgicalColor } from "@/types/liturgy";
import {
	BookOpen,
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	ExternalLink,
	Info,
	Quote,
	Share2,
	Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LiturgyImageModal } from "./liturgy-image-modal";
import { UsccbReaderModal } from "./usccb-reader-modal";

interface DailyReadingsViewProps {
	initialLiturgy: DailyLiturgy;
	currentDate: string;
}

const colorBadgeStyles: Record<
	LiturgicalColor,
	{ badge: string; dot: string; header: string }
> = {
	green: {
		badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
		dot: "bg-emerald-500",
		header: "from-emerald-500/10 to-transparent",
	},
	purple: {
		badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
		dot: "bg-purple-500",
		header: "from-purple-500/10 to-transparent",
	},
	white: {
		badge: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
		dot: "bg-amber-400",
		header: "from-amber-500/10 to-transparent",
	},
	red: {
		badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
		dot: "bg-rose-500",
		header: "from-rose-500/10 to-transparent",
	},
	rose: {
		badge: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
		dot: "bg-pink-400",
		header: "from-pink-500/10 to-transparent",
	},
};

export function DailyReadingsView({
	initialLiturgy,
	currentDate,
}: DailyReadingsViewProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const liturgy = initialLiturgy;
	const colorStyle =
		colorBadgeStyles[liturgy.liturgicalColor] ?? colorBadgeStyles.green;

	const navigateDate = (deltaDays: number) => {
		const [y, m, d] = currentDate.split("-").map(Number);
		const target = new Date(y, m - 1, d);
		target.setDate(target.getDate() + deltaDays);

		const nextYear = target.getFullYear();
		const nextMonth = String(target.getMonth() + 1).padStart(2, "0");
		const nextDay = String(target.getDate()).padStart(2, "0");
		const nextDateStr = `${nextYear}-${nextMonth}-${nextDay}`;

		startTransition(() => {
			router.push(`/readings?date=${nextDateStr}`);
		});
	};

	const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (value) {
			startTransition(() => {
				router.push(`/readings?date=${value}`);
			});
		}
	};

	const handleShare = () => {
		const text = `Catholic Daily Readings (${liturgy.formattedDate})\n\nFeast/Memorial: ${liturgy.celebration.name}\nSeason: ${liturgy.season} (${liturgy.colorName})\n\n📖 First Reading: ${liturgy.readings.firstReading}\n📖 Psalm: ${liturgy.readings.psalm}${liturgy.readings.secondReading ? `\n📖 Second Reading: ${liturgy.readings.secondReading}` : ""}\n📖 Gospel: ${liturgy.readings.gospel}\n\nUSCCB Readings: ${liturgy.usccbLink}`;

		if (navigator.share) {
			navigator
				.share({
					title: `Catholic Daily Liturgy - ${liturgy.formattedDate}`,
					text,
					url: window.location.href,
				})
				.catch(() => {});
		} else {
			navigator.clipboard.writeText(text);
			toast.success("Daily liturgy readings copied to clipboard");
		}
	};

	return (
		<div className="space-y-4">
			{/* Date Navigation Bar */}
			<div className="sticky top-16 z-20 flex items-center justify-between border-b border-hairline bg-surface-1/95 px-4 py-2.5 backdrop-blur">
				<button
					type="button"
					onClick={() => navigateDate(-1)}
					disabled={isPending}
					className="flex size-9 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-fg hover:bg-surface-3 transition-colors disabled:opacity-50"
					aria-label="Previous day"
				>
					<ChevronLeft className="size-4" />
				</button>

				<div className="flex items-center gap-2">
					<input
						type="date"
						value={currentDate}
						onChange={handleDateInput}
						className="rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5 text-body-sm font-semibold text-fg outline-hidden focus:border-gold"
					/>
					<button
						type="button"
						onClick={() => {
							const now = new Date();
							const y = now.getFullYear();
							const m = String(now.getMonth() + 1).padStart(2, "0");
							const d = String(now.getDate()).padStart(2, "0");
							startTransition(() => {
								router.push(`/readings?date=${y}-${m}-${d}`);
							});
						}}
						disabled={isPending}
						className="rounded-lg border border-hairline px-2.5 py-1.5 text-caption font-semibold text-gold hover:bg-surface-2 transition-colors disabled:opacity-50"
					>
						Today
					</button>
				</div>

				<button
					type="button"
					onClick={() => navigateDate(1)}
					disabled={isPending}
					className="flex size-9 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-fg hover:bg-surface-3 transition-colors disabled:opacity-50"
					aria-label="Next day"
				>
					<ChevronRight className="size-4" />
				</button>
			</div>

			{/* Main Liturgy Header Banner */}
			<section
				className={`relative overflow-hidden rounded-card border border-hairline bg-surface-1 p-5 bg-gradient-to-b ${colorStyle.header}`}
			>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<span
						className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-semibold ${colorStyle.badge}`}
					>
						<span className={`size-2 rounded-full ${colorStyle.dot}`} />
						{liturgy.colorName} · {liturgy.season}
					</span>

					{liturgy.celebration.type && liturgy.celebration.type !== "FERIA" && (
						<span className="rounded bg-surface-2/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-fg-dim">
							{liturgy.celebration.type}
						</span>
					)}
				</div>

				<h1 className="mt-3 text-title-md font-bold text-fg">
					{liturgy.celebration.name}
				</h1>
				<p className="mt-1 flex items-center gap-1.5 text-body-sm text-fg-muted">
					<CalendarIcon className="size-3.5" />
					{liturgy.formattedDate}
				</p>
			</section>

			{/* Saint Profile / Bio Section */}
			{(liturgy.celebration.description ||
				liturgy.celebration.quote ||
				liturgy.celebration.image) && (
				<section className="rounded-card border border-hairline bg-surface-1 p-5">
					<div className="flex items-center gap-2 text-title-sm font-semibold text-fg">
						<Sparkles className="size-4 text-gold" />
						<h2>Saint & Celebration Reflection</h2>
					</div>

					<div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
						{liturgy.celebration.image && (
							<div className="mx-auto sm:mx-0 shrink-0">
								<LiturgyImageModal
									src={liturgy.celebration.image}
									alt={liturgy.celebration.name}
									title={liturgy.celebration.name}
									subtitle={`${liturgy.formattedDate} · ${liturgy.season}`}
									quote={liturgy.celebration.quote}
									thumbnailSize="lg"
								/>
							</div>
						)}

						<div className="flex-1 space-y-3">
							{liturgy.celebration.quote && (
								<blockquote className="flex gap-2.5 rounded-lg bg-surface-2/80 p-3 text-body-sm italic text-fg-body">
									<Quote className="size-4 shrink-0 text-gold opacity-75 mt-0.5" />
									<p className="leading-relaxed">
										"{liturgy.celebration.quote}"
									</p>
								</blockquote>
							)}

							{liturgy.celebration.description && (
								<p className="text-body-sm leading-relaxed text-fg-body">
									{liturgy.celebration.description}
								</p>
							)}
						</div>
					</div>
				</section>
			)}

			{/* Scripture Readings Cards */}
			<section className="space-y-3">
				<div className="flex items-center justify-between px-1">
					<h2 className="text-title-sm font-semibold text-fg flex items-center gap-2">
						<BookOpen className="size-4 text-gold" />
						Liturgy of the Word
					</h2>
					<span className="text-caption text-fg-dim">NABRE / USCCB</span>
				</div>

				{/* 1st Reading */}
				<div className="rounded-card border border-hairline bg-surface-1 p-4.5 transition-shadow">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-bold uppercase tracking-widest text-fg-dim">
							First Reading
						</span>
						<span className="text-caption text-fg-muted font-medium">
							Reading I
						</span>
					</div>
					<h3 className="mt-2 text-title-sm font-semibold text-fg">
						{liturgy.readings.firstReading}
					</h3>
				</div>

				{/* Psalm */}
				<div className="rounded-card border border-hairline bg-surface-1 p-4.5 transition-shadow">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-bold uppercase tracking-widest text-fg-dim">
							Responsorial Psalm
						</span>
						<span className="text-caption text-fg-muted font-medium">
							Psalm
						</span>
					</div>
					<h3 className="mt-2 text-title-sm font-semibold text-fg">
						{liturgy.readings.psalm}
					</h3>
				</div>

				{/* 2nd Reading (if present) */}
				{liturgy.readings.secondReading && (
					<div className="rounded-card border border-hairline bg-surface-1 p-4.5 transition-shadow">
						<div className="flex items-center justify-between">
							<span className="text-[11px] font-bold uppercase tracking-widest text-fg-dim">
								Second Reading
							</span>
							<span className="text-caption text-fg-muted font-medium">
								Reading II
							</span>
						</div>
						<h3 className="mt-2 text-title-sm font-semibold text-fg">
							{liturgy.readings.secondReading}
						</h3>
					</div>
				)}

				{/* Holy Gospel */}
				<div className="rounded-card border-2 border-gold/40 bg-surface-1 p-4.5 shadow-xs transition-shadow">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-bold uppercase tracking-widest text-gold">
							Holy Gospel
						</span>
						<span className="rounded-full bg-gold/15 px-2 py-0.5 text-caption font-semibold text-gold">
							Gospel
						</span>
					</div>
					<h3 className="mt-2 text-title-sm font-bold text-fg">
						{liturgy.readings.gospel}
					</h3>
				</div>
			</section>

			{/* Full Readings Verification & External Link */}
			<section className="rounded-card border border-hairline bg-surface-1 p-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-start gap-2.5">
						<Info className="size-4 shrink-0 text-fg-muted mt-0.5" />
						<div>
							<p className="text-body-sm font-medium text-fg">
								Read Full Scripture Text
							</p>
							<p className="text-caption text-fg-muted">
								Official lectionary texts, audios, and daily video reflections
								on the USCCB website.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 self-end sm:self-auto shrink-0 whitespace-nowrap">
						<button
							type="button"
							onClick={handleShare}
							className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-3 py-1.5 text-body-sm font-medium text-fg hover:bg-surface-3 transition-colors shrink-0 whitespace-nowrap"
						>
							<Share2 className="size-3.5" />
							Share
						</button>

						<UsccbReaderModal
							url={liturgy.usccbLink}
							liturgy={liturgy}
							trigger={
								<button
									type="button"
									className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 text-body-sm font-semibold text-on-gold hover:opacity-95 transition-opacity shrink-0 whitespace-nowrap"
								>
									<BookOpen className="size-3.5" />
									<span>Read Full Text</span>
								</button>
							}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
