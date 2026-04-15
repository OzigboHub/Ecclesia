"use client";

import { setAppointmentDayUnavailable } from "@/app/actions/appointment.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

interface AppointmentBookingWindowProps {
  initialOpenAt: Date | string | null;
  initialCloseAt: Date | string | null;
  initialUnavailableDays: string[];
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildUpcomingWeekdays(totalDays: number): Date[] {
  const dates: Date[] = [];
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (dates.length < totalDays) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) {
      dates.push(new Date(cursor));
    }
    cursor = addDays(cursor, 1);
  }

  return dates;
}

export function AppointmentBookingWindow({
  initialOpenAt: _initialOpenAt,
  initialCloseAt: _initialCloseAt,
  initialUnavailableDays,
}: AppointmentBookingWindowProps) {
  const [isPending, startTransition] = useTransition();
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(
    new Set(initialUnavailableDays),
  );

  const upcomingWeekdays = useMemo(() => buildUpcomingWeekdays(20), []);

  const handleToggleDate = (dateKey: string, currentlyUnavailable: boolean) => {
    startTransition(async () => {
      const result = await setAppointmentDayUnavailable({
        date: dateKey,
        unavailable: !currentlyUnavailable,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setUnavailableDates((prev) => {
        const next = new Set(prev);
        if (currentlyUnavailable) {
          next.delete(dateKey);
        } else {
          next.add(dateKey);
        }
        return next;
      });

      toast.success(result.message);
    });
  };

  return (
    <div className="rounded-lg border bg-background p-4 space-y-4">
      <div>
        <h2 className="text-base font-semibold">
          Appointment Booking Availability
        </h2>
        <p className="text-xs text-muted-foreground">
          Default booking slots are automatically available Monday to Friday,
          9:00 AM to 3:00 PM. Click a day below to set it unavailable.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {upcomingWeekdays.map((date) => {
          const dateKey = toDateKey(date);
          const isUnavailable = unavailableDates.has(dateKey);

          return (
            <div
              key={dateKey}
              className={cn(
                "rounded-md border p-3 flex items-center justify-between gap-2",
                isUnavailable && "border-destructive/40 bg-destructive/5",
              )}>
              <div>
                <p className="text-sm font-medium">
                  {format(date, "EEE, d MMM")}
                </p>
                <p className="text-xs text-muted-foreground">
                  9:00 AM - 3:00 PM
                </p>
              </div>
              <Button
                type="button"
                variant={isUnavailable ? "outline" : "secondary"}
                size="sm"
                onClick={() => handleToggleDate(dateKey, isUnavailable)}
                disabled={isPending}>
                {isUnavailable ? "Set Available" : "Set Unavailable"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Unavailable days in view: {unavailableDates.size}
      </div>

      <div className="rounded-md bg-muted/40 p-3">
        <p className="text-xs text-muted-foreground">
          Calendar booking view has been removed. Appointment availability is
          now controlled by weekday defaults and per-day availability toggles.
        </p>
      </div>

      <div className="flex justify-end">
        <div className="text-xs text-muted-foreground">
          {isPending ? "Saving changes..." : "Changes save immediately"}
        </div>
      </div>
    </div>
  );
}
