"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateMass, deleteMass } from "@/app/actions/mass.actions";
import { toast } from "sonner";
import { Edit2, Trash2, CalendarIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const massEditSchema = z.object({
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  date: z.date(),
  massType: z.string(),
  status: z.enum([
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "RESCHEDULED",
  ]),
  celebrant: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  maxIntentions: z.number().min(1),
});

type MassEditInput = z.infer<typeof massEditSchema>;

interface MassEditDialogProps {
  mass: any;
  onSuccess?: () => void;
}

export function MassEditDialog({ mass, onSuccess }: MassEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MassEditInput>({
    resolver: zodResolver(massEditSchema),
    defaultValues: {
      time: mass.time,
      date: new Date(mass.date),
      massType: mass.massType,
      status: mass.status as any,
      celebrant: mass.celebrant || "",
      location: mass.location || "",
      notes: mass.notes || "",
      maxIntentions: Number(mass.maxIntentions) || 1,
    },
  });

  const selectedDate = watch("date");

  const onSubmit = async (data: MassEditInput) => {
    setIsPending(true);
    try {
      const res = await updateMass(mass.id, data);
      if (res.success) {
        toast.success("Mass updated successfully");
        setIsOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Failed to update mass");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const res = await deleteMass(mass.id);
      if (res.success) {
        toast.success("Mass deleted successfully");
        setIsOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Failed to delete mass");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Edit Mass</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setValue("date", d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time (HH:mm)</label>
              <Input {...register("time")} placeholder="06:00" />
              {errors.time && (
                <p className="text-xs text-destructive">
                  {errors.time.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              onValueChange={(v) => setValue("status", v as any)}
              defaultValue={mass.status}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-primary">
                {[
                  "SCHEDULED",
                  "IN_PROGRESS",
                  "COMPLETED",
                  "CANCELLED",
                  "RESCHEDULED",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Celebrant</label>
            <Input
              {...register("celebrant")}
              placeholder="e.g. Rev. Fr. John Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Input {...register("location")} placeholder="Main Church" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Intentions</label>
              <Input
                type="number"
                {...register("maxIntentions", { valueAsNumber: true })}
              />
              {errors.maxIntentions && (
                <p className="text-xs text-destructive">
                  {errors.maxIntentions.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mass Type</label>
              <Select
                onValueChange={(v) => setValue("massType", v)}
                defaultValue={mass.massType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-primary">
                  {[
                    "DAILY_MASS",
                    "SUNDAY_MASS",
                    "HOLY_DAY_MASS",
                    "SPECIAL_MASS",
                    "WEDDING_MASS",
                    "FUNERAL_MASS",
                    "THANKSGIVING_MASS",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea {...register("notes")} placeholder="Optional notes" />
          </div>

          <div className="flex justify-between gap-2 pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  disabled={isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this mass. If there are
                    intentions booked, you cannot delete it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
