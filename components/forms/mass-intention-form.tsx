"use client";

import { createMassIntention } from "@/app/actions/mass-intention.actions";
import { getMasses } from "@/app/actions/mass.actions";
import { getParishioners } from "@/app/actions/parishioner.actions";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createMassIntentionSchema,
  type CreateMassIntentionInput,
} from "@/lib/validators/mass-intention.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface MassIntentionFormProps {
  onSuccess?: () => void;
  organizationId?: string; // Selected organization from calendar
  defaultValues?: {
    massDate?: Date;
    timeSlot?: string;
    massId?: string; // Pre-selected mass from calendar
  };
}

type Parishioner = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
};

export function MassIntentionForm({
  onSuccess,
  organizationId,
  defaultValues: calendarDefaults,
}: MassIntentionFormProps) {
  const { data: session } = useSession();
  const isParishioner = session?.user?.role === "PARISHIONER";
  const initialSelectedDate = calendarDefaults?.massDate
    ? new Date(calendarDefaults.massDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const [isPending, startTransition] = useTransition();
  const [parishioners, setParishioners] = useState<Parishioner[]>([]);
  const [isLoadingParishioners, setIsLoadingParishioners] = useState(true);
  const [availableMasses, setAvailableMasses] = useState<any[]>([]);
  const [isLoadingMasses, setIsLoadingMasses] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);
  const router = useRouter();

  const form = useForm<CreateMassIntentionInput>({
    resolver: zodResolver(createMassIntentionSchema),
    defaultValues: {
      intention: "",
      intentionType: "THANKSGIVING",
      requestedBy: session?.user?.name || "",
      contactEmail: session?.user?.email || "",
      contactPhone: "",
      massId: calendarDefaults?.massId || "",
      stipend: undefined,
      parishionerId: session?.user?.parishionerId || "",
      notes: calendarDefaults?.timeSlot
        ? `Booked for ${calendarDefaults.timeSlot} mass`
        : "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    setValue,
    reset,
  } = form;

  // Load parishioners on mount
  useEffect(() => {
    if (isParishioner) {
      setIsLoadingParishioners(false);
      if (session?.user?.parishionerId) {
        setValue("parishionerId", session.user.parishionerId);
      }
      if (session?.user?.name) {
        setValue("requestedBy", session.user.name);
      }
      if (session?.user?.email) {
        setValue("contactEmail", session.user.email);
      }
      return;
    }

    async function loadParishioners() {
      setIsLoadingParishioners(true);
      const result = await getParishioners();
      if (result.success && result.data) {
        setParishioners(result.data);
      }
      setIsLoadingParishioners(false);
    }
    loadParishioners();
  }, [isParishioner, session, setValue]);

  // Load available masses when date changes
  useEffect(() => {
    async function loadMasses() {
      setIsLoadingMasses(true);
      const shouldPreserveSelectedMass =
        selectedDate === initialSelectedDate && !!calendarDefaults?.massId;
      setValue(
        "massId",
        shouldPreserveSelectedMass ? calendarDefaults.massId! : "",
      );
      const result = await getMasses(selectedDate, organizationId);
      if (result.success && result.data) {
        const now = new Date();
        setAvailableMasses(
          result.data.filter((m: any) => {
            if (m.status === "CANCELLED") return false;
            // For today's masses, only show those that haven't started yet
            const massDate = new Date(m.date);
            const isToday = massDate.toDateString() === now.toDateString();
            if (isToday && m.time) {
              const [h, m2] = m.time.split(":").map(Number);
              const massStart = new Date(massDate);
              massStart.setHours(h, m2, 0, 0);
              if (now >= massStart) return false;
            }
            return true;
          }),
        );
      }
      setIsLoadingMasses(false);
    }
    loadMasses();
  }, [
    calendarDefaults?.massId,
    initialSelectedDate,
    organizationId,
    selectedDate,
    setValue,
  ]);

  const onSubmit = (data: CreateMassIntentionInput) => {
    startTransition(async () => {
      const result = await createMassIntention(data);

      if (result.success) {
        toast.success(result.message);
        reset();
        router.refresh();
        onSuccess?.();
      } else {
        toast.error(result.message);

        // Set server-side validation errors on fields
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            setError(field as keyof CreateMassIntentionInput, {
              type: "server",
              message: messages[0],
            });
          });
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Intention Details */}
      <div className="space-y-2">
        <Label htmlFor="intention">Intention Details *</Label>
        <Textarea
          id="intention"
          {...register("intention")}
          placeholder="E.g. For the soul of... / In thanksgiving for..."
          disabled={isPending}
          className="min-h-25"
          aria-invalid={!!errors.intention}
          aria-describedby={errors.intention ? "intention-error" : undefined}
        />
        {errors.intention && (
          <p id="intention-error" className="text-sm text-destructive">
            {errors.intention.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Intention Type */}
        <div className="space-y-2">
          <Label htmlFor="intentionType">Intention Type *</Label>
          <Controller
            name="intentionType"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPending}>
                <SelectTrigger id="intentionType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-primary">
                  <SelectItem value="THANKSGIVING">Thanksgiving</SelectItem>
                  <SelectItem value="REQUIEM">
                    Requiem (For the Dead)
                  </SelectItem>
                  <SelectItem value="SPECIAL_INTENTION">
                    Special Intention
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.intentionType && (
            <p className="text-sm text-destructive">
              {errors.intentionType.message}
            </p>
          )}
        </div>

        {/* Requested By */}
        <div className="space-y-2">
          <Label htmlFor="requestedBy">Requested By *</Label>
          <Input
            id="requestedBy"
            {...register("requestedBy")}
            placeholder="Name of requester"
            disabled={isPending || isParishioner}
            readOnly={isParishioner}
            aria-invalid={!!errors.requestedBy}
            aria-describedby={
              errors.requestedBy ? "requestedBy-error" : undefined
            }
            className={isParishioner ? "bg-muted/40" : ""}
          />
          {errors.requestedBy && (
            <p id="requestedBy-error" className="text-sm text-destructive">
              {errors.requestedBy.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Mass Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="massDate">Preferred Date *</Label>
          <Input
            id="massDate"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={isPending}
          />
        </div>

        {/* Mass Selection */}
        <div className="space-y-2">
          <Label htmlFor="massId">Select Mass *</Label>
          <Controller
            name="massId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPending || isLoadingMasses}>
                <SelectTrigger id="massId">
                  <SelectValue
                    placeholder={
                      isLoadingMasses
                        ? "Loading masses..."
                        : availableMasses.length === 0
                          ? "No masses available"
                          : "Select a mass"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-primary">
                  {availableMasses.map((mass) => (
                    <SelectItem key={mass.id} value={mass.id}>
                      {mass.time} - {mass.massType.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.massId && (
            <p className="text-sm text-destructive">{errors.massId.message}</p>
          )}
        </div>

        {/* Stipend */}
        <div className="space-y-2">
          <Label htmlFor="stipend">
            Stipend Amount (Optional) — Auto-creates Payment
          </Label>
          <p className="text-xs text-muted-foreground">
            If provided, a payment record will be automatically created and
            linked to this intention
          </p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₦
            </span>
            <Input
              id="stipend"
              type="number"
              step="0.01"
              min="0"
              {...register("stipend", { valueAsNumber: true })}
              className="pl-8"
              placeholder="0.00"
              disabled={isPending}
              aria-describedby="stipend-helper"
            />
          </div>
          <p id="stipend-helper" className="text-xs text-muted-foreground">
            Payment will be recorded with receipt number automatically.
          </p>
          {errors.stipend && (
            <p className="text-sm text-destructive">{errors.stipend.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Contact Phone */}
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input
            id="contactPhone"
            type="tel"
            {...register("contactPhone")}
            placeholder="e.g., 08012345678"
            disabled={isPending}
          />
          {errors.contactPhone && (
            <p className="text-sm text-destructive">
              {errors.contactPhone.message}
            </p>
          )}
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            {...register("contactEmail")}
            placeholder="email@example.com"
            disabled={isPending || isParishioner}
            readOnly={isParishioner}
            className={isParishioner ? "bg-muted/40" : ""}
          />
          {errors.contactEmail && (
            <p className="text-sm text-destructive">
              {errors.contactEmail.message}
            </p>
          )}
        </div>
      </div>

      {/* Parishioner Selection (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="parishionerId">Link to Parishioner (Optional)</Label>
        {isParishioner ? (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            This booking will be linked to your parishioner record
            automatically.
          </div>
        ) : (
          <>
            <Controller
              name="parishionerId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(val) =>
                    field.onChange(val === "none" ? "" : val)
                  }
                  disabled={isPending || isLoadingParishioners}>
                  <SelectTrigger id="parishionerId">
                    <SelectValue
                      placeholder={
                        isLoadingParishioners
                          ? "Loading parishioners..."
                          : "Select parishioner (optional)"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {parishioners.map((parishioner) => (
                      <SelectItem key={parishioner.id} value={parishioner.id}>
                        {parishioner.firstName} {parishioner.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.parishionerId && (
              <p className="text-sm text-destructive">
                {errors.parishionerId.message}
              </p>
            )}
          </>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Any additional information..."
          disabled={isPending}
          rows={3}
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isPending}>
          Reset
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Booking..." : "Book Intention"}
        </Button>
      </div>
    </form>
  );
}
