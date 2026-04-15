"use client";

import { createMass } from "@/app/actions/mass.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MASS_TYPES = [
  "DAILY_MASS",
  "SUNDAY_MASS",
  "HOLY_DAY_MASS",
  "SPECIAL_MASS",
  "WEDDING_MASS",
  "FUNERAL_MASS",
  "THANKSGIVING_MASS",
] as const;

export function MassCreateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    massType: "DAILY_MASS",
    language: "English",
    location: "Main Church",
    celebrant: "",
    maxIntentions: "1",
  });

  const handleSubmit = async () => {
    if (!formData.date || !formData.time || !formData.massType) {
      toast.error("Date, time and mass type are required");
      return;
    }

    setIsPending(true);
    try {
      const result = await createMass({
        date: formData.date,
        time: formData.time,
        massType: formData.massType,
        language: formData.language || undefined,
        location: formData.location || undefined,
        celebrant: formData.celebrant || undefined,
        maxIntentions: Math.max(1, Number(formData.maxIntentions) || 1),
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsOpen(false);
      setFormData({
        date: "",
        time: "",
        massType: "DAILY_MASS",
        language: "English",
        location: "Main Church",
        celebrant: "",
        maxIntentions: "1",
      });
      window.location.reload();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Mass
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Create Single Mass</DialogTitle>
          <DialogDescription>
            Create one mass for a specific day and time. A maximum of five
            masses can exist per day with different times.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="mass-date">Date</Label>
            <Input
              id="mass-date"
              type="date"
              value={formData.date}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, date: event.target.value }))
              }
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <TimePicker
              value={formData.time}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, time: value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Mass Type</Label>
            <Select
              value={formData.massType}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, massType: value }))
              }
              disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select mass type" />
              </SelectTrigger>
              <SelectContent className="bg-primary">
                {MASS_TYPES.map((massType) => (
                  <SelectItem key={massType} value={massType}>
                    {massType.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mass-max-intentions">Max Intentions</Label>
            <Input
              id="mass-max-intentions"
              type="number"
              min={1}
              value={formData.maxIntentions}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  maxIntentions: event.target.value,
                }))
              }
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mass-language">Language</Label>
            <Input
              id="mass-language"
              value={formData.language}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  language: event.target.value,
                }))
              }
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mass-location">Location</Label>
            <Input
              id="mass-location"
              value={formData.location}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  location: event.target.value,
                }))
              }
              disabled={isPending}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="mass-celebrant">Celebrant</Label>
            <Input
              id="mass-celebrant"
              value={formData.celebrant}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  celebrant: event.target.value,
                }))
              }
              disabled={isPending}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Creating..." : "Create Mass"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
