"use client";

import {
  getDailyScriptureTextsAction,
  getLiturgyForDateAction,
} from "@/app/actions/liturgy.actions";
import { LiturgyImageModal } from "@/components/liturgy/liturgy-image-modal";
import { UsccbReaderModal } from "@/components/liturgy/usccb-reader-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  DailyLiturgy,
  DailyScriptureTexts,
  LiturgicalColor,
} from "@/types/liturgy";
import {
  BookOpen,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Loader2,
  MessageSquareQuote,
  Quote,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { FaArrowRightLong } from "react-icons/fa6";
import { toast } from "sonner";

interface LandingDailyReadingsProps {
  initialLiturgy: DailyLiturgy;
  initialScriptureTexts?: DailyScriptureTexts | null;
  parishId?: string;
  parishName?: string;
}

const colorBadgeStyles: Record<
  LiturgicalColor,
  { badge: string; dot: string; glow: string; text: string }
> = {
  green: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    glow: "from-emerald-500/10 via-transparent to-transparent",
    text: "text-emerald-400",
  },
  purple: {
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    dot: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]",
    glow: "from-purple-500/10 via-transparent to-transparent",
    text: "text-purple-400",
  },
  white: {
    badge: "bg-amber-400/10 text-amber-300 border-amber-400/30",
    dot: "bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.6)]",
    glow: "from-amber-400/10 via-transparent to-transparent",
    text: "text-amber-300",
  },
  red: {
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
    glow: "from-rose-500/10 via-transparent to-transparent",
    text: "text-rose-400",
  },
  rose: {
    badge: "bg-pink-500/10 text-pink-400 border-pink-500/30",
    dot: "bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.6)]",
    glow: "from-pink-500/10 via-transparent to-transparent",
    text: "text-pink-400",
  },
};

type ReadingTab = "first" | "psalm" | "second" | "gospel";

