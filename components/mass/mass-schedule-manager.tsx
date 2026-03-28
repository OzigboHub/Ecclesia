"use client";

import { useState, useEffect, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  getMassScheduleTemplates,
  createMassScheduleTemplate,
  deleteMassScheduleTemplate,
  type MassScheduleTemplateInput,
} from "@/app/actions/mass-schedule.actions";
import { MassScheduleTemplate } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod"; // Reuse or redefine schema constraints
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

// Copied schema for client-side form validation (can import if shared)
const templateSchema = z.object({
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  massType: z.enum([
    "DAILY_MASS",
    "SUNDAY_MASS",
    "HOLY_DAY_MASS",
    "SPECIAL_MASS",
    "WEDDING_MASS",
    "FUNERAL_MASS",
    "THANKSGIVING_MASS",
  ]),
  language: z.string().optional(),
  location: z.string().optional(),
});

type FormData = z.infer<typeof templateSchema>;

export function MassScheduleManager() {
  const [templates, setTemplates] = useState<MassScheduleTemplate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      massType: "DAILY_MASS",
      language: "English",
      location: "Main Church",
    },
  });

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const res = await getMassScheduleTemplates();
    if (res.success && res.data) {
      setTemplates(res.data);
    } else {
      toast.error(res.message || "Failed to load templates");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const onSubmit = async (data: FormData) => {
    const res = await createMassScheduleTemplate({ ...data, isActive: true });
    if (res.success) {
      toast.success("Template created");
      setIsOpen(false);
      form.reset();
      loadTemplates();
    } else {
      toast.error(res.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await deleteMassScheduleTemplate(id);
    if (res.success) {
      toast.success("Template deleted");
      loadTemplates();
    } else {
      toast.error(res.message);
    }
  };

  const days = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Weekly Schedule Templates</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Mass Schedule Template</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Day of Week</label>
                  <Controller
                    name="dayOfWeek"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent className="bg-primary">
                          {days.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.dayOfWeek && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.dayOfWeek.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Time (HH:mm)</label>
                  <Input {...form.register("time")} placeholder="06:00" />
                  {form.formState.errors.time && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.time.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mass Type</label>
                <Controller
                  name="massType"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-primary">
                        {[
                          "DAILY_MASS",
                          "SUNDAY_MASS",
                          "SPECIAL_MASS",
                          "HOLY_DAY_MASS",
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
                  )}
                />
                {form.formState.errors.massType && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.massType.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <Input {...form.register("language")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input {...form.register("location")} />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Create Template
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => {
          const dayTemplates = templates.filter((t) => t.dayOfWeek === day);
          if (dayTemplates.length === 0) return null;
          return (
            <Card key={day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dayTemplates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg">
                    <div>
                      <div className="font-semibold">
                        {t.time}{" "}
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          {t.massType}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.language} • {t.location}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
