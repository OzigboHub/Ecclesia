"use client";

import { useState, useMemo, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import { Modal } from "@/components/ui/modal";
import { MassIntentionForm } from "@/components/forms/mass-intention-form";
import { OrganizationSelector } from "@/components/mass-intentions/organization-selector";
import { getMassesInRange } from "@/app/actions/mass.actions";
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  format,
  isSameDay,
} from "date-fns";

type MassWithIntentions = Prisma.MassGetPayload<{
  include: {
    intentions: {
      include: {
        parishioner: true;
      };
    };
  };
}>;

type MassIntention = Prisma.MassIntentionGetPayload<{
  include: {
    parishioner: true;
    organization: true;
    mass: true;
  };
}>;

interface MassIntentionCalendarProps {
  intentions: MassIntention[];
  masses: MassWithIntentions[];
  initialOrganizationId?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const INTENTION_TYPE_LABELS: Record<string, string> = {
  THANKSGIVING: "Thanksgiving",
  REQUIEM: "Requiem",
  SPECIAL_INTENTION: "Special Intention",
  ANNIVERSARY: "Anniversary",
  HEALING: "Healing",
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  COMPLETED: { label: "Completed", variant: "outline" },
};

function formatMassType(raw: string) {
  return raw
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function MassIntentionCalendar({
  intentions,
  masses,
  initialOrganizationId,
}: MassIntentionCalendarProps) {
  const [isPending, startTransition] = useTransition();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMassId, setSelectedMassId] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(
    initialOrganizationId || "",
  );
  const [displayMasses, setDisplayMasses] = useState<MassWithIntentions[]>(
    masses.filter((m) => m.organizationId === initialOrganizationId),
  );
  const [showMyIntentions, setShowMyIntentions] = useState(false);

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrganizationId(orgId);
    startTransition(async () => {
      const result = await getMassesInRange(
        subMonths(startOfMonth(currentDate), 1),
        addMonths(endOfMonth(currentDate), 1),
        orgId,
      );
      if (result.success && result.data) setDisplayMasses(result.data);
    });
    setSelectedDate(null);
    setSelectedMassId(null);
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= totalDays; day++)
      days.push(new Date(year, month, day));
    return days;
  }, [currentDate]);

  const intentionsByDate = useMemo(() => {
    const map = new Map<string, number>();
    intentions.forEach((intention) => {
      if (intention.mass) {
        const key = new Date(intention.mass.date).toISOString().split("T")[0];
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return map;
  }, [intentions]);

  const massesByDate = useMemo(() => {
    const map = new Map<string, MassWithIntentions[]>();
    displayMasses.forEach((mass) => {
      const key = new Date(mass.date).toISOString().split("T")[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(mass);
    });
    map.forEach((arr) => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [displayMasses]);

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
    setSelectedDate(null);
    setSelectedMassId(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
    setSelectedDate(null);
    setSelectedMassId(null);
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedDateKey = selectedDate
    ? selectedDate.toISOString().split("T")[0]
    : null;
  const massesForSelectedDate = selectedDateKey
    ? massesByDate.get(selectedDateKey) || []
    : [];
  const selectedMass = selectedMassId
    ? massesForSelectedDate.find((m) => m.id === selectedMassId)
    : null;

  return (
    <div className="space-y-6">
      {/* Organization Selector */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <OrganizationSelector
            value={selectedOrganizationId}
            onChange={handleOrganizationChange}
          />
          {isPending && (
            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Loading available masses…
            </p>
          )}
        </CardContent>
      </Card>

      {/* Calendar + Detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* ── Calendar ── */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  {format(currentDate, "MMMM yyyy")}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 px-2"
                  onClick={() => {
                    setCurrentDate(new Date());
                    setSelectedDate(null);
                    setSelectedMassId(null);
                  }}>
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                if (!date) return <div key={`e-${idx}`} />;

                const key = date.toISOString().split("T")[0];
                const myCount = intentionsByDate.get(key) || 0;
                const hasMasses = massesByDate.has(key);
                const isSelected =
                  selectedDate && isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);
                const isPast = date < today;

                return (
                  <button
                    key={key}
                    disabled={isPast}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedMassId(null);
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-lg py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isPast
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-accent cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground hover:bg-primary shadow-sm"
                        : isToday
                          ? "ring-2 ring-primary font-semibold"
                          : "",
                    )}>
                    <span>{date.getDate()}</span>
                    {/* Dot indicators */}
                    {!isPast && (
                      <div className="flex gap-0.5 mt-0.5">
                        {hasMasses && (
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isSelected
                                ? "bg-primary-foreground"
                                : "bg-primary",
                            )}
                          />
                        )}
                        {myCount > 0 && (
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isSelected
                                ? "bg-primary-foreground/70"
                                : "bg-muted-foreground",
                            )}
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                Masses available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground inline-block" />
                My intentions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded border-2 border-primary inline-block" />
                Today
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Right panel: Detail / Mass times ── */}
        <div className="space-y-4">
          {!selectedDate ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  Select a date
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click any future date on the calendar to view available mass
                  times.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {format(selectedDate, "EEEE, d MMMM yyyy")}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {massesForSelectedDate.length === 0
                        ? "No masses on this day"
                        : `${massesForSelectedDate.length} mass${massesForSelectedDate.length !== 1 ? "es" : ""} available`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setSelectedDate(null);
                      setSelectedMassId(null);
                    }}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                {massesForSelectedDate.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No masses scheduled for this date.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try another date or contact the parish office.
                    </p>
                  </div>
                ) : (
                  massesForSelectedDate.map((mass) => {
                    const isCancelled = mass.status === "CANCELLED";
                    const isSelected = selectedMassId === mass.id;
                    // Disable booking once mass start time has passed
                    const now = new Date();
                    const massDate = new Date(mass.date);
                    const isToday = massDate.toDateString() === now.toDateString();
                    let massStarted = false;
                    if (isToday && mass.time) {
                      const [h, m] = mass.time.split(":").map(Number);
                      const massStart = new Date(massDate);
                      massStart.setHours(h, m, 0, 0);
                      massStarted = now >= massStart;
                    }
                    const canBook = !isCancelled && !massStarted;

                    return (
                      <button
                        key={mass.id}
                        disabled={!canBook}
                        onClick={() =>
                          setSelectedMassId(isSelected ? null : mass.id)
                        }
                        className={cn(
                          "w-full text-left rounded-lg border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : canBook
                              ? "hover:border-primary/50 hover:bg-accent"
                              : "opacity-50 cursor-not-allowed bg-muted/30",
                        )}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="font-semibold text-sm">
                                {mass.time}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatMassType(mass.massType)}
                              {mass.language ? ` · ${mass.language}` : ""}
                            </p>
                            {mass.celebrant && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {mass.celebrant}
                              </p>
                            )}
                            {mass.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {mass.location}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0">
                            {isCancelled ? (
                              <Badge variant="outline" className="text-xs">
                                Cancelled
                              </Badge>
                            ) : massStarted ? (
                              <Badge variant="secondary" className="text-xs">
                                Started
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs">
                                {mass.intentions.length} intention{mass.intentions.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Intention count */}
                        {!isCancelled && mass.intentions.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground">
                              {mass.intentions.length} intention{mass.intentions.length !== 1 ? "s" : ""} booked
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}

                {/* Book CTA */}
                {selectedMassId && selectedMass && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-sm font-medium">Ready to book?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(selectedDate, "d MMM")} · {selectedMass.time}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setIsBookingOpen(true)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Book Intention
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* How it works */}
          <Card className="bg-muted/40">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                How to book
              </p>
              <ol className="space-y-2 text-sm text-muted-foreground list-none">
                {[
                  "Select the parish or outstation for the mass",
                  "Click a future date on the calendar",
                  "Choose an available mass time",
                  "Fill in your intention and submit",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* My Intentions */}
      {intentions.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => setShowMyIntentions((v) => !v)}>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">My Intentions</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {intentions.length}
                </Badge>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  showMyIntentions && "rotate-180",
                )}
              />
            </button>
          </CardHeader>
          {showMyIntentions && (
            <CardContent className="pt-4">
              <div className="space-y-3">
                {intentions.map((intention) => {
                  const cfg = STATUS_CONFIG[intention.status] || {
                    label: intention.status,
                    variant: "outline" as const,
                  };
                  return (
                    <div
                      key={intention.id}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3">
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {intention.intention}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>
                            {INTENTION_TYPE_LABELS[intention.intentionType] ||
                              intention.intentionType}
                          </span>
                          {intention.mass && (
                            <>
                              <span>·</span>
                              <span>
                                {format(
                                  new Date(intention.mass.date),
                                  "d MMM yyyy",
                                )}
                              </span>
                              <span>·</span>
                              <span>{intention.mass.time}</span>
                            </>
                          )}
                        </div>
                        {intention.requestedBy && (
                          <p className="text-xs text-muted-foreground">
                            Requested by: {intention.requestedBy}
                          </p>
                        )}
                      </div>
                      <Badge variant={cfg.variant} className="text-xs shrink-0">
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={isBookingOpen && !!selectedDate && !!selectedMass}
        onClose={() => setIsBookingOpen(false)}
        title={`Book Mass Intention — ${selectedDate ? format(selectedDate, "d MMM yyyy") : ""} at ${selectedMass?.time ?? ""}`}>
        {selectedDate && selectedMass && (
          <MassIntentionForm
            organizationId={selectedOrganizationId}
            defaultValues={{
              massDate: selectedDate,
              massId: selectedMassId || undefined,
            }}
            onSuccess={() => {
              setIsBookingOpen(false);
              setSelectedDate(null);
              setSelectedMassId(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
