"use client";

import { setAppointmentBookingWindow } from "@/app/actions/appointment.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface AppointmentBookingWindowProps {
  initialOpenAt: Date | string | null;
  initialCloseAt: Date | string | null;
}

function toDateTimeLocal(value: Date | string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function AppointmentBookingWindow({
  initialOpenAt,
  initialCloseAt,
}: AppointmentBookingWindowProps) {
  const [isPending, startTransition] = useTransition();
  const [openAt, setOpenAt] = useState(toDateTimeLocal(initialOpenAt));
  const [closeAt, setCloseAt] = useState(toDateTimeLocal(initialCloseAt));

  const handleSave = () => {
    startTransition(async () => {
      const result = await setAppointmentBookingWindow({
        appointmentBookingOpensAt: openAt || null,
        appointmentBookingClosesAt: closeAt || null,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  };

  return (
    <div className="rounded-lg border bg-background p-4 space-y-3">
      <div>
        <h2 className="text-base font-semibold">Appointment Booking Window</h2>
        <p className="text-xs text-muted-foreground">
          Set on/off booking dates for appointments.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="booking-open-at">Open From</Label>
          <Input
            id="booking-open-at"
            type="datetime-local"
            value={openAt}
            onChange={(event) => setOpenAt(event.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="booking-close-at">Close At</Label>
          <Input
            id="booking-close-at"
            type="datetime-local"
            value={closeAt}
            onChange={(event) => setCloseAt(event.target.value)}
            disabled={isPending}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Booking Window"}
        </Button>
      </div>
    </div>
  );
}