export function LandingDailyReadings({
  initialLiturgy,
  initialScriptureTexts,
  parishId,
  parishName,
}: LandingDailyReadingsProps) {
  const [isPending, startTransition] = useTransition();
  const [currentDate, setCurrentDate] = useState<string>(initialLiturgy.date);
  const [liturgy, setLiturgy] = useState<DailyLiturgy>(initialLiturgy);
  const [scriptureTexts, setScriptureTexts] =
    useState<DailyScriptureTexts | null>(initialScriptureTexts || null);
  const [loadingScriptures, setLoadingScriptures] = useState(false);
  const [activeTab, setActiveTab] = useState<ReadingTab>("gospel");

  // Color styles
  const colorStyle =
    colorBadgeStyles[liturgy.liturgicalColor] ?? colorBadgeStyles.green;

  // Load scripture texts whenever liturgy changes if not already available
  useEffect(() => {
    let isMounted = true;
    setLoadingScriptures(true);
    getDailyScriptureTextsAction(liturgy.readings, liturgy.season)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setScriptureTexts(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load scripture texts for landing:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingScriptures(false);
      });

    return () => {
      isMounted = false;
    };
  }, [liturgy]);

  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr || newDateStr === currentDate) return;
    setCurrentDate(newDateStr);
    startTransition(async () => {
      const res = await getLiturgyForDateAction(newDateStr);
      if (res.success && res.data) {
        setLiturgy(res.data);
      } else {
        toast.error("Could not load liturgy for this date");
      }
    });
  };

  const navigateRelative = (deltaDays: number) => {
    const [y, m, d] = currentDate.split("-").map(Number);
    const target = new Date(y, m - 1, d);
    target.setDate(target.getDate() + deltaDays);

    const nextYear = target.getFullYear();
    const nextMonth = String(target.getMonth() + 1).padStart(2, "0");
    const nextDay = String(target.getDate()).padStart(2, "0");
    const dateStr = `${nextYear}-${nextMonth}-${nextDay}`;
    handleDateChange(dateStr);
  };

  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const isToday = currentDate === getTodayStr();

  const handleShare = () => {
    const text = `Catholic Daily Readings (${liturgy.formattedDate})\n\nFeast/Memorial: ${liturgy.celebration.name}\nSeason: ${liturgy.season} (${liturgy.colorName})\n\n📖 First Reading: ${liturgy.readings.firstReading}\n📖 Psalm: ${liturgy.readings.psalm}${liturgy.readings.secondReading ? `\n📖 Second Reading: ${liturgy.readings.secondReading}` : ""}\n📖 Gospel: ${liturgy.readings.gospel}\n\nUSCCB Readings: ${liturgy.usccbLink}`;

    if (navigator.share) {
      navigator
        .share({
          title: `Catholic Daily Liturgy - ${liturgy.formattedDate}`,
          text,
          url: window.location.origin + `/readings?date=${liturgy.date}`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Daily readings copied to clipboard");
    }
  };

  // Determine available tabs
  const availableTabs: {
    key: ReadingTab;
    label: string;
    icon: string;
    citation: string;
  }[] = [
    {
      key: "gospel",
      label: "Holy Gospel",
      icon: "✝",
      citation: liturgy.readings.gospel,
    },
    {
      key: "first",
      label: "1st Reading",
      icon: "📖",
      citation: liturgy.readings.firstReading,
    },
    {
      key: "psalm",
      label: "Psalm",
      icon: "🎵",
      citation: liturgy.readings.psalm,
    },
  ];

  if (liturgy.readings.secondReading) {
    availableTabs.splice(2, 0, {
      key: "second",
      label: "2nd Reading",
      icon: "📜",
      citation: liturgy.readings.secondReading,
    });
  }

  // Active text retrieval
  const getActivePassage = () => {
    if (!scriptureTexts) return null;
    switch (activeTab) {
      case "gospel":
        return scriptureTexts.gospel;
      case "first":
        return scriptureTexts.firstReading;
      case "psalm":
        return scriptureTexts.psalm;
      case "second":
        return scriptureTexts.secondReading;
      default:
        return scriptureTexts.gospel;
    }
  };

  const currentPassage = getActivePassage();

  return (
    <section className="py-6 md:py-10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Daily Mass Readings & Saints
          </h2>
          <p className="text-slate-400 text-sm md:text-base mt-1 max-w-xl">
            {parishName
              ? `Daily Church liturgy, Mass scriptures, and saint reflections for ${parishName}.`
              : "Nourish your faith with today's Church liturgy, scripture verses, and saint reflections."}
          </p>
        </div>

        {/* Quick Date Controls */}
        <div className="flex items-center gap-2 bg-[#111827] border border-border/80 p-1.5 rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => navigateRelative(-1)}
            disabled={isPending}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
            title="Previous Day">
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleDateChange(getTodayStr())}
            disabled={isPending || isToday}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isToday
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}>
            Today
          </button>

          <button
            type="button"
            onClick={() => navigateRelative(1)}
            disabled={isPending}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
            title="Next Day">
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="relative">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={isPending}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              title="Select specific date"
            />
            <div className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Card */}
      <Card className="relative overflow-hidden bg-gradient-to-b from-[#131d31] via-[#0f172a] to-[#0b1120] border-border shadow-2xl text-white">
        {/* Top liturgical ambient glow */}
        <div
          className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${colorStyle.glow} opacity-80`}
        />

        <CardContent className="p-5 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column: Liturgical Celebration & Saint Spotlight */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
              <div>
                {/* Season & Color Pill */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorStyle.badge}`}>
                    <span
                      className={`w-2 h-2 rounded-full ${colorStyle.dot}`}
                    />
                    <span>{liturgy.colorName}</span>
                    <span className="opacity-60">·</span>
                    <span>{liturgy.season}</span>
                  </span>

                  {liturgy.celebration.type &&
                    liturgy.celebration.type !== "FERIA" && (
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        {liturgy.celebration.type}
                      </span>
                    )}

                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading...
                    </span>
                  )}
                </div>

                {/* Celebration Name & Formatted Date */}
                <h3 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
                  {liturgy.celebration.name}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">
                  {liturgy.formattedDate}
                </p>

                {/* Saint Portrait + Spiritual Quote */}
                <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-4">
                  {liturgy.celebration.image ? (
                    <div className="shrink-0">
                      <LiturgyImageModal
                        src={liturgy.celebration.image}
                        alt={liturgy.celebration.name}
                        title={liturgy.celebration.name}
                        subtitle={`${liturgy.formattedDate} · ${liturgy.season}`}
                        quote={liturgy.celebration.quote}
                        thumbnailSize="md"
                      />
                    </div>
                  ) : (
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xl">
                      ✝
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1">
                      <Quote className="w-3 h-3" />
                      Spiritual Reflection
                    </p>
                    <p className="text-xs md:text-sm italic text-slate-300 mt-1 leading-relaxed line-clamp-3">
                      {liturgy.celebration.quote
                        ? `"${liturgy.celebration.quote}"`
                        : "Let the Word of Christ dwell in you richly as you meditate on today's sacred scriptures."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary CTA leading to /feed */}
              <div className="pt-2">
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Users className="w-4 h-4" />
                    <span>Parish Community Feed</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {parishName
                      ? `Connect with parishioners of ${parishName}, share reflections, and join the daily discussion around today's Word.`
                      : "Share reflections, post prayer intentions, and connect with fellow parishioners around today's Word."}
                  </p>
                  <Button
                    asChild
                    className="w-full rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 shadow-lg py-5">
                    <Link
                      href="/feed"
                      className="flex items-center justify-center gap-2">
                      <span>Enter Parish Feed</span>
                      <FaArrowRightLong className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Scripture Tabs & Excerpt Preview */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 md:p-6">
              <div>
                {/* Reading Tabs */}
                <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-800">
                  {availableTabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const isGospel = tab.key === "gospel";
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                          isActive
                            ? isGospel
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-slate-700 text-white shadow-sm"
                            : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        }`}>
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Reading Citation & Text */}
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                      {availableTabs.find((t) => t.key === activeTab)?.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                      {availableTabs.find((t) => t.key === activeTab)?.citation}
                    </span>
                  </div>

                  {/* Scripture Passage Content */}
                  <div className="min-h-[160px] md:min-h-[190px] max-h-[260px] overflow-y-auto pr-2 rounded-xl bg-slate-950/40 p-4 border border-slate-800/60 text-slate-200 text-sm md:text-base leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
                    {loadingScriptures ? (
                      <div className="flex flex-col items-center justify-center h-36 gap-2 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-xs">
                          Fetching scripture text...
                        </span>
                      </div>
                    ) : currentPassage?.text ? (
                      <div className="whitespace-pre-line font-serif text-slate-200/90 text-sm md:text-[15px] leading-relaxed">
                        {currentPassage.text}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        <p className="font-semibold text-slate-300 mb-1">
                          {
                            availableTabs.find((t) => t.key === activeTab)
                              ?.citation
                          }
                        </p>
                        <p className="text-xs">
                          Click "Read Full Text" below to view the official text
                          from the USCCB Lectionary.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Link to /readings */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold gap-1.5 h-9">
                    <Link href={`/readings?date=${liturgy.date}`}>
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span>Full Readings & Meditations</span>
                    </Link>
                  </Button>

                  {/* In-app USCCB Reader Modal */}
                  <UsccbReaderModal
                    url={liturgy.usccbLink}
                    liturgy={liturgy}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold gap-1.5 h-9">
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>Read Full USCCB</span>
                      </Button>
                    }
                  />
                </div>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary transition-colors px-2 py-1"
                  title="Copy / Share Readings">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
