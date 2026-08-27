"use client";

import { getDailyScriptureTextsAction } from "@/app/actions/liturgy.actions";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { DailyLiturgy, DailyScriptureTexts } from "@/types/liturgy";
import {
	BookOpen,
	Check,
	Copy,
	ExternalLink,
	Globe,
	Loader2,
	Share2,
	Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface UsccbReaderModalProps {
	url: string;
	liturgy: DailyLiturgy;
	trigger?: React.ReactNode;
	className?: string;
}

export function UsccbReaderModal({
	url,
	liturgy,
	trigger,
	className,
}: UsccbReaderModalProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [scriptureTexts, setScriptureTexts] = useState<DailyScriptureTexts | null>(null);
	const [activeTab, setActiveTab] = useState<"all" | "first" | "psalm" | "second" | "alleluia" | "gospel">("all");
	const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (isOpen && !scriptureTexts && !loading) {
			setLoading(true);
			getDailyScriptureTextsAction(liturgy.readings, liturgy.season)
				.then((res) => {
					if (res.success && res.data) {
						setScriptureTexts(res.data);
					}
				})
				.finally(() => setLoading(false));
		}
	}, [isOpen, liturgy.readings, liturgy.season, scriptureTexts, loading]);

	const fontSizeClasses = {
		sm: "text-body-sm leading-relaxed",
		base: "text-body leading-relaxed",
		lg: "text-body-lg sm:text-title-sm leading-loose",
	}[fontSize];

	const handleCopyAll = () => {
		let textToCopy = `Catholic Daily Mass Readings (${liturgy.formattedDate})\nFeast: ${liturgy.celebration.name}\n\n`;

		textToCopy += `--- FIRST READING ---\n${liturgy.readings.firstReading}\n${scriptureTexts?.firstReading?.text || ""}\n\n`;
		textToCopy += `--- RESPONSORIAL PSALM ---\n${liturgy.readings.psalm}\n${scriptureTexts?.psalm?.text || ""}\n\n`;

		if (liturgy.readings.secondReading) {
			textToCopy += `--- SECOND READING ---\n${liturgy.readings.secondReading}\n${scriptureTexts?.secondReading?.text || ""}\n\n`;
		}

		if (scriptureTexts?.alleluia?.text) {
			textToCopy += `--- ${scriptureTexts.alleluia.label.toUpperCase()} ---\n${scriptureTexts.alleluia.text}\n\n`;
		}

		textToCopy += `--- HOLY GOSPEL ---\n${liturgy.readings.gospel}\n${scriptureTexts?.gospel?.text || ""}\n\n`;
		textToCopy += `USCCB: ${url}`;

		navigator.clipboard.writeText(textToCopy);
		setCopied(true);
		toast.success("Complete daily readings copied to clipboard");
		setTimeout(() => setCopied(false), 2500);
	};

	const handleShare = () => {
		if (navigator.share) {
			navigator
				.share({
					title: `Daily Scripture Readings - ${liturgy.formattedDate}`,
					text: `Catholic Mass Readings for ${liturgy.formattedDate} (${liturgy.celebration.name})\n1st Reading: ${liturgy.readings.firstReading}\nPsalm: ${liturgy.readings.psalm}\nGospel: ${liturgy.readings.gospel}`,
					url: window.location.href,
				})
				.catch(() => {});
		} else {
			handleCopyAll();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<button
						type="button"
						className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 py-1 text-caption font-medium text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors ${className || ""}`}
					>
						<BookOpen className="size-3.5 text-gold" />
						<span>Read Scripture</span>
					</button>
				)}
			</DialogTrigger>

			<DialogContent
				className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-0 bg-surface-1 p-0 shadow-2xl sm:h-[90vh] sm:max-h-[90vh] sm:w-[94vw] sm:max-w-3xl sm:rounded-2xl sm:border sm:border-hairline"
			>
				{/* Modal Top Bar: Header with Safe Padding for the Radix Close (X) Button */}
				<div className="shrink-0 border-b border-hairline bg-surface-1 px-4 pt-3 pb-2.5 sm:px-6 sm:py-3.5 pt-[calc(10px+env(safe-area-inset-top))]">
					{/* Top Line: Brand / Title + Space reserved for top-right close icon */}
					<div className="flex items-start justify-between gap-3 pr-8 sm:pr-10">
						<div className="flex items-center gap-2.5 min-w-0">
							<div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-xs sm:text-sm font-bold text-gold">
								✝
							</div>
							<div className="min-w-0">
								<DialogTitle className="truncate text-title-sm font-bold text-fg">
									Daily Mass Readings
								</DialogTitle>
								<DialogDescription className="truncate text-caption text-fg-dim">
									{liturgy.formattedDate} · {liturgy.season}
								</DialogDescription>
							</div>
						</div>
					</div>

					{/* Celebration Subheading */}
					<div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
						{liturgy.celebration.type && liturgy.celebration.type !== "FERIA" && (
							<span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fg-dim">
								{liturgy.celebration.type}
							</span>
						)}
						<p className="truncate text-caption font-semibold text-fg">
							{liturgy.celebration.name}
						</p>
					</div>

					{/* Controls Toolbar: Font Adjuster + Quick Actions */}
					<div className="mt-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-t border-hairline/60 pt-2">
						{/* Font Size Adjuster */}
						<div className="flex items-center rounded-lg border border-hairline bg-surface-2 p-0.5 shrink-0 whitespace-nowrap">
							<span className="px-1.5 text-[11px] font-medium text-fg-dim hidden xs:inline">
								Text:
							</span>
							<button
								type="button"
								onClick={() => setFontSize("sm")}
								className={`px-2 py-0.5 text-caption font-semibold rounded ${fontSize === "sm" ? "bg-surface-1 text-gold shadow-xs" : "text-fg-dim hover:text-fg"}`}
								title="Smaller text"
							>
								A-
							</button>
							<button
								type="button"
								onClick={() => setFontSize("base")}
								className={`px-2 py-0.5 text-caption font-semibold rounded ${fontSize === "base" ? "bg-surface-1 text-gold shadow-xs" : "text-fg-dim hover:text-fg"}`}
								title="Normal text"
							>
								A
							</button>
							<button
								type="button"
								onClick={() => setFontSize("lg")}
								className={`px-2 py-0.5 text-caption font-semibold rounded ${fontSize === "lg" ? "bg-surface-1 text-gold shadow-xs" : "text-fg-dim hover:text-fg"}`}
								title="Larger text"
							>
								A+
							</button>
						</div>

						{/* Action Buttons */}
						<div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
							<button
								type="button"
								onClick={handleCopyAll}
								title="Copy Readings"
								className="flex h-8 items-center gap-1 rounded-lg border border-hairline bg-surface-2 px-2.5 text-caption font-medium text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors whitespace-nowrap shrink-0"
							>
								{copied ? (
									<>
										<Check className="size-3.5 text-emerald-600" />
										<span className="hidden sm:inline">Copied</span>
									</>
								) : (
									<>
										<Copy className="size-3.5" />
										<span className="hidden sm:inline">Copy</span>
									</>
								)}
							</button>

							<button
								type="button"
								onClick={handleShare}
								title="Share Readings"
								className="flex h-8 items-center gap-1 rounded-lg border border-hairline bg-surface-2 px-2.5 text-caption font-medium text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors whitespace-nowrap shrink-0"
							>
								<Share2 className="size-3.5" />
								<span className="hidden sm:inline">Share</span>
							</button>

							<a
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								title="Open USCCB"
								className="flex h-8 items-center gap-1 rounded-lg bg-gold/15 px-2.5 text-caption font-semibold text-gold hover:bg-gold/25 transition-colors whitespace-nowrap shrink-0"
							>
								<span>USCCB</span>
								<ExternalLink className="size-3" />
							</a>
						</div>
					</div>

					{/* Scripture Navigation Tabs: Scrollable without collisions */}
					<div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-caption font-medium scrollbar-none whitespace-nowrap">
						<button
							type="button"
							onClick={() => setActiveTab("all")}
							className={`rounded-full px-3 py-1 transition-colors shrink-0 whitespace-nowrap ${activeTab === "all" ? "bg-gold text-on-gold font-semibold" : "bg-surface-2 text-fg-dim hover:bg-surface-3 hover:text-fg"}`}
						>
							All
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("first")}
							className={`rounded-full px-3 py-1 transition-colors shrink-0 whitespace-nowrap ${activeTab === "first" ? "bg-gold text-on-gold font-semibold" : "bg-surface-2 text-fg-dim hover:bg-surface-3 hover:text-fg"}`}
						>
							1st Reading
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("psalm")}
							className={`rounded-full px-3 py-1 transition-colors shrink-0 whitespace-nowrap ${activeTab === "psalm" ? "bg-gold text-on-gold font-semibold" : "bg-surface-2 text-fg-dim hover:bg-surface-3 hover:text-fg"}`}
						>
							Psalm
						</button>
						{liturgy.readings.secondReading && (
							<button
								type="button"
								onClick={() => setActiveTab("second")}
								className={`rounded-full px-3 py-1 transition-colors shrink-0 whitespace-nowrap ${activeTab === "second" ? "bg-gold text-on-gold font-semibold" : "bg-surface-2 text-fg-dim hover:bg-surface-3 hover:text-fg"}`}
							>
								2nd Reading
							</button>
						)}
						{scriptureTexts?.alleluia && (
							<button
								type="button"
								onClick={() => setActiveTab("alleluia")}
								className={`rounded-full px-3 py-1 transition-colors shrink-0 whitespace-nowrap ${activeTab === "alleluia" ? "bg-gold text-on-gold font-semibold" : "bg-surface-2 text-fg-dim hover:bg-surface-3 hover:text-fg"}`}
							>
								{scriptureTexts.alleluia.label}
							</button>
						)}
						<button
							type="button"
							onClick={() => setActiveTab("gospel")}
							className={`rounded-full px-3 py-1 transition-colors shrink-0 whitespace-nowrap ${activeTab === "gospel" ? "bg-gold text-on-gold font-semibold" : "bg-surface-2 text-fg-dim hover:bg-surface-3 hover:text-fg"}`}
						>
							Gospel
						</button>
					</div>
				</div>

				{/* Reading Content Area: Smooth, Custom-Styled Padded Scrolling */}
				<div className="flex-1 overflow-y-auto reader-scroll p-3.5 sm:p-6 space-y-4 sm:space-y-6 pb-[calc(16px+env(safe-area-inset-bottom))]">
					{loading && !scriptureTexts ? (
						<div className="flex flex-col items-center justify-center py-16 gap-3 text-fg-muted">
							<Loader2 className="size-8 animate-spin text-gold" />
							<p className="text-body-sm font-medium text-center px-4 whitespace-nowrap">
								Loading Scripture text for {liturgy.formattedDate}...
							</p>
						</div>
					) : (
						<>
							{/* First Reading */}
							{(activeTab === "all" || activeTab === "first") && (
								<section className="rounded-xl border border-hairline bg-surface-0/60 p-4 sm:p-5 shadow-xs">
									<div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 border-b border-hairline/60 pb-2">
										<span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-fg-dim whitespace-nowrap shrink-0">
											First Reading
										</span>
										<span className="text-caption sm:text-body-sm font-semibold text-fg whitespace-nowrap shrink-0">
											{liturgy.readings.firstReading}
										</span>
									</div>
									<div className={`mt-3 text-fg-body font-serif ${fontSizeClasses}`}>
										{scriptureTexts?.firstReading?.text ? (
											<LiturgicalTextRenderer text={scriptureTexts.firstReading.text} />
										) : (
											<p className="italic text-fg-muted">
												Scripture text for {liturgy.readings.firstReading}
											</p>
										)}
									</div>
								</section>
							)}

							{/* Responsorial Psalm */}
							{(activeTab === "all" || activeTab === "psalm") && (
								<section className="rounded-xl border border-hairline bg-surface-0/60 p-4 sm:p-5 shadow-xs">
									<div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 border-b border-hairline/60 pb-2">
										<span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-fg-dim whitespace-nowrap shrink-0">
											Responsorial Psalm
										</span>
										<span className="text-caption sm:text-body-sm font-semibold text-fg whitespace-nowrap shrink-0">
											{liturgy.readings.psalm}
										</span>
									</div>
									<div className={`mt-3 text-fg-body font-serif ${fontSizeClasses}`}>
										{scriptureTexts?.psalm?.text ? (
											<LiturgicalTextRenderer text={scriptureTexts.psalm.text} isPsalm />
										) : (
											<p className="italic text-fg-muted">
												{liturgy.readings.psalm}
											</p>
										)}
									</div>
								</section>
							)}

							{/* Second Reading */}
							{liturgy.readings.secondReading && (activeTab === "all" || activeTab === "second") && (
								<section className="rounded-xl border border-hairline bg-surface-0/60 p-4 sm:p-5 shadow-xs">
									<div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 border-b border-hairline/60 pb-2">
										<span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-fg-dim whitespace-nowrap shrink-0">
											Second Reading
										</span>
										<span className="text-caption sm:text-body-sm font-semibold text-fg whitespace-nowrap shrink-0">
											{liturgy.readings.secondReading}
										</span>
									</div>
									<div className={`mt-3 text-fg-body font-serif ${fontSizeClasses}`}>
										{scriptureTexts?.secondReading?.text ? (
											<LiturgicalTextRenderer text={scriptureTexts.secondReading.text} />
										) : (
											<p className="italic text-fg-muted">
												Scripture text for {liturgy.readings.secondReading}
											</p>
										)}
									</div>
								</section>
							)}

							{/* Alleluia / Gospel Acclamation */}
							{(activeTab === "all" || activeTab === "alleluia") && scriptureTexts?.alleluia && (
								<section className="rounded-xl border border-gold/40 bg-gold/5 p-4 sm:p-5 shadow-xs">
									<div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 border-b border-gold/20 pb-2">
										<div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
											
											<span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gold">
												{scriptureTexts.alleluia.label}
											</span>
										</div>
										{scriptureTexts.alleluia.citation && (
											<span className="text-caption sm:text-body-sm font-semibold text-fg whitespace-nowrap shrink-0">
												{scriptureTexts.alleluia.citation}
											</span>
										)}
									</div>
									<div className={`mt-3 text-fg-body font-serif ${fontSizeClasses}`}>
										<LiturgicalTextRenderer text={scriptureTexts.alleluia.text} />
									</div>
								</section>
							)}

							{/* Holy Gospel */}
							{(activeTab === "all" || activeTab === "gospel") && (
								<section className="rounded-xl border-2 border-gold/40 bg-surface-0/90 p-4 sm:p-5 shadow-xs">
									<div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 border-b border-gold/20 pb-2">
										<div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
											<span className="size-2 rounded-full bg-gold" />
											<span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gold">
												Holy Gospel
											</span>
										</div>
										<span className="text-caption sm:text-body-sm font-bold text-fg whitespace-nowrap shrink-0">
											{liturgy.readings.gospel}
										</span>
									</div>
									<div className={`mt-3 text-fg-body font-serif ${fontSizeClasses}`}>
										{scriptureTexts?.gospel?.text ? (
											<LiturgicalTextRenderer text={scriptureTexts.gospel.text} />
										) : (
											<p className="italic text-fg-muted">
												Scripture text for {liturgy.readings.gospel}
											</p>
										)}
									</div>
								</section>
							)}
						</>
					)}
				</div>

				{/* Footer Bar: Responsive with safe area insets */}
				<div className="flex shrink-0 items-center justify-between border-t border-hairline bg-surface-1 px-4 py-2.5 text-caption text-fg-dim sm:px-6 pb-[calc(10px+env(safe-area-inset-bottom))] whitespace-nowrap">
					<div className="flex items-center gap-1.5 truncate shrink-0">
						<Globe className="size-3 text-gold shrink-0" />
						<span className="truncate font-medium">USCCB Lectionary</span>
					</div>

					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 font-semibold text-gold hover:underline shrink-0 whitespace-nowrap"
					>
						<span>Open USCCB Audio/Video</span>
						<ExternalLink className="size-3" />
					</a>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function LiturgicalTextRenderer({
	text,
	isPsalm = false,
}: {
	text: string;
	isPsalm?: boolean;
}) {
	if (!text) return null;

	const paragraphs = text.split("\n\n").filter(Boolean);

	return (
		<div className="space-y-3.5">
			{paragraphs.map((p, idx) => {
				const trimmed = p.trim();
				const isRefrain =
					trimmed.startsWith("R. ") ||
					trimmed.startsWith("℟. ") ||
					trimmed.startsWith("R.") ||
					trimmed.startsWith("℟.");

				if (isRefrain) {
					const refrainText = trimmed.replace(/^[R℟]\.?\s*/, "");
					return (
						<div
							key={idx}
							className="my-3 flex items-start gap-2.5 rounded-lg bg-gold/10 p-2.5 sm:p-3 text-gold dark:text-amber-300 font-semibold"
						>
							<span className="shrink-0 flex size-5.5 items-center justify-center rounded-full bg-gold text-on-gold font-sans font-bold text-xs">
								R.
							</span>
							<span className="leading-snug pt-0.5">{refrainText}</span>
						</div>
					);
				}

				return (
					<p key={idx} className="leading-relaxed whitespace-pre-line text-fg-body">
						{p}
					</p>
				);
			})}
		</div>
	);
}
