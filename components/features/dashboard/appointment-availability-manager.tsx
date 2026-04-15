"use client";

import {
  createAppointmentAvailability,
  deleteAppointmentAvailability,
  setAppointmentAvailabilityStatus,
} from "@/app/actions/appointment.actions";
import { getStaffMembers } from "@/app/actions/user.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAppointmentAvailabilitySchema } from "@/lib/validators/appointment.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarPlus, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

type AvailabilityFormValues = z.input<
  typeof createAppointmentAvailabilitySchema
>;

type AppointmentAvailabilityItem = {
  id: string;
  title: string;
  type: string;
  startTime: Date | string;
  endTime: Date | string;
  maxBookings: number;
  isActive: boolean;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  appointments: Array<{
    id: string;
    source: string;
    publicRequesterName: string | null;
    status: string;
    parishioner: {
      firstName: string;
      lastName: string;
    } | null;
  }>;
};

type StaffMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

interface AppointmentAvailabilityManagerProps {
  initialAvailabilities: AppointmentAvailabilityItem[];
}

export function AppointmentAvailabilityManager({
  initialAvailabilities,
}: AppointmentAvailabilityManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(createAppointmentAvailabilitySchema),
    defaultValues: {
      title: "",
      type: "MEETING",
      startTime: "",
      endTime: "",
      assignedToId: null,
      maxBookings: 1,
    },
  });

  useEffect(() => {
    async function loadStaff() {
      const result = await getStaffMembers();
      if (result.success && result.data) {
        setStaffMembers(result.data);
      }
      setIsLoadingStaff(false);
    }

    loadStaff();
  }, []);

  const onSubmit = (data: AvailabilityFormValues) => {
    startTransition(async () => {
      const result = await createAppointmentAvailability(data);

      if (!result.success) {
        toast.error(result.message);
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof AvailabilityFormValues, {
              type: "server",
              message: messages[0],
            });
          });
        }
        return;
      }

      toast.success(result.message);
      form.reset({
        title: "",
        type: "MEETING",
        startTime: "",
        endTime: "",
        assignedToId: null,
        maxBookings: 1,
      });
      router.refresh();
    });
  };

  const handleToggle = (id: string, isActive: boolean) => {
    startTransition(async () => {
      const result = await setAppointmentAvailabilityStatus(id, isActive);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteAppointmentAvailability(id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 rounded-lg border bg-background p-4">
      <div>
        <h2 className="text-base font-semibold">Public Appointment Slots</h2>
        <p className="text-xs text-muted-foreground">
          Publish specific appointment times that public visitors can book.
        </p>
      </div>

      <form
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate>
        <div className="space-y-1 xl:col-span-2">
          <Label htmlFor="availability-title">Title</Label>
          <Input
            id="availability-title"
            placeholder="Marriage counseling"
            {...form.register("title")}
            disabled={isPending}
          />
          {form.formState.errors.title && (
            <p className="text-xs text-destructive">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="availability-type">Type</Label>
          <Controller
            name="type"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPending}>
                <SelectTrigger id="availability-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFESSION">Confession</SelectItem>
                  <SelectItem value="COUNSELING">Counseling</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="availability-start">Start</Label>
          <Input
            id="availability-start"
            type="datetime-local"
            {...form.register("startTime")}
            disabled={isPending}
          />
          {form.formState.errors.startTime && (
            <p className="text-xs text-destructive">
              {form.formState.errors.startTime.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="availability-end">End</Label>
          <Input
            id="availability-end"
            type="datetime-local"
            {...form.register("endTime")}
            disabled={isPending}
          />
          {form.formState.errors.endTime && (
            <p className="text-xs text-destructive">
              {form.formState.errors.endTime.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="availability-max-bookings">Capacity</Label>
          <Input
            id="availability-max-bookings"
            type="number"
            min={1}
            max={50}
            {...form.register("maxBookings", {
              valueAsNumber: true,
            })}
            disabled={isPending}
          />
          {form.formState.errors.maxBookings && (
            <p className="text-xs text-destructive">
              {form.formState.errors.maxBookings.message}
            </p>
          )}
        </div>

        <div className="space-y-1 md:col-span-2 xl:col-span-3">
          <Label htmlFor="availability-assigned-to">Assigned Staff</Label>
          <Controller
            name="assignedToId"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(value) =>
                  field.onChange(value === "none" ? null : value)
                }
                disabled={isPending || isLoadingStaff}>
                <SelectTrigger id="availability-assigned-to">
                  <SelectValue
                    placeholder={
                      isLoadingStaff
                        ? "Loading staff..."
                        : "Optional staff assignee"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No assignee</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.firstName} {staff.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="md:col-span-2 xl:col-span-3 flex items-end justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full md:w-auto">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="mr-2 h-4 w-4" />
            )}
            Add Public Slot
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {initialAvailabilities.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No public appointment slots yet.
          </p>
        ) : (
          initialAvailabilities.map((slot) => {
            const bookingCount = slot.appointments.length;
            const remaining = Math.max(slot.maxBookings - bookingCount, 0);

            return (
              <div key={slot.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{slot.title}</h3>
                      <Badge variant={slot.isActive ? "success" : "secondary"}>
                        {slot.isActive ? "Open" : "Closed"}
                      </Badge>
                      <Badge variant="outline">
                        {slot.type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(slot.startTime),
                        "EEE, MMM d, yyyy · h:mm a",
                      )}{" "}
                      - {format(new Date(slot.endTime), "h:mm a")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {slot.assignedTo
                        ? `Assigned to ${slot.assignedTo.firstName} ${slot.assignedTo.lastName}`
                        : "No staff assignee"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bookingCount} / {slot.maxBookings} booked, {remaining}{" "}
                      remaining
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleToggle(slot.id, !slot.isActive)}>
                      {slot.isActive ? "Close Slot" : "Reopen Slot"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={isPending || bookingCount > 0}
                      onClick={() => handleDelete(slot.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
