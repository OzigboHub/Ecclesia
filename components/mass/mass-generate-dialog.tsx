"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Wand2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { runMassGeneration } from "@/app/actions/mass.actions";
import { toast } from "sonner";

export function MassGenerateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30),
  });

  const handleGenerate = async () => {
    if (!range?.from || !range?.to) {
      toast.error("Please select a date range");
      return;
    }

    setIsPending(true);
    try {
      const res = await runMassGeneration(range.from, range.to);
      if (res.success) {
        toast.success(res.message);
        setIsOpen(false);
        window.location.reload();
      } else {
        toast.error(res.message);
        return;
      }
    } catch (error) {
      toast.error("An error occurred during generation");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Masses
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Generate Masses</DialogTitle>
          <DialogDescription>
            Select a date range to generate masses. Active templates are used
            first. If none exist, the system can infer a repeatable schedule
            from existing manually created masses.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={1}
            disabled={(date) => date < addDays(new Date(), -1)}
          />
          {range?.from && range?.to && (
            <div className="text-sm font-medium">
              {format(range.from, "PP")} - {format(range.to, "PP")}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? "Generating..." : "Generate Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
