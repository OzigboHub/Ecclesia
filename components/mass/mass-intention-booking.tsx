"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getMasses } from "@/app/actions/mass.actions";
import { createMassIntention } from "@/app/actions/mass-intention.actions";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

// Define schema locally or import.
// Note: We need massId now.
const bookingSchema = z.object({
  intention: z.string().min(5),
  intentionType: z.enum(["THANKSGIVING", "REQUIEM", "SPECIAL_INTENTION"]),
  requestedBy: z.string().min(2),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  massId: z.string().min(1, "Please select a mass"),
  stipend: z.coerce.number().min(0).optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

export function MassIntentionBooking() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [availableMasses, setAvailableMasses] = useState<any[]>([]);
  const [loadingMasses, setLoadingMasses] = useState(false);

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      intentionType: "SPECIAL_INTENTION",
    },
  });

  useEffect(() => {
    if (date) {
      loadMasses(date);
    }
  }, [date]);

  const loadMasses = async (selectedDate: Date) => {
    setLoadingMasses(true);
    // Reset massId when date changes
    form.setValue("massId", "");
    const res = await getMasses(selectedDate);
    if (res.success) {
      // Filter for future and valid masses if public, or just all for admin?
      // For booking, we likely want valid scheduled masses.
      setAvailableMasses(
        res.data.filter(
          (m: any) => m.status === "SCHEDULED" || m.status === "RESCHEDULED",
        ),
      );
    }
    setLoadingMasses(false);
  };

  const onSubmit = async (data: BookingForm) => {
    const res = await createMassIntention(data);
    if (res.success) {
      toast.success("Intention booked successfully!");
      form.reset();
      loadMasses(date!); // Refresh availability
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-8">
      <div>
        <h3 className="font-semibold mb-4">Select Date</h3>
        <div className="border rounded-md p-3 inline-block">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            fromDate={new Date()} // Prevent past dates booking
            className="rounded-md"
          />
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold">Book Mass Intention</h2>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-w-lg">
            {/* Mass Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Available Masses</label>
              {loadingMasses ? (
                <div className="text-sm text-muted-foreground">
                  Loading masses...
                </div>
              ) : availableMasses.length === 0 ? (
                <div className="text-sm text-yellow-600">
                  No available masses for this date.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {availableMasses.map((mass) => {
                    return (
                      <div
                        key={mass.id}
                        className={`border p-3 rounded-md cursor-pointer flex justify-between items-center ${form.watch("massId") === mass.id ? "border-primary bg-primary/5 ring-1 ring-primary" : ""} hover:bg-accent`}
                        onClick={() => form.setValue("massId", mass.id)}>
                        <div>
                          <div className="font-semibold">
                            {mass.time} - {mass.massType.replace("_", " ")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {mass.language}
                          </div>
                        </div>
                        <div className="h-4 w-4 rounded-full border border-primary flex items-center justify-center">
                          {form.watch("massId") === mass.id && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {form.formState.errors.massId && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.massId.message}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="intention"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intention</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter your prayer intention..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="intentionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="THANKSGIVING">Thanksgiving</SelectItem>
                      <SelectItem value="REQUIEM">Requiem</SelectItem>
                      <SelectItem value="SPECIAL_INTENTION">
                        Special Intention
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requestedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested By</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stipend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stipend (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={!form.watch("massId") || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Booking..." : "Book Intention"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
