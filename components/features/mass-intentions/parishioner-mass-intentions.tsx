"use client";

import { useState, useMemo, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMassIntention } from "@/app/actions/mass-intention.actions";
import {
  createMassIntentionSchema,
  type CreateMassIntentionInput,
} from "@/lib/validators/mass-intention.schema";
import { format, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  Church,
  Clock,
  MapPin,
  User,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";

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

interface ParishionerMassIntentionsProps {
  masses: MassWithIntentions[];
  intentions: MassIntention[];
}

const INTENTION_TYPE_LABELS: Record<string, string> = {
  THANKSGIVING: "Thanksgiving",
  REQUIEM: "Requiem",
  SPECIAL_INTENTION: "Special Intention",
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

export function ParishionerMassIntentions({
  masses,
  intentions,
}: ParishionerMassIntentionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedMass, setSelectedMass] = useState<MassWithIntentions | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  // Filter to only upcoming masses whose start time hasn't passed
  const upcomingMasses = useMemo(() => {
    const now = new Date();
    return masses.filter((mass) => {
      if (mass.status === "CANCELLED") return false;
      const massDate = new Date(mass.date);
      // Past dates entirely
      if (massDate < new Date(now.toDateString())) return false;
      // For today, check time
      if (massDate.toDateString() === now.toDateString() && mass.time) {
        const [h, m] = mass.time.split(":").map(Number);
        const massStart = new Date(massDate);
        massStart.setHours(h, m, 0, 0);
        if (now >= massStart) return false;
      }
      return true;
    });
  }, [masses]);

  // Group masses by date
  const massesByDate = useMemo(() => {
    const grouped = new Map<string, MassWithIntentions[]>();
    for (const mass of upcomingMasses) {
      const key = format(new Date(mass.date), "yyyy-MM-dd");
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(mass);
    }
    return grouped;
  }, [upcomingMasses]);

  const form = useForm<CreateMassIntentionInput>({
    resolver: zodResolver(createMassIntentionSchema),
    defaultValues: {
      intention: "",
      intentionType: "THANKSGIVING",
      requestedBy: session?.user?.name || "",
      contactEmail: session?.user?.email || "",
      contactPhone: "",
      massId: "",
      stipend: undefined,
      parishionerId: session?.user?.parishionerId || "",
      notes: "",
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

  const openBookingModal = (mass: MassWithIntentions) => {
    setSelectedMass(mass);
    setValue("massId", mass.id);
    setValue("requestedBy", session?.user?.name || "");
    setValue("contactEmail", session?.user?.email || "");
    setValue("parishionerId", session?.user?.parishionerId || "");
    setValue(
      "notes",
      `Booked for ${mass.time} ${mass.massType.replace(/_/g, " ")} mass`,
    );
  };

  const closeModal = () => {
    setSelectedMass(null);
    reset();
  };

  const onSubmit = (data: CreateMassIntentionInput) => {
    startTransition(async () => {
      const result = await createMassIntention(data);
      if (result.success) {
        toast.success(result.message);
        closeModal();
        router.refresh();
      } else {
        toast.error(result.message);
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
    <div className="space-y-6">
      {/* Upcoming Masses */}
      {upcomingMasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              No upcoming masses available for booking.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Check back later or contact the parish office.
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(massesByDate.entries()).map(([dateKey, dateMasses]) => {
          const date = new Date(dateMasses[0].date);
          const isToday = isSameDay(date, new Date());

          return (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">
                  {isToday ? "Today" : format(date, "EEEE, MMMM d, yyyy")}
                </h3>
                {isToday && (
                  <Badge variant="secondary" className="text-xs">
                    Today
                  </Badge>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {dateMasses.map((mass) => (
                  <Card
                    key={mass.id}
                    className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-semibold">{mass.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {mass.massType.replace(/_/g, " ")}
                          </p>
                          {mass.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {mass.location}
                            </p>
                          )}
                          {mass.celebrant && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3 shrink-0" />
                              {mass.celebrant}
                            </p>
                          )}
                          {mass.language && (
                            <p className="text-xs text-muted-foreground">
                              {mass.language}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {mass.intentions.length} intention
                          {mass.intentions.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => openBookingModal(mass)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Book Intention
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* My Intentions */}
      {intentions.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">My Intentions</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {intentions.length}
              </Badge>
            </div>
          </CardHeader>
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
                    </div>
                    <Badge variant={cfg.variant} className="text-xs shrink-0">
                      {cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={!!selectedMass}
        onClose={closeModal}
        title={
          selectedMass
            ? `Book Intention — ${format(new Date(selectedMass.date), "d MMM yyyy")} at ${selectedMass.time}`
            : ""
        }>
        {selectedMass && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Selected mass info */}
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">
                  {format(new Date(selectedMass.date), "MMMM d, yyyy")} ·{" "}
                  {selectedMass.time}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedMass.massType.replace(/_/g, " ")}
                {selectedMass.location ? ` · ${selectedMass.location}` : ""}
              </p>
            </div>

            {/* Intention Details */}
            <div className="space-y-2">
              <Label htmlFor="intention">Intention Details *</Label>
              <Textarea
                id="intention"
                {...register("intention")}
                placeholder="E.g. For the soul of... / In thanksgiving for..."
                disabled={isPending}
                className="min-h-25"
              />
              {errors.intention && (
                <p className="text-sm text-destructive">
                  {errors.intention.message}
                </p>
              )}
            </div>

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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Requested By - locked */}
              <div className="space-y-2">
                <Label htmlFor="requestedBy">Requested By</Label>
                <Input
                  id="requestedBy"
                  {...register("requestedBy")}
                  disabled
                  readOnly
                  className="bg-muted/40"
                />
              </div>

              {/* Contact Email - locked */}
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...register("contactEmail")}
                  disabled
                  readOnly
                  className="bg-muted/40"
                />
              </div>
            </div>

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

            {/* Submit */}
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Booking..." : "Book Intention"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
